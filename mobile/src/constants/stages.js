// Internal workflow stages (backend/utils/complaintStage.js). Citizens only ever
// see the four-value public `status`; stages are for employees and the tracker's
// audit trail.
export const STAGE_LABEL = {
  submitted: 'Submitted',
  triage_rejected: 'Rejected at triage',
  accepted: 'Accepted',
  assigned: 'Assigned',
  work_in_progress: 'In progress',
  proof_submitted: 'Proof submitted',
  closed: 'Closed',
};

export const stageLabel = (stage) => STAGE_LABEL[stage] || stage || '';

// Stage filter pills on the supervisor queue. `attention` is the server's
// default: what needs a supervisor's hands.
export const QUEUE_FILTERS = [
  { value: 'attention', label: 'Needs action' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'work_in_progress', label: 'In progress' },
  { value: 'proof_submitted', label: 'Proof' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];
