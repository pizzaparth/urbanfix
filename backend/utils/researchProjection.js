import crypto from 'crypto';

// The ONE projection every research response goes through (privacy rule 1).
// Never hand a raw Mongoose document to a research endpoint.
//
// Deliberately omitted: citizenId, name, email, phone, the free-text
// `description` (citizen-written prose that may name people), the street-level
// `location`, the tracking id (the public tracker returns the description for
// it), images, and staff identities. Location is coarsened to ward.

export const RESEARCH_FIELDS = 'category urgencyLevel status ward createdAt';

// k-anonymity (B5). Every released record shares all its released fields with at
// least K - 1 others; smaller classes are withheld. Aggregate cells below MIN_CELL
// are suppressed. The generalisation (quarter filed, no closing date, no resolution
// time) was chosen on Chicago 311 data by analysis/privacy/scripts/linkage_analysis.py:
// in a system of 10 wards and 1,000 complaints a year it withholds the fewest records
// of the variants measured (results: analysis/privacy/results/linkage_chicago311.md).
export const K_ANONYMITY = 5;
export const MIN_CELL = 5;

// Key management. RESEARCH_HMAC_KEY lives only in the server environment (never in
// the database or the repository) and is used for nothing else. The server refuses
// to start without it (config/env.js). Rotating it changes every record ID, so new
// exports no longer join with older ones.
const masterKey = () => {
  const key = process.env.RESEARCH_HMAC_KEY;
  if (!key) throw new Error('RESEARCH_HMAC_KEY is not set.');
  return key;
};

// One key per research grant (per researcher account). A researcher's exports join
// with each other, but two researchers get different IDs for the same complaint
// and cannot link their exports.
export const grantKey = (researcherId) =>
  crypto.createHmac('sha256', masterKey()).update(`research-grant:${String(researcherId)}`).digest();

// Opaque and stable per record within one grant; not reversible to the Mongo id or
// the tracking id without the server key.
export const recordId = (key, id) =>
  crypto.createHmac('sha256', key).update(String(id)).digest('hex').slice(0, 12);

// Calendar quarter in UTC, e.g. 2026-Q3.
export const quarterOf = (d) => (d ? `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}` : null);

// Start of the UTC month or quarter that contains d.
export const periodStart = (d, unit) => {
  const m = unit === 'quarter' ? Math.floor(d.getUTCMonth() / 3) * 3 : d.getUTCMonth();
  return new Date(Date.UTC(d.getUTCFullYear(), m, 1));
};

// Start of the next UTC month or quarter after the one that contains d.
export const periodEnd = (d, unit) => {
  const start = periodStart(d, unit);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + (unit === 'quarter' ? 3 : 1), 1));
};

// Quasi-identifiers are generalised: quarter filed instead of day, no closing date,
// no resolution time (resolution times are available as suppressed aggregates).
export const toResearchRecord = (c, key) => ({
  recordId: recordId(key, c._id),
  category: c.category,
  urgency: c.urgencyLevel,
  status: c.status,
  ward: c.ward || 'Unknown',
  filedQuarter: quarterOf(c.createdAt ? new Date(c.createdAt) : null),
});

export const RECORD_COLUMNS = ['recordId', 'category', 'urgency', 'status', 'ward', 'filedQuarter'];

// Equivalence class of a complaint: every released field except the record ID.
// Computed in MongoDB (UTC, like quarterOf) so that class sizes need no documents.
export const CLASS_GROUP = {
  category: '$category',
  urgency: '$urgencyLevel',
  status: '$status',
  ward: { $ifNull: ['$ward', 'Unknown'] },
  year: { $year: '$createdAt' },
  quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } },
};

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Release order: newest quarter first, then category, urgency, status, ward; inside a
// class by record ID, so the order says nothing about filing times within a class.
export const orderClasses = (classes) =>
  [...classes].sort((a, b) => cmp(b.year * 10 + b.quarter, a.year * 10 + a.quarter)
    || cmp(a.category, b.category) || cmp(a.urgency, b.urgency) || cmp(a.status, b.status) || cmp(a.ward, b.ward));

// Query for the members of one class, within the researcher's own filter.
export const classMatch = (match, c) => {
  const start = new Date(Date.UTC(c.year, (c.quarter - 1) * 3, 1));
  const end = new Date(Date.UTC(c.year, c.quarter * 3, 1));
  const createdAt = { $gte: start, $lt: end };
  if (match.createdAt?.$gte > start) createdAt.$gte = match.createdAt.$gte;
  if (match.createdAt?.$lt < end) createdAt.$lt = match.createdAt.$lt;
  return {
    ...match,
    category: c.category,
    urgencyLevel: c.urgency,
    status: c.status,
    ward: c.ward === 'Unknown' ? null : c.ward,
    createdAt,
  };
};

const small = (n) => n > 0 && n < MIN_CELL;

// Minimum cell size for aggregates. A cell with fewer than MIN_CELL complaints shows
// no numbers. The resolved count is shown only when neither the resolved nor the
// unresolved part is a small group, and the mean resolution time only when it rests
// on at least MIN_CELL closed complaints.
export const suppressCell = ({ key, count, resolved, closed, avgResolutionDays }) => {
  if (small(count)) return { key, count: null, resolved: null, avgResolutionDays: null, suppressed: true };
  return {
    key,
    count,
    resolved: small(resolved) || small(count - resolved) ? null : resolved,
    avgResolutionDays: closed >= MIN_CELL ? avgResolutionDays : null,
  };
};

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows, columns) =>
  [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n');
