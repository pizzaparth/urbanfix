import Complaint from '../models/Complaint.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { validate } from '../utils/validate.js';
import { proofSchema } from '../validators/workflowValidator.js';
import { applyTransition } from '../services/complaintWorkflow.js';
import { ACTIVE_FIELD_STAGES } from '../utils/complaintStage.js';
import { redactCitizenActors } from '../utils/redactHistory.js';

const publicView = (complaint) => {
  const out = redactCitizenActors(complaint);
  delete out.citizenId;
  return out;
};

// Every :id is verified to be assigned to req.user — the app only showing a
// field employee their own tasks is not the control.
const loadOwnTask = async (id, user) => {
  const complaint = await Complaint.findById(id);
  if (!complaint) throw new AppError('No task found with this ID', 404);
  if (!complaint.assignedTo || !complaint.assignedTo.equals(user._id)) {
    throw new AppError('This task is not assigned to you.', 403);
  }
  return complaint;
};

// 1. Tasks
export const getTasks = catchAsync(async (req, res) => {
  const { state = 'active' } = req.query;
  const stage = state === 'completed' ? 'closed' : { $in: ACTIVE_FIELD_STAGES };

  const tasks = await Complaint.find({ assignedTo: req.user._id, stage })
    .select('-citizenId')
    .sort({ assignedAt: -1 })
    .limit(100);

  res.status(200).json({ status: 'success', results: tasks.length, tasks });
});

export const getTask = catchAsync(async (req, res) => {
  const complaint = await loadOwnTask(req.params.id, req.user);
  await complaint.populate({ path: 'statusHistory.changedBy', select: 'name role' });
  res.status(200).json({ status: 'success', task: publicView(complaint) });
});

// 2. Start work
export const startTask = catchAsync(async (req, res) => {
  const complaint = await loadOwnTask(req.params.id, req.user);
  await applyTransition(complaint, 'start', req.user);
  res.status(200).json({ status: 'success', task: publicView(complaint) });
});

// 3. Submit proof (multipart: up to 3 images + completionNote)
export const submitProof = catchAsync(async (req, res, next) => {
  const complaint = await loadOwnTask(req.params.id, req.user);
  const { completionNote } = validate(proofSchema, req.body);

  if (!req.files || req.files.length === 0) {
    return next(new AppError('Attach at least one photo of the completed work.', 400));
  }
  const images = req.files.map((f) => `/uploads/${f.filename}`);

  await applyTransition(complaint, 'proof', req.user, { images, note: completionNote });
  res.status(200).json({ status: 'success', task: publicView(complaint) });
});

// 4. Stats
export const getStats = catchAsync(async (req, res) => {
  const [counts, turnaround] = await Promise.all([
    Complaint.aggregate([
      { $match: { assignedTo: req.user._id } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: { assignedTo: req.user._id, stage: 'closed', closedAt: { $ne: null }, assignedAt: { $ne: null } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ['$closedAt', '$assignedAt'] } } } },
    ]),
  ]);
  const by = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  res.status(200).json({
    status: 'success',
    stats: {
      assigned: by.assigned || 0,
      inProgress: by.work_in_progress || 0,
      awaitingReview: by.proof_submitted || 0,
      completed: by.closed || 0,
      completedThisWeek: await Complaint.countDocuments({
        assignedTo: req.user._id,
        stage: 'closed',
        closedAt: { $gte: weekAgo },
      }),
      avgTurnaroundDays: turnaround[0] ? Math.round((turnaround[0].avgMs / 86400000) * 10) / 10 : null,
    },
  });
});
