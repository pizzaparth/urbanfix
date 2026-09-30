// The complaint lifecycle. `status` (Pending | In Progress | Resolved | Rejected)
// is what citizens, the registry, the tracker and every chart read. `stage` is the
// internal, employee-facing detail. status is *derived* from stage here, and
// persisted alongside it so existing queries keep working untouched.

export const STAGES = [
  'submitted',
  'triage_rejected',
  'accepted',
  'assigned',
  'work_in_progress',
  'proof_submitted',
  'closed',
];

const STAGE_TO_STATUS = {
  submitted: 'Pending',
  triage_rejected: 'Rejected',
  accepted: 'In Progress',
  assigned: 'In Progress',
  work_in_progress: 'In Progress',
  proof_submitted: 'In Progress',
  closed: 'Resolved',
};

export const statusForStage = (stage) => STAGE_TO_STATUS[stage] || 'Pending';

// Used by the backfill script and by the admin's legacy status override.
const STATUS_TO_STAGE = {
  Pending: 'submitted',
  'In Progress': 'accepted',
  Resolved: 'closed',
  Rejected: 'triage_rejected',
};
export const stageForStatus = (status) => STATUS_TO_STAGE[status] || 'submitted';

export const TERMINAL_STAGES = ['triage_rejected', 'closed'];

// action -> { from, to, roles, remarks, note }
// Enforced server-side in services/complaintWorkflow.js.
export const TRANSITIONS = {
  accept: { from: ['submitted'], to: 'accepted', roles: ['supervisor', 'admin'], remarks: true },
  reject: { from: ['submitted'], to: 'triage_rejected', roles: ['supervisor', 'admin'], remarks: true },
  // Also allowed from `assigned`, so a supervisor can re-pick before work starts
  // (e.g. the chosen person goes on leave) without a rework round trip.
  assign: { from: ['accepted', 'assigned'], to: 'assigned', roles: ['supervisor', 'admin'] },
  start: { from: ['assigned'], to: 'work_in_progress', roles: ['field'], assignedOnly: true },
  proof: { from: ['work_in_progress'], to: 'proof_submitted', roles: ['field'], assignedOnly: true },
  close: { from: ['proof_submitted'], to: 'closed', roles: ['supervisor', 'admin'], remarks: true },
  rework: { from: ['proof_submitted'], to: 'assigned', roles: ['supervisor', 'admin'], remarks: true },
};

export const MIN_REMARKS = 10;

export const ACTIVE_FIELD_STAGES = ['assigned', 'work_in_progress', 'proof_submitted'];
