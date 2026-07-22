import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { generateTrackingId } from '../utils/trackingIdGenerator.js';
import { generateOtp } from '../utils/otpGenerator.js';
import { sendOtpEmail, sendStatusUpdateEmail } from '../services/emailService.js';
import { createComplaintSchema } from '../validators/complaintValidator.js';
import { generateResolutionPdf } from '../services/pdfService.js';

// 0. Request OTP for Complaint submission
export const requestComplaintOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide an email address', 400));
  }

  // Generate random 6-digit OTP code
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Save transient verification code in database
  await Otp.deleteMany({ email });
  await Otp.create({
    email,
    otp: otpCode,
    expiresAt,
  });

  // Send OTP code email
  await sendOtpEmail(email, otpCode);

  res.status(200).json({
    status: 'success',
    message: 'Verification OTP sent to email.',
  });
});

// 1. Citizen Complaint Submission
export const submitComplaint = catchAsync(async (req, res, next) => {
  // Validate text fields
  const validationResult = createComplaintSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(err => err.message).join('. ');
    return next(new AppError(errorMsg, 400));
  }

  const { name, email, phone, otp, title, description, category, location, urgencyLevel } = validationResult.data;

  // Retrieve valid OTP matching target email
  const otpRecord = await Otp.findOne({ email, otp });
  if (!otpRecord) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return next(new AppError('OTP has expired. Please request a new one.', 400));
  }

  // Clean up transient database references
  await Otp.deleteOne({ _id: otpRecord._id });

  // Find or create citizen user
  let user = await User.findOne({ email });
  if (!user) {
    const tempPassword = Math.random().toString(36).slice(-10); // generate random password
    user = await User.create({
      name,
      email,
      phone,
      password: tempPassword,
      role: 'citizen',
      isVerified: true
    });
  } else {
    // Update name and phone if changed
    user.name = name;
    user.phone = phone;
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  // Parse file attachments
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    imageUrls = req.files.map(file => `/uploads/${file.filename}`);
  }

  // Generate unique tracking identifier
  let trackingId = generateTrackingId();
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 5) {
    const existing = await Complaint.findOne({ trackingId });
    if (!existing) {
      isUnique = true;
    } else {
      trackingId = generateTrackingId();
      attempts++;
    }
  }

  // Save database record with audit trail initial logs
  const newComplaint = await Complaint.create({
    trackingId,
    citizenId: user._id,
    title,
    description,
    category,
    location,
    urgencyLevel: urgencyLevel || 'Standard Urgency',
    images: imageUrls,
    status: 'Pending',
    isPublic: true, // admin no longer has a manual toggle; all filed complaints are public
    statusHistory: [
      {
        status: 'Pending',
        changedBy: user._id,
        remarks: 'Complaint filed successfully after email verification.',
      },
    ],
  });

  // Dispatches email alerts
  sendStatusUpdateEmail(
    user.email,
    trackingId,
    'Pending',
    'Your complaint has been successfully registered and is awaiting administrative review.'
  ).catch(err => console.error('Confirmation email failed to dispatch:', err.message));

  res.status(201).json({
    status: 'success',
    message: 'Complaint submitted successfully.',
    complaint: {
      id: newComplaint._id,
      trackingId: newComplaint.trackingId,
      title: newComplaint.title,
      status: newComplaint.status,
    },
  });
});

// 2. Fetch list of citizen's own complaints
export const getMyComplaints = catchAsync(async (req, res, next) => {
  const complaints = await Complaint.find({ citizenId: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: complaints.length,
    complaints,
  });
});

// 3. Public tracking details search endpoint (PII redacted)
export const getComplaintByTrackingId = catchAsync(async (req, res, next) => {
  const { trackingId } = req.params;

  const complaint = await Complaint.findOne({ trackingId })
    .select('-citizenId') // Redact citizen details
    .populate({
      path: 'statusHistory.changedBy',
      select: 'name role',
    });

  if (!complaint) {
    return next(new AppError('No complaint found with this Tracking ID', 404));
  }

  res.status(200).json({
    status: 'success',
    complaint,
  });
});

// 4. Download PDF Resolution Receipt
export const downloadReceipt = catchAsync(async (req, res, next) => {
  const { trackingId } = req.params;

  const complaint = await Complaint.findOne({ trackingId });

  if (!complaint) {
    return next(new AppError('No complaint found with this Tracking ID', 404));
  }

  // Ensure complaint is actually resolved before exporting receipt
  if (complaint.status !== 'Resolved') {
    return next(new AppError('Receipts can only be compiled for resolved complaints.', 400));
  }

  // Generate on-the-fly PDF using dynamic layout engine
  const pdfBuffer = await generateResolutionPdf(complaint);

  // Stream PDF response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Resolution_Receipt_${trackingId}.pdf`);
  res.send(pdfBuffer);
});
