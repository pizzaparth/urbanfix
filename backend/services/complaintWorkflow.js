import User from '../models/User.js';
import LeaveRequest from '../models/LeaveRequest.js';
import AppError from '../utils/appError.js';
import {
  TRANSITIONS,
  MIN_REMARKS,
  statusForStage,
  stageForStatus,
} from '../utils/complaintStage.js';
import { sendStatusUpdateEmail, sendResolutionEmailWithPdf } from './emailService.js';
import { generateResolutionPdf } from './pdfService.js';
import { redactText } from '../utils/redactText.js';

const STAGE_LABEL = {
  submitted: 'Submitted',
  triage_rejected: 'Rejected at triage',
  accepted: 'Accepted',
  assigned: 'Assigned to field staff',
  work_in_progress: 'Work in progress',
  proof_submitted: 'Proof submitted',
  closed: 'Closed',
};
export const stageLabel = (stage) => STAGE_LABEL[stage] || stage;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// True when the employee has an approved leave window covering today.
export const isOnLeaveToday = async (employeeId) => {
  const today = startOfToday();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  const leave = await LeaveRequest.exists({
    employeeId,
    status: 'approved',
    fromDate: { $lte: end },
    toDate: { $gte: today },
  });
  return Boolean(leave);
};

// Enforced when a supervisor/admin picks a field employee for a complaint.
const resolveAssignee = async (complaint, fieldEmployeeId, actor) => {
  if (!fieldEmployeeId) throw new AppError('Choose a field employee to assign.', 400);

  const assignee = await User.findById(fieldEmployeeId);
  if (!assignee || assignee.role !== 'field') {
    throw new AppError('That user is not a field employee.', 400);
  }
  if (assignee.isActive === false) {
    throw new AppError('That field employee has been deactivated.', 400);
  }
  // Supervisors assign within a ward; an admin can override that.
  if (
    actor.role !== 'admin' &&
    complaint.ward &&
    assignee.employee?.ward &&
    assignee.employee.ward !== complaint.ward
  ) {
    throw new AppError(
      `This complaint is in ${complaint.ward}; ${assignee.name} covers ${assignee.employee.ward}.`,
      400
    );
  }
  if (await isOnLeaveToday(assignee._id)) {
    throw new AppError(`${assignee.name} is on approved leave today.`, 400);
  }
  return assignee;
};

// Closing fields, set before the save. Shared by the supervisor's `close` and the
// admin's legacy status override so both behave identically.
const markClosed = (complaint) => {
  complaint.pdfReceiptUrl = `/api/complaints/download-receipt/${complaint.trackingId}`;
  complaint.closedAt = new Date();
};

// Citizen emails run only after the save succeeded, so a request that loses a race
// (VersionError) sends nothing. A failed email never undoes a saved transition.
const notifyCitizen = async (complaint, { closed, statusChanged, remarks }) => {
  if (!closed && !statusChanged) return;
  try {
    await complaint.populate('citizenId');
    const email = complaint.citizenId?.email;
    if (!email) return;
    if (closed) {
      const pdfBuffer = await generateResolutionPdf(complaint);
      await sendResolutionEmailWithPdf(email, complaint.trackingId, remarks, pdfBuffer);
    } else {
      await sendStatusUpdateEmail(email, complaint.trackingId, complaint.status, remarks);
    }
  } catch (err) {
    console.error('Citizen notification failed:', err.message);
  }
};

/**
 * The one place a complaint's stage changes. Validates the transition table
 * (who / from where / required input), updates stage + derived status, appends to
 * statusHistory, and fires the citizen-facing email when the *public* status moved.
 */
export const applyTransition = async (complaint, action, actor, input = {}) => {
  const rule = TRANSITIONS[action];
  if (!rule) throw new AppError('Unknown action.', 400);

  if (!rule.roles.includes(actor.role)) {
    throw new AppError('You do not have permission to perform this action.', 403);
  }
  if (!rule.from.includes(complaint.stage)) {
    throw new AppError(
      `Cannot ${action} a complaint that is "${stageLabel(complaint.stage)}".`,
      400
    );
  }
  if (rule.assignedOnly && !(complaint.assignedTo && complaint.assignedTo.equals(actor._id))) {
    throw new AppError('This task is not assigned to you.', 403);
  }

  // Remarks and notes are published in the tracker, so identifiers are removed.
  const remarks = redactText((input.remarks || '').trim());
  if (rule.remarks && remarks.length < MIN_REMARKS) {
    throw new AppError(`Remarks must be at least ${MIN_REMARKS} characters long.`, 400);
  }

  const prevStatus = complaint.status;
  let historyRemarks = remarks;

  if (action === 'assign') {
    const assignee = await resolveAssignee(complaint, input.fieldEmployeeId, actor);
    complaint.assignedTo = assignee._id;
    complaint.assignedBy = actor._id;
    complaint.assignedAt = new Date();
    historyRemarks = `Assigned to ${assignee.name}.${input.note ? ` ${redactText(input.note.trim())}` : ''}`;
  }

  if (action === 'start') {
    historyRemarks = 'Work started on site.';
  }

  if (action === 'proof') {
    complaint.completionImages = input.images || [];
    complaint.completionNote = redactText((input.note || '').trim());
    historyRemarks = complaint.completionNote || 'Completion proof submitted for review.';
  }

  complaint.stage = rule.to;
  complaint.status = statusForStage(rule.to);
  if (remarks) complaint.remarks = remarks;

  complaint.statusHistory.push({
    status: complaint.status,
    stage: complaint.stage,
    changedBy: actor._id,
    remarks: historyRemarks,
  });

  if (action === 'close') markClosed(complaint);

  // Optimistic concurrency (models/Complaint.js): if another request moved this
  // complaint after it was loaded, save() throws a VersionError (answered with 409)
  // and nothing is written.
  await complaint.save();

  // Accept / reject moved the public status; assign/start/proof did not, so
  // citizens are not emailed for every internal hand-off.
  if (action === 'close') {
    await notifyCitizen(complaint, { closed: true, remarks });
  } else {
    notifyCitizen(complaint, { statusChanged: complaint.status !== prevStatus, remarks });
  }
  return complaint;
};

/**
 * The admin's long-standing status override (PATCH /admin/complaints/:id/status).
 * Kept so an admin can still force any legal public-status move on any complaint,
 * but it now keeps `stage` in step so the two fields never disagree.
 */
export const applyAdminOverride = async (complaint, newStatus, actor, rawRemarks) => {
  const remarks = redactText(rawRemarks);
  complaint.status = newStatus;
  complaint.stage = stageForStatus(newStatus);
  complaint.remarks = remarks;
  complaint.statusHistory.push({
    status: newStatus,
    stage: complaint.stage,
    changedBy: actor._id,
    remarks,
  });

  const closed = newStatus === 'Resolved';
  if (closed) markClosed(complaint);

  await complaint.save();
  await notifyCitizen(complaint, { closed, statusChanged: true, remarks });
  return complaint;
};
