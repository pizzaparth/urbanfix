import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import ResearchApplication from '../models/ResearchApplication.js';
import ResearchAccessLog from '../models/ResearchAccessLog.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { validate } from '../utils/validate.js';
import { applySchema, querySchema } from '../validators/researchValidator.js';
import { toResearchRecord, RESEARCH_FIELDS, RECORD_COLUMNS, toCsv } from '../utils/researchProjection.js';
import { getStatusBreakdown } from '../utils/statsHelpers.js';
import { sendResearchReceivedEmail } from '../services/emailService.js';

const EXPORT_DAILY_LIMIT = 5;
const EXPORT_ROW_CAP = 5000;
const RECORD_PAGE_SIZE = 50;

const logAccess = (req, action, { recordCount = 0, filters, exportFormat } = {}) =>
  ResearchAccessLog.create({
    researcherId: req.user._id,
    action,
    recordCount,
    filters,
    exportFormat,
    ipAddress: req.ip,
  });

// Admins may see everything; a researcher only what their approval granted.
const canSeeRecords = (user) =>
  user.role === 'admin' || user.researcher?.datasetScope === 'anonymised_records';

const buildMatch = ({ category, ward, status, from, to }) => {
  const m = {};
  if (category) m.category = category;
  if (ward) m.ward = ward === 'Unknown' ? null : ward;
  if (status) m.status = status;
  if (from || to) {
    m.createdAt = {};
    if (from) m.createdAt.$gte = from;
    if (to) m.createdAt.$lte = to;
  }
  return m;
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
        avgMs: {
          $avg: {
            $cond: [{ $gt: ['$closedAt', null] }, { $subtract: ['$closedAt', '$createdAt'] }, null],
          },
        },
      },
    },
    { $sort: groupBy === 'month' ? { _id: 1 } : { count: -1 } },
  ]);
  return rows.map((r) => ({
    key: r._id ?? 'Unknown',
    count: r.count,
    resolved: r.resolved,
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

// 3. Filtered aggregates, or anonymised records where the scope allows
export const runQuery = catchAsync(async (req, res, next) => {
  const q = validate(querySchema, req.query);
  const match = buildMatch(q);

  if (q.records === 'true') {
    if (!canSeeRecords(req.user)) {
      return next(new AppError('Your access is limited to aggregate statistics.', 403, 'SCOPE_AGGREGATE_ONLY'));
    }
    const [docs, total] = await Promise.all([
      Complaint.find(match)
        .select(RESEARCH_FIELDS)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * RECORD_PAGE_SIZE)
        .limit(RECORD_PAGE_SIZE)
        .lean(),
      Complaint.countDocuments(match),
    ]);
    const records = docs.map(toResearchRecord);
    await logAccess(req, 'query', { recordCount: records.length, filters: req.query });
    return res.status(200).json({
      status: 'success',
      pagination: { total, pages: Math.ceil(total / RECORD_PAGE_SIZE), currentPage: q.page, limit: RECORD_PAGE_SIZE },
      records,
    });
  }

  const rows = await groupRows(q.groupBy, match);
  await logAccess(req, 'query', {
    recordCount: rows.reduce((n, r) => n + r.count, 0),
    filters: req.query,
  });
  res.status(200).json({ status: 'success', groupBy: q.groupBy, rows });
});

// 4. Export — anonymised, rate-limited, capped
export const exportData = catchAsync(async (req, res, next) => {
  const q = validate(querySchema, req.query);
  const format = req.query.format === 'json' ? 'json' : 'csv';
  const match = buildMatch(q);

  if (req.user.role !== 'admin') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await ResearchAccessLog.countDocuments({
      researcherId: req.user._id,
      action: 'export',
      createdAt: { $gte: since },
    });
    if (used >= EXPORT_DAILY_LIMIT) {
      return next(
        new AppError(`Export limit reached (${EXPORT_DAILY_LIMIT} per day). Try again tomorrow.`, 429, 'EXPORT_RATE_LIMITED')
      );
    }
  }

  const wantRecords = q.records === 'true';
  if (wantRecords && !canSeeRecords(req.user)) {
    return next(new AppError('Your access is limited to aggregate statistics.', 403, 'SCOPE_AGGREGATE_ONLY'));
  }

  let rows;
  let columns;
  if (wantRecords) {
    const docs = await Complaint.find(match).select(RESEARCH_FIELDS).sort({ createdAt: -1 }).limit(EXPORT_ROW_CAP).lean();
    rows = docs.map(toResearchRecord);
    columns = RECORD_COLUMNS;
  } else {
    rows = await groupRows(q.groupBy, match);
    columns = ['key', 'count', 'resolved', 'avgResolutionDays'];
  }

  await logAccess(req, 'export', { recordCount: rows.length, filters: req.query, exportFormat: format });

  const stamp = new Date().toISOString().slice(0, 10);
  const name = `urbanfix-${wantRecords ? 'records' : q.groupBy}-${stamp}.${format}`;
  res.setHeader('Content-Disposition', `attachment; filename=${name}`);
  res.setHeader('X-Export-Filename', name);
  res.setHeader('Access-Control-Expose-Headers', 'X-Export-Filename, Content-Disposition');

  if (format === 'json') {
    return res.status(200).json({ exportedAt: new Date().toISOString(), rowCount: rows.length, rows });
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

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const exportsToday = await ResearchAccessLog.countDocuments({
    researcherId: user._id,
    action: 'export',
    createdAt: { $gte: since },
  });

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
