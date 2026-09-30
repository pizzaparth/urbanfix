import AttendanceRecord from '../models/AttendanceRecord.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { isOnLeaveToday } from '../services/complaintWorkflow.js';

// Local calendar date, YYYY-MM-DD (the shift belongs to the server's day).
export const dateKey = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const checkIn = catchAsync(async (req, res, next) => {
  if (await isOnLeaveToday(req.user._id)) {
    return next(new AppError('You are on approved leave today.', 400));
  }
  const date = dateKey();
  const existing = await AttendanceRecord.findOne({ employeeId: req.user._id, date });
  if (existing) return next(new AppError('You have already checked in today.', 400));

  const record = await AttendanceRecord.create({
    employeeId: req.user._id,
    date,
    checkInAt: new Date(),
    status: 'present',
  });
  res.status(201).json({ status: 'success', record });
});

export const checkOut = catchAsync(async (req, res, next) => {
  const record = await AttendanceRecord.findOne({ employeeId: req.user._id, date: dateKey() });
  if (!record) return next(new AppError('Check in first.', 400));
  if (record.checkOutAt) return next(new AppError('You have already checked out today.', 400));

  record.checkOutAt = new Date();
  await record.save();
  res.status(200).json({ status: 'success', record });
});

export const myAttendance = catchAsync(async (req, res) => {
  const records = await AttendanceRecord.find({ employeeId: req.user._id }).sort({ date: -1 }).limit(30);
  const today = records.find((r) => r.date === dateKey()) || null;
  res.status(200).json({ status: 'success', today, records });
});
