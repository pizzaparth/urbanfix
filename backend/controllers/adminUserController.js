import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import ResearchApplication from '../models/ResearchApplication.js';
import ResearchAccessLog from '../models/ResearchAccessLog.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { validate } from '../utils/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/workflowValidator.js';
import { decisionSchema } from '../validators/researchValidator.js';
import { generateInvite, unusablePassword } from '../utils/invite.js';
import {
  sendEmployeeInviteEmail,
  sendResearchApprovedEmail,
  sendResearchRejectedEmail,
} from '../services/emailService.js';

const SAFE_FIELDS =
  'name email phone role isActive isVerified mustSetPassword employee researcher lastLoginAt createdAt createdBy';

// Dev convenience: with no real SMTP the invite only exists in an Ethereal
// inbox, so echo the code to the server console (never in production).
const devLogInvite = (email, token) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV INVITE] ${email}\n  code: ${token}\n`);
  }
};

const nextEmployeeCode = async (role) => {
  const prefix = role === 'field' ? 'FLD' : role === 'supervisor' ? 'SUP' : 'ADM';
  for (let i = 0; i < 8; i++) {
    const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await User.exists({ 'employee.employeeCode': code }))) return code;
  }
  throw new AppError('Could not generate an employee code. Try again.', 500);
};

// 1. Users
export const listUsers = catchAsync(async (req, res) => {
  const { role, isActive, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  else filter.role = { $ne: 'citizen' }; // citizens are filers, not managed accounts
  if (isActive === 'true') filter.isActive = { $ne: false };
  if (isActive === 'false') filter.isActive = false;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .select(SAFE_FIELDS)
    .populate('employee.supervisorId', 'name')
    .sort({ role: 1, name: 1 })
    .limit(200);

  res.status(200).json({ status: 'success', results: users.length, users });
});

export const createUser = catchAsync(async (req, res, next) => {
  const data = validate(createUserSchema, req.body);

  if (data.role === 'field' && data.supervisorId) {
    const sup = await User.findOne({ _id: data.supervisorId, role: 'supervisor', isActive: true });
    if (!sup) return next(new AppError('That supervisor does not exist or is inactive.', 400));
  }

  const invite = generateInvite();
  const employee = {
    employeeCode: data.employeeCode || (await nextEmployeeCode(data.role)),
    ward: data.ward,
    supervisorId: data.role === 'field' ? data.supervisorId : undefined,
    phone: data.phone,
  };

  let user = await User.findOne({ email: data.email });
  if (user) {
    // Citizens are auto-created whenever someone files a complaint, so an
    // existing citizen email is normal: promote it (their complaints stay linked).
    if (user.role !== 'citizen') {
      return next(new AppError('An account with this email already exists.', 409));
    }
    user.name = data.name;
    user.role = data.role;
    user.employee = employee;
    user.phone = data.phone || user.phone;
    user.password = unusablePassword();
  } else {
    user = new User({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      employee: data.role === 'admin' ? { employeeCode: employee.employeeCode } : employee,
      password: unusablePassword(),
    });
  }
  user.isVerified = true;
  user.isActive = true;
  user.mustSetPassword = true;
  user.inviteToken = invite.hashed;
  user.inviteTokenExpires = invite.expires;
  user.createdBy = req.user._id;
  await user.save();

  sendEmployeeInviteEmail(user.email, user.name, user.role, invite.token).catch(() => {});
  devLogInvite(user.email, invite.token);

  res.status(201).json({
    status: 'success',
    message: 'Account created. An invite link has been emailed.',
    user: await User.findById(user._id).select(SAFE_FIELDS),
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const data = validate(updateUserSchema, req.body);
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with this ID', 404));
  if (user.role === 'citizen' || user.role === 'researcher') {
    return next(new AppError('Only staff accounts can be edited here.', 400));
  }

  if (data.name) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  user.employee = user.employee || {};
  if (data.employeeCode) user.employee.employeeCode = data.employeeCode;
  if (data.ward !== undefined) user.employee.ward = data.ward || undefined;
  if (data.supervisorId !== undefined) {
    if (data.supervisorId) {
      const sup = await User.findOne({ _id: data.supervisorId, role: 'supervisor', isActive: true });
      if (!sup) return next(new AppError('That supervisor does not exist or is inactive.', 400));
    }
    user.employee.supervisorId = data.supervisorId || undefined;
  }
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', user: await User.findById(user._id).select(SAFE_FIELDS) });
});

const setActive = (active) =>
  catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('No user found with this ID', 404));
    if (user.role === 'citizen') return next(new AppError('Citizens are not managed accounts.', 400));

    if (!active) {
      if (String(user._id) === String(req.user._id)) {
        return next(new AppError('You cannot deactivate your own account.', 400));
      }
      if (user.role === 'admin') {
        const others = await User.countDocuments({ role: 'admin', isActive: { $ne: false }, _id: { $ne: user._id } });
        if (others === 0) return next(new AppError('You cannot deactivate the last active admin.', 400));
      }
      // Soft delete only — the audit trail on every complaint they touched references them.
      // Tasks they were holding go back to the supervisor queue.
      if (user.role === 'field') {
        const held = await Complaint.updateMany(
          { assignedTo: user._id, stage: { $in: ['assigned'] } },
          {
            $set: { stage: 'accepted', status: 'In Progress', assignedTo: null, assignedBy: null, assignedAt: null },
            $push: {
              statusHistory: {
                status: 'In Progress',
                stage: 'accepted',
                changedBy: req.user._id,
                remarks: `Returned to the assignment queue: ${user.name}'s account was deactivated.`,
              },
            },
          }
        );
        user.$locals.released = held.modifiedCount;
      }
    }

    user.isActive = active;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      releasedTasks: user.$locals.released || 0,
      user: await User.findById(user._id).select(SAFE_FIELDS),
    });
  });

