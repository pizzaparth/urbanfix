import crypto from 'crypto';

// The ONE projection every research response goes through (privacy rule 1).
// Never hand a raw Mongoose document to a research endpoint.
//
// Deliberately omitted: citizenId, name, email, phone, the free-text
// `description` (citizen-written prose that may name people), the street-level
// `location`, the tracking id (the public tracker returns the description for
// it), images, and staff identities. Location is coarsened to ward.

export const RESEARCH_FIELDS =
  'category urgencyLevel status stage ward createdAt closedAt';

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

// ISO 8601 week, e.g. 2026-W07. Coarser than a day: fewer records are unique on
// (category, ward, time), which is what lets a neighbour single one out.
export const isoWeek = (d) => {
  if (!d) return null;
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday); // Thursday decides the year
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

// Quasi-identifiers are generalised: week filed instead of day, no closing date,
// resolution time in whole days.
export const toResearchRecord = (c, key) => ({
  recordId: recordId(key, c._id),
  category: c.category,
  urgency: c.urgencyLevel,
  status: c.status,
  ward: c.ward || 'Unknown',
  filedWeek: isoWeek(c.createdAt ? new Date(c.createdAt) : null),
  resolutionDays:
    c.closedAt && c.createdAt
      ? Math.round((new Date(c.closedAt) - new Date(c.createdAt)) / 86400000)
      : null,
});

export const RECORD_COLUMNS = ['recordId', 'category', 'urgency', 'status', 'ward', 'filedWeek', 'resolutionDays'];

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows, columns) =>
  [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n');
