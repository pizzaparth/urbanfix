import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { validate } from '../utils/validate.js';
import { leaveSchema, leaveDecisionSchema } from '../validators/workflowValidator.js';

// Shared by the field and supervisor routers: an employee's own leave.
export const applyLeave = catchAsync(async (req, res, next) => {
  const { fromDate, toDate, reason } = validate(leaveSchema, req.body);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (fromDate < today) {
    return next(new AppError('Leave cannot start in the past.', 400));
  }

  const overlap = await LeaveRequest.exists({
    employeeId: req.user._id,
    status: { $in: ['pending', 'approved'] },
    fromDate: { $lte: toDate },
    toDate: { $gte: fromDate },
  });
  if (overlap) {
    return next(new AppError('You already have a leave request covering some of those dates.', 400));
  }

  const leave = await LeaveRequest.create({ employeeId: req.user._id, fromDate, toDate, reason });
  res.status(201).json({ status: 'success', leave });
});

export const myLeave = catchAsync(async (req, res) => {
  const leave = await LeaveRequest.find({ employeeId: req.user._id })
    .populate('decidedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ status: 'success', results: leave.length, leave });
});

// Pending requests a decider may act on. Supervisors see their own staff's;
// admins see everyone's (which is how a supervisor's own leave gets approved).
export const listPendingLeave = catchAsync(async (req, res) => {
  const filter = { status: 'pending' };
  if (req.user.role === 'supervisor') {
    const staff = await User.find({ 'employee.supervisorId': req.user._id }).select('_id');
    filter.employeeId = { $in: staff.map((u) => u._id) };
  }
  const leave = await LeaveRequest.find(filter)
    .populate('employeeId', 'name role employee.ward employee.employeeCode')
    .sort({ fromDate: 1 });
  res.status(200).json({ status: 'success', results: leave.length, leave });
});

export const decideLeave = catchAsync(async (req, res, next) => {
  const { decision, note } = validate(leaveDecisionSchema, req.body);

  const leave = await LeaveRequest.findById(req.params.id).populate('employeeId', 'role employee.supervisorId');
  if (!leave) return next(new AppError('No leave request found with this ID', 404));
  if (leave.status !== 'pending') {
    return next(new AppError('This request has already been decided.', 400));
  }

  const applicant = leave.employeeId;
  if (req.user.role === 'supervisor') {
    // Supervisors decide their own staff's leave; a supervisor's leave goes to an admin.
    const isOwnStaff = applicant?.employee?.supervisorId?.equals(req.user._id);
    if (!isOwnStaff) {
      return next(new AppError('You can only decide leave for your own field staff.', 403));
    }
  }

  leave.status = decision;
  leave.decidedBy = req.user._id;
  leave.decidedAt = new Date();
  leave.decisionNote = note || '';
  await leave.save();

  res.status(200).json({ status: 'success', leave });
});
