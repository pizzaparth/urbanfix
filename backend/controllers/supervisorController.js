import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { validate } from '../utils/validate.js';
import { remarksSchema, assignSchema } from '../validators/workflowValidator.js';
import { applyTransition, isOnLeaveToday } from '../services/complaintWorkflow.js';
import { STAGES, ACTIVE_FIELD_STAGES } from '../utils/complaintStage.js';
import { getStatusBreakdown } from '../utils/statsHelpers.js';
import { dateKey } from './attendanceController.js';
import { redactCitizenActors } from '../utils/redactHistory.js';

// What needs a supervisor's hands: triage, assignment, proof review.
const ATTENTION_STAGES = ['submitted', 'accepted', 'proof_submitted'];

// Citizen identity is deliberately never populated for employees — triage
// needs the description, photos and location, not who filed it.
const withStaff = (q) => q.populate('assignedTo', 'name employee.ward employee.employeeCode');

const loadComplaint = async (id) => {
  const complaint = await Complaint.findById(id);
  if (!complaint) throw new AppError('No complaint found with this ID', 404);
  return complaint;
};

// 1. Queue
export const getQueue = catchAsync(async (req, res) => {
  const { stage = 'attention', ward, search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (stage === 'attention') query.stage = { $in: ATTENTION_STAGES };
  else if (stage !== 'all' && STAGES.includes(stage)) query.stage = stage;

  if (ward === 'none') query.ward = null;
  else if (ward) query.ward = ward;

  if (search) {
    query.$or = [
      { trackingId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [complaints, total, stageCounts] = await Promise.all([
    withStaff(
      Complaint.find(query)
        .select('-citizenId')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
    ),
    Complaint.countDocuments(query),
    Complaint.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
  ]);

  res.status(200).json({
    status: 'success',
    pagination: { total, pages: Math.ceil(total / limitNum), currentPage: pageNum, limit: limitNum },
    stageCounts: Object.fromEntries(stageCounts.map((s) => [s._id, s.count])),
    complaints,
  });
});

export const getComplaint = catchAsync(async (req, res, next) => {
  const complaint = await withStaff(
    Complaint.findById(req.params.id)
      .select('-citizenId')
      .populate({ path: 'statusHistory.changedBy', select: 'name role' })
  );
  if (!complaint) return next(new AppError('No complaint found with this ID', 404));
  res.status(200).json({ status: 'success', complaint: redactCitizenActors(complaint) });
});

// 2. Transitions
const transitionHandler = (action, schema) =>
  catchAsync(async (req, res) => {
    const input = schema ? validate(schema, req.body) : {};
    const complaint = await loadComplaint(req.params.id);
    await applyTransition(complaint, action, req.user, input);
    await complaint.populate('assignedTo', 'name employee.ward employee.employeeCode');
    // applyTransition may have populated the citizen to email them; never echo
    // their identity back to staff.
    const out = complaint.toObject();
    delete out.citizenId;
    res.status(200).json({ status: 'success', complaint: out });
  });

export const acceptComplaint = transitionHandler('accept', remarksSchema);
export const rejectComplaint = transitionHandler('reject', remarksSchema);
export const assignComplaint = transitionHandler('assign', assignSchema);
export const closeComplaint = transitionHandler('close', remarksSchema);
export const reworkComplaint = transitionHandler('rework', remarksSchema);

// 3. Field roster with live workload
export const getFieldStaff = catchAsync(async (req, res) => {
  const { ward } = req.query;
  const filter = { role: 'field', isActive: true };
  if (ward) filter['employee.ward'] = ward;

  const staff = await User.find(filter)
    .select('name email employee lastLoginAt')
    .sort({ 'employee.ward': 1, name: 1 })
    .lean();
  const ids = staff.map((u) => u._id);

  const [workload, attendance] = await Promise.all([
    Complaint.aggregate([
      { $match: { assignedTo: { $in: ids } } },
      {
        $group: {
          _id: '$assignedTo',
          active: { $sum: { $cond: [{ $in: ['$stage', ACTIVE_FIELD_STAGES] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$stage', 'closed'] }, 1, 0] } },
        },
      },
    ]),
    AttendanceRecord.find({ employeeId: { $in: ids }, date: dateKey() }).lean(),
  ]);

  const loadBy = new Map(workload.map((w) => [String(w._id), w]));
  const attBy = new Map(attendance.map((a) => [String(a.employeeId), a]));

  const roster = await Promise.all(
    staff.map(async (u) => ({
      ...u,
      activeTasks: loadBy.get(String(u._id))?.active || 0,
      completedTasks: loadBy.get(String(u._id))?.completed || 0,
      checkedInToday: Boolean(attBy.get(String(u._id))),
      onLeaveToday: await isOnLeaveToday(u._id),
      isMine: String(u.employee?.supervisorId) === String(req.user._id),
    }))
  );

  res.status(200).json({ status: 'success', results: roster.length, staff: roster });
});

// 4. Stats
export const getStats = catchAsync(async (req, res) => {
  const [statusBreakdown, stageAgg, turnaround] = await Promise.all([
    getStatusBreakdown(),
    Complaint.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { stage: 'closed', closedAt: { $ne: null } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ['$closedAt', '$createdAt'] } }, n: { $sum: 1 } } },
    ]),
  ]);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const closedThisWeek = await Complaint.countDocuments({ stage: 'closed', closedAt: { $gte: weekAgo } });

  res.status(200).json({
    status: 'success',
    stats: {
      statusBreakdown,
      stageCounts: Object.fromEntries(stageAgg.map((s) => [s._id, s.count])),
      awaitingTriage: stageAgg.find((s) => s._id === 'submitted')?.count || 0,
      awaitingAssignment: stageAgg.find((s) => s._id === 'accepted')?.count || 0,
      awaitingReview: stageAgg.find((s) => s._id === 'proof_submitted')?.count || 0,
      closedThisWeek,
      avgResolutionDays: turnaround[0] ? Math.round((turnaround[0].avgMs / 86400000) * 10) / 10 : null,
    },
  });
});
