import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import ResearchApplication from '../models/ResearchApplication.js';
import ResearchAccessLog from '../models/ResearchAccessLog.js';
import ExportQuota from '../models/ExportQuota.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { validate } from '../utils/validate.js';
import { applySchema, querySchema } from '../validators/researchValidator.js';
import {
  toResearchRecord, grantKey, orderClasses, classMatch, CLASS_GROUP, suppressCell, periodStart, periodEnd,
  RESEARCH_FIELDS, RECORD_COLUMNS, K_ANONYMITY, MIN_CELL, toCsv,
} from '../utils/researchProjection.js';
import { appendAuditLog } from '../utils/auditLog.js';
import { getStatusBreakdown } from '../utils/statsHelpers.js';
import { sendResearchReceivedEmail } from '../services/emailService.js';

const EXPORT_DAILY_LIMIT = 5;
const EXPORT_ROW_CAP = 5000;
const RECORD_PAGE_SIZE = 50;

// Every research call appends one row to the hash-chained audit log. `filters` is
// the validated query, never the raw query string.
const logAccess = (req, action, { recordCount = 0, filters, exportFormat } = {}) =>
  appendAuditLog({
    researcherId: req.user._id,
    action,
    recordCount,
    filters: filters ?? null,
    exportFormat,
    ipAddress: req.ip,
  });

const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

// Atomically takes one export from today's quota. Returns false when the quota is
// used up. The filter `used < limit` and the increment are one database operation,
// so parallel requests cannot all pass a separate count check (the old race).
const consumeExportQuota = async (researcherId) => {
  const filter = { researcherId, day: utcDay(), used: { $lt: EXPORT_DAILY_LIMIT } };
  const update = { $inc: { used: 1 } };
  try {
    return Boolean(await ExportQuota.findOneAndUpdate(filter, update, { upsert: true, new: true }));
  } catch (err) {
    // Duplicate key: either the counter is at the limit (the filter missed, so the
    // upsert tried to insert a second counter) or a parallel request created it first.
    if (err.code !== 11000) throw err;
    return Boolean(await ExportQuota.findOneAndUpdate(filter, update, { new: true }));
  }
};

const exportsUsedToday = async (researcherId) =>
  (await ExportQuota.findOne({ researcherId, day: utcDay() }).lean())?.used || 0;

// Admins may see everything; a researcher only what their approval granted.
const canSeeRecords = (user) =>
  user.role === 'admin' || user.researcher?.datasetScope === 'anonymised_records';

// Date filters are widened to whole released periods (quarters for records, months
// for aggregates). A filter at day precision would split a quarter into days and undo
// the generalisation, and two overlapping date ranges could be differenced.
const buildMatch = ({ category, ward, status, from, to }, unit) => {
  const m = {};
  if (category) m.category = category;
  if (ward) m.ward = ward === 'Unknown' ? null : ward;
  if (status) m.status = status;
  if (from || to) {
    m.createdAt = {};
    if (from) m.createdAt.$gte = periodStart(from, unit);
    if (to) m.createdAt.$lt = periodEnd(to, unit);
  }
  return m;
};

// Records that survive k-anonymity, in release order, from position `offset`.
// Class sizes are counted in MongoDB over every matching complaint (not one page);
// classes smaller than k are withheld. Only the classes that overlap the requested
// window are read, and only their IDs. The number withheld is not returned: by
// narrowing the filters to one class a researcher could read a withheld class's size.
const releasedRecords = async (match, researcherId, offset, limit) => {
  const classes = orderClasses(
    (await Complaint.aggregate([
      { $match: match },
      { $group: { _id: CLASS_GROUP, n: { $sum: 1 } } },
      { $match: { n: { $gte: K_ANONYMITY } } },
    ])).map((c) => ({ ...c._id, n: c.n }))
  );
  const total = classes.reduce((n, c) => n + c.n, 0);
  const key = grantKey(researcherId);
  const records = [];
  let start = 0;
  for (const c of classes) {
    const end = start + c.n;
    if (end > offset && start < offset + limit) {
      const docs = await Complaint.find(classMatch(match, c)).select(RESEARCH_FIELDS).lean();
      const rows = docs.map((d) => toResearchRecord(d, key)).sort((x, y) => (x.recordId < y.recordId ? -1 : 1));
      records.push(...rows.slice(Math.max(0, offset - start), offset + limit - start));
    }
    start = end;
    if (start >= offset + limit) break;
  }
  return { total, records };
};

