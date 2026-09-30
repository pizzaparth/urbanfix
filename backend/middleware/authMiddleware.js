import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// Route guard to check user JWT token validity
export const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // Decode and verify JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check if the user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Hardening (checked on every request, not just at login, so a deactivation
  // or an expiry takes effect immediately rather than when the JWT lapses).
  if (currentUser.isActive === false) {
    return next(new AppError('This account has been deactivated.', 401, 'ACCOUNT_DEACTIVATED'));
  }

  // A client-side countdown is a display, not a control — expiry is enforced here.
  if (currentUser.role === 'researcher') {
    const expiresAt = currentUser.researcher?.accessExpiresAt;
    if (!expiresAt || expiresAt < new Date()) {
      return next(
        new AppError('Your research access has expired. Please apply again.', 403, 'RESEARCH_ACCESS_EXPIRED')
      );
    }
  }

  // An invited account has no usable password until it follows the invite link.
  if (currentUser.mustSetPassword === true) {
    return next(new AppError('Set your password using your invite link first.', 403, 'MUST_SET_PASSWORD'));
  }

  // Save user context inside the request object
  req.user = currentUser;
  next();
});

// Middleware to restrict access based on roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
