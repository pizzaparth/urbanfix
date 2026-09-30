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

// Opaque and stable per record, but not reversible to the Mongo id or the
// tracking id without the server secret.
const recordId = (id) =>
  crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'research')
    .update(String(id))
    .digest('hex')
    .slice(0, 12);

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

export const toResearchRecord = (c) => ({
  recordId: recordId(c._id),
  category: c.category,
  urgency: c.urgencyLevel,
  status: c.status,
  ward: c.ward || 'Unknown',
  // Day precision only — a timestamp adds nothing for analysis and helps re-identification.
  filedOn: day(c.createdAt),
  closedOn: day(c.closedAt),
  resolutionDays:
    c.closedAt && c.createdAt
      ? Math.round(((new Date(c.closedAt) - new Date(c.createdAt)) / 86400000) * 10) / 10
      : null,
});

export const RECORD_COLUMNS = [
  'recordId', 'category', 'urgency', 'status', 'ward', 'filedOn', 'closedOn', 'resolutionDays',
];

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows, columns) =>
  [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n');