const PRIVACY_NOTE = {
  k: K_ANONYMITY,
  minCell: MIN_CELL,
  note: `Records in groups of fewer than ${K_ANONYMITY} identical records are withheld; `
    + `counts below ${MIN_CELL} are not shown. Dates are filtered by whole quarter (records) or month (aggregates).`,
};

const GROUP_KEYS = {
  category: '$category',
  ward: { $ifNull: ['$ward', 'Unknown'] },
  status: '$status',
  urgency: '$urgencyLevel',
  month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
};

const groupRows = async (groupBy, match) => {
  const rows = await Complaint.aggregate([
    { $match: match },
    {
      $group: {
        _id: GROUP_KEYS[groupBy],
        count: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $gt: ['$closedAt', null] }, 1, 0] } },
        avgMs: {
          $avg: {
            $cond: [{ $gt: ['$closedAt', null] }, { $subtract: ['$closedAt', '$createdAt'] }, null],
          },
        },
      },
    },
    { $sort: groupBy === 'month' ? { _id: 1 } : { count: -1 } },
  ]);
  return rows.map((r) => suppressCell({
    key: r._id ?? 'Unknown',
    count: r.count,
    resolved: r.resolved,
    closed: r.closed,
    avgResolutionDays: r.avgMs != null ? Math.round((r.avgMs / 86400000) * 10) / 10 : null,
  }));
};

// 1. Public application (no auth)
export const apply = catchAsync(async (req, res, next) => {
  const data = validate(applySchema, req.body);

  const open = await ResearchApplication.exists({ email: data.email, status: 'pending' });
  if (open) {
    return next(new AppError('You already have an application awaiting review for this email.', 409));
  }

  const application = await ResearchApplication.create(data);
  sendResearchReceivedEmail(data.email, data.fullName, String(application._id)).catch(() => {});

  res.status(201).json({
    status: 'success',
    message: 'Application received. You will hear back by email.',
    referenceId: String(application._id),
  });
});

// 2. Dashboard (aggregates — always allowed)
export const getDashboard = catchAsync(async (req, res) => {
  const [statusBreakdown, byCategory, byWard, byUrgency, byMonth] = await Promise.all([
    getStatusBreakdown(),
    groupRows('category', {}),
    groupRows('ward', {}),
    groupRows('urgency', {}),
    groupRows('month', {}),
  ]);

  const total = statusBreakdown.total || 0;
  await logAccess(req, 'view_dashboard', { recordCount: total });

  res.status(200).json({
    status: 'success',
    dashboard: { statusBreakdown, byCategory, byWard, byUrgency, byMonth: byMonth.slice(-12) },
  });
});

// 3. Filtered aggregates, or pseudonymised records where the scope allows
export const runQuery = catchAsync(async (req, res, next) => {
  const q = validate(querySchema, req.query);

  if (q.records === 'true') {
    if (!canSeeRecords(req.user)) {
      return next(new AppError('Your access is limited to aggregate statistics.', 403, 'SCOPE_AGGREGATE_ONLY'));
    }
    const { total, records } = await releasedRecords(
      buildMatch(q, 'quarter'), req.user._id, (q.page - 1) * RECORD_PAGE_SIZE, RECORD_PAGE_SIZE
    );
    await logAccess(req, 'query', { recordCount: records.length, filters: q });
    return res.status(200).json({
      status: 'success',
      pagination: { total, pages: Math.ceil(total / RECORD_PAGE_SIZE), currentPage: q.page, limit: RECORD_PAGE_SIZE },
      privacy: PRIVACY_NOTE,
      records,
    });
  }

  const rows = await groupRows(q.groupBy, buildMatch(q, 'month'));
  await logAccess(req, 'query', {
    recordCount: rows.reduce((n, r) => n + (r.count ?? 0), 0),
    filters: q,
  });
  res.status(200).json({ status: 'success', groupBy: q.groupBy, privacy: PRIVACY_NOTE, rows });
});

