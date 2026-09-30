import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { generateOtp } from '../utils/otpGenerator.js';
import { sendOtpEmail } from '../services/emailService.js';
import { registerSchema, loginSchema, verifyOtpSchema, setPasswordSchema } from '../validators/authValidator.js';
import { hashInviteToken } from '../utils/invite.js';

// Helper function to sign JWT tokens
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// What the app needs to know about a session. The role here is the server's,
// and it — not the login screen's pill — decides which tab set the app shows.
export const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  ...(user.role === 'researcher' && {
    researcher: {
      institute: user.researcher?.institute,
      title: user.researcher?.title,
      accessExpiresAt: user.researcher?.accessExpiresAt,
      datasetScope: user.researcher?.datasetScope,
    },
  }),
  ...((user.role === 'field' || user.role === 'supervisor') && {
    employee: {
      employeeCode: user.employee?.employeeCode,
      ward: user.employee?.ward,
      phone: user.employee?.phone,
    },
  }),
});

// 1. Citizen Registration
export const register = catchAsync(async (req, res, next) => {
  // Validate request body against schema
  const validationResult = registerSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(err => err.message).join('. ');
    return next(new AppError(errorMsg, 400));
  }

  const { name, email, password, phone } = validationResult.data;

  // Prevent duplicate registration
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email address already registered', 400));
  }

  // Create new citizen user (unverified by default)
  await User.create({
    name,
    email,
    password,
    phone,
    role: 'citizen',
    isVerified: false
  });

  // Generate random 6-digit OTP code
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Save transient verification code in database
  await Otp.deleteMany({ email });
  await Otp.create({
    email,
    otp: otpCode,
    expiresAt
  });

  // Send OTP code email
  await sendOtpEmail(email, otpCode);

  res.status(201).json({
    status: 'success',
    message: 'Citizen registered successfully. Verification OTP sent to email.'
  });
});

// 2. OTP Code Verification
export const verifyOtp = catchAsync(async (req, res, next) => {
  const validationResult = verifyOtpSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(err => err.message).join('. ');
    return next(new AppError(errorMsg, 400));
  }

  const { email, otp } = validationResult.data;

  // Retrieve valid code matching target email
  const otpRecord = await Otp.findOne({ email, otp });
  if (!otpRecord) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return next(new AppError('OTP has expired. Please request a new one.', 400));
  }

  // Verify and unlock citizen account
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User account not found', 404));
  }

  user.isVerified = true;
  await user.save();

  // Clean up transient database references
  await Otp.deleteOne({ _id: otpRecord._id });

  // Issue stateless JWT access session
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// 3. Resend Verification OTP
export const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found with this email', 404));
  }

  if (user.isVerified) {
    return next(new AppError('This account is already verified. Please login.', 400));
  }

  // Generate and save new code
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await Otp.deleteMany({ email });
  await Otp.create({
    email,
    otp: otpCode,
    expiresAt
  });

  // Re-send verification email
  await sendOtpEmail(email, otpCode);

  res.status(200).json({
    status: 'success',
    message: 'New verification OTP sent to email.'
  });
});

// 4. Authentication Login (Citizen/Admin)
export const login = catchAsync(async (req, res, next) => {
  const validationResult = loginSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(err => err.message).join('. ');
    return next(new AppError(errorMsg, 400));
  }

  const { email, password } = validationResult.data;

  // Retrieve user along with password database entries
  const user = await User.findOne({ email }).select('+password');

  // Checked before the password: an invited account's password is a random value
  // nobody knows, so a correct-looking attempt would otherwise read as "wrong
  // password" instead of pointing them at the invite email they haven't used yet.
  if (user?.mustSetPassword) {
    return next(
      new AppError('Set your password from your invite email before signing in.', 403, 'MUST_SET_PASSWORD')
    );
  }

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Soft-deleted staff can no longer sign in (their history still renders).
  if (user.isActive === false) {
    return next(new AppError('This account has been deactivated.', 401, 'ACCOUNT_DEACTIVATED'));
  }

  // Block login for unverified registrations
  if (!user.isVerified) {
    return next(new AppError('Account email is not verified. Please verify using OTP.', 403));
  }

  // An expired researcher can still sign in — the app then shows the "access
  // expired" screen — but every research endpoint is refused by `protect`.
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Issue stateless JWT token
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    user: serializeUser(user),
  });
});

// 5. First login for invited accounts: redeem the single-use link.
export const setPassword = catchAsync(async (req, res, next) => {
  const parsed = setPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors.map((e) => e.message).join('. '), 400));
  }
  const { inviteToken, password } = parsed.data;

  const user = await User.findOne({
    inviteToken: hashInviteToken(inviteToken),
    inviteTokenExpires: { $gt: new Date() },
  }).select('+inviteToken');

  if (!user) {
    return next(new AppError('This invite link is invalid or has expired.', 400, 'INVITE_INVALID'));
  }

  user.password = password;
  user.mustSetPassword = false;
  user.isVerified = true;
  user.inviteToken = undefined;
  user.inviteTokenExpires = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  res.status(200).json({ status: 'success', token: signToken(user._id), user: serializeUser(user) });
});

// 6. Current session profile (also how the app refreshes accessExpiresAt).
export const me = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', user: serializeUser(req.user) });
});