export const deactivateUser = setActive(false);
export const reactivateUser = setActive(true);

// 2. Research applications
export const listApplications = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const applications = await ResearchApplication.find(filter)
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  res.status(200).json({ status: 'success', results: applications.length, applications });
});

export const decideApplication = catchAsync(async (req, res, next) => {
  const { decision, days, grantRecordAccess, note } = validate(decisionSchema, req.body);

  const application = await ResearchApplication.findById(req.params.id);
  if (!application) return next(new AppError('No application found with this ID', 404));
  if (application.status !== 'pending') {
    return next(new AppError('This application has already been decided.', 400));
  }

  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.reviewNote = note || '';

  if (decision === 'rejected') {
    application.status = 'rejected';
    await application.save();
    sendResearchRejectedEmail(application.email, application.fullName, note).catch(() => {});
    return res.status(200).json({ status: 'success', application });
  }

  // Approval provisions (or upgrades) the account.
  let user = await User.findOne({ email: application.email });
  if (user && user.role !== 'citizen' && user.role !== 'researcher') {
    return next(new AppError('That email already belongs to a staff account.', 409));
  }

  const grantDays = Math.min(180, days || application.requestedDays);
  // Aggregate-only unless the admin explicitly ticks record-level access.
  const scope = grantRecordAccess ? 'anonymised_records' : 'aggregate_only';
  const invite = generateInvite();
  const now = new Date();

  if (!user) {
    user = new User({ name: application.fullName, email: application.email, password: unusablePassword() });
  } else {
    user.password = unusablePassword();
  }
  user.role = 'researcher';
  user.isVerified = true;
  user.isActive = true;
  user.mustSetPassword = true;
  user.inviteToken = invite.hashed;
  user.inviteTokenExpires = invite.expires;
  user.createdBy = req.user._id;
  user.researcher = {
    institute: application.institute,
    title: application.title,
    accessGrantedAt: now,
    accessExpiresAt: new Date(now.getTime() + grantDays * 86400000),
    datasetScope: scope,
    applicationId: application._id,
  };
  await user.save();

  application.status = 'approved';
  application.createdUserId = user._id;
  await application.save();

  sendResearchApprovedEmail(user.email, user.name, invite.token, grantDays, scope).catch(() => {});
  devLogInvite(user.email, invite.token);

  res.status(200).json({ status: 'success', application });
});

// 3. Privacy audit trail
export const getResearchAudit = catchAsync(async (req, res) => {
  const { researcherId, action, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (researcherId) filter.researcherId = researcherId;
  if (action) filter.action = action;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

  const [logs, total] = await Promise.all([
    ResearchAccessLog.find(filter)
      .populate('researcherId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    ResearchAccessLog.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    pagination: { total, pages: Math.ceil(total / limitNum), currentPage: pageNum, limit: limitNum },
    logs,
  });
});