// 4. Export — pseudonymised, k-anonymised, rate-limited, capped
export const exportData = catchAsync(async (req, res, next) => {
  const q = validate(querySchema, req.query);
  const format = req.query.format === 'json' ? 'json' : 'csv';

  const wantRecords = q.records === 'true';
  if (wantRecords && !canSeeRecords(req.user)) {
    return next(new AppError('Your access is limited to aggregate statistics.', 403, 'SCOPE_AGGREGATE_ONLY'));
  }

  if (req.user.role !== 'admin' && !(await consumeExportQuota(req.user._id))) {
    return next(
      new AppError(`Export limit reached (${EXPORT_DAILY_LIMIT} per day, UTC). Try again tomorrow.`, 429, 'EXPORT_RATE_LIMITED')
    );
  }

  let rows;
  let columns;
  if (wantRecords) {
    rows = (await releasedRecords(buildMatch(q, 'quarter'), req.user._id, 0, EXPORT_ROW_CAP)).records;
    columns = RECORD_COLUMNS;
  } else {
    rows = await groupRows(q.groupBy, buildMatch(q, 'month'));
    columns = ['key', 'count', 'resolved', 'avgResolutionDays'];
  }

  await logAccess(req, 'export', { recordCount: rows.length, filters: q, exportFormat: format });

  const stamp = new Date().toISOString().slice(0, 10);
  const name = `urbanfix-${wantRecords ? 'records' : q.groupBy}-${stamp}.${format}`;
  res.setHeader('Content-Disposition', `attachment; filename=${name}`);
  res.setHeader('X-Export-Filename', name);
  res.setHeader('Access-Control-Expose-Headers', 'X-Export-Filename, Content-Disposition');

  if (format === 'json') {
    return res.status(200).json({ exportedAt: new Date().toISOString(), rowCount: rows.length, privacy: PRIVACY_NOTE, rows });
  }
  res.status(200).type('text/csv').send(toCsv(rows, columns));
});

// 5. The researcher's own profile + usage stats
export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate('researcher.applicationId', 'purpose requestedDays');
  const expires = user.researcher?.accessExpiresAt;
  const daysRemaining = expires ? Math.max(0, Math.ceil((expires - new Date()) / 86400000)) : 0;

  const usage = await ResearchAccessLog.aggregate([
    { $match: { researcherId: user._id } },
    { $group: { _id: '$action', count: { $sum: 1 }, records: { $sum: '$recordCount' }, last: { $max: '$createdAt' } } },
  ]);
  const by = Object.fromEntries(usage.map((u) => [u._id, u]));

  const exportsToday = await exportsUsedToday(user._id);

  res.status(200).json({
    status: 'success',
    profile: {
      name: user.name,
      email: user.email,
      institute: user.researcher?.institute,
      title: user.researcher?.title,
      datasetScope: user.researcher?.datasetScope,
      accessGrantedAt: user.researcher?.accessGrantedAt,
      accessExpiresAt: expires,
      daysRemaining,
    },
    usage: {
      dashboardViews: by.view_dashboard?.count || 0,
      queries: by.query?.count || 0,
      exports: by.export?.count || 0,
      recordsViewed: (by.query?.records || 0) + (by.view_dashboard?.records || 0),
      recordsDownloaded: by.export?.records || 0,
      lastExportAt: by.export?.last || null,
      exportsRemainingToday: Math.max(0, EXPORT_DAILY_LIMIT - exportsToday),
      exportDailyLimit: EXPORT_DAILY_LIMIT,
      exportRowCap: EXPORT_ROW_CAP,
    },
  });
});
