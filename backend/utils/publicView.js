// Allow-lists for what anyone can read about a complaint. Fields not named here
// stay private by default, including any field added to the model later.
// Checked by tests/privacy.test.js.

export const REGISTRY_FIELDS = [
  'trackingId', 'title', 'description', 'category', 'location', 'ward', 'status', 'stage',
  'urgencyLevel', 'urgencyScore', 'answers', 'images', 'completionImages', 'createdAt', 'closedAt',
  'statusHistory.status', 'statusHistory.stage', 'statusHistory.changedAt', 'statusHistory.remarks',
];

// The tracker also shows who acted, but only as a role label, and whether a receipt exists.
export const TRACKER_FIELDS = [...REGISTRY_FIELDS, 'statusHistory.changedBy', 'pdfReceiptUrl'];

export const REGISTRY_SELECT = REGISTRY_FIELDS.join(' ');
export const TRACKER_SELECT = TRACKER_FIELDS.join(' ');

const ROLE_LABEL = {
  citizen: 'Citizen',
  supervisor: 'Supervisor',
  field: 'Field staff',
  admin: 'Administrator',
};

// Replaces every actor in the history with a role label: no citizen names (the
// first entry is written by the filer) and no staff names on public pages.
export const toTrackerView = (complaint) => {
  const out = complaint.toObject ? complaint.toObject() : { ...complaint };
  out.statusHistory = (out.statusHistory || []).map((h) => {
    const role = h.changedBy?.role;
    return { ...h, changedBy: role ? { name: ROLE_LABEL[role] || 'Staff', role } : undefined };
  });
  if (out.answers instanceof Map) out.answers = Object.fromEntries(out.answers);
  return out;
};
