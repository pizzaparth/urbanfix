import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { generateTrackingId } from '../utils/trackingIdGenerator.js';
import { issueOtp, consumeOtp } from '../utils/otp.js';
import { sendOtpEmail, sendStatusUpdateEmail } from '../services/emailService.js';
import { createComplaintSchema } from '../validators/complaintValidator.js';
import { generateResolutionPdf } from '../services/pdfService.js';
import { redactText } from '../utils/redactText.js';
import { validateAnswers, scoreAnswers, parseAnswersField } from '../utils/urgency.js';
import { TRACKER_SELECT, toTrackerView } from '../utils/publicView.js';
import { discardUploads } from '../middleware/uploadMiddleware.js';
import { scheduleAnalysis } from '../services/aiClient.js';
import { unusablePassword } from '../utils/invite.js';

// 0. Request OTP for Complaint submission
export const requestComplaintOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return next(new AppError('Please provide an email address', 400));
  }

  const otpCode = await issueOtp(email);
  await sendOtpEmail(email, otpCode);

  res.status(200).json({
    status: 'success',
    message: 'Verification OTP sent to email.',
  });
});

const fileComplaint = async (req, res) => {
  const validationResult = createComplaintSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map((err) => err.message).join('. ');
    throw new AppError(errorMsg, 400);
  }

  const { name, email, phone, otp, title, description, category, location, ward } = validationResult.data;

  // Urgency comes from the answers, scored here. A client-supplied urgencyLevel is ignored.
  const answers = validateAnswers(category, parseAnswersField(req.body.answers));
  const urgency = scoreAnswers(category, answers);

  await consumeOtp(email, otp);

  // Find or create citizen user
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name,
      email,
      phone,
      // Filing needs no account; a random password nobody knows keeps it unusable
      // until the citizen registers. CSPRNG, not Math.random.
      password: unusablePassword(),
      role: 'citizen',
      isVerified: true,
    });
  } else {
    // Update name and phone if changed
    user.name = name;
    user.phone = phone;
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  // Photos were re-encoded without metadata by stripImageMetadata.
  const imageUrls = (req.files || []).map((file) => `/uploads/${file.filename}`);

  // Generate unique tracking identifier
  let trackingId = generateTrackingId();
  for (let attempts = 0; attempts < 5 && (await Complaint.exists({ trackingId })); attempts++) {
    trackingId = generateTrackingId();
  }

  // Free text is published, so identifiers are removed before it is stored.
  const newComplaint = await Complaint.create({
    trackingId,
    citizenId: user._id,
    title: redactText(title),
    description: redactText(description),
    category,
    location: redactText(location),
    ward,
    answers,
    urgencyScore: urgency.score,
    urgencyLevel: urgency.level,
    images: imageUrls,
    status: 'Pending',
    stage: 'submitted',
    isPublic: true, // admin no longer has a manual toggle; all filed complaints are public
    aiAnalysis: { state: 'pending', needsReview: true },
    statusHistory: [
      {
        status: 'Pending',
        stage: 'submitted',
        changedBy: user._id,
        remarks: 'Complaint filed successfully after email verification.',
      },
    ],
  });

  return { user, newComplaint };
};

// 1. Citizen Complaint Submission
export const submitComplaint = catchAsync(async (req, res, next) => {
  let filed;
  try {
    filed = await fileComplaint(req, res);
  } catch (err) {
    await discardUploads(req.files);
    return next(err);
  }
  const { user, newComplaint } = filed;

  // Dispatches email alerts
  sendStatusUpdateEmail(
    user.email,
    newComplaint.trackingId,
    'Pending',
    'Your complaint has been successfully registered and is awaiting administrative review.'
  ).catch((err) => console.error('Confirmation email failed to dispatch:', err.message));

  res.status(201).json({
    status: 'success',
    message: 'Complaint submitted successfully.',
    complaint: {
      id: newComplaint._id,
      trackingId: newComplaint.trackingId,
      title: newComplaint.title,
      status: newComplaint.status,
      urgencyLevel: newComplaint.urgencyLevel,
      urgencyScore: newComplaint.urgencyScore,
    },
  });

  // Only after the citizen has the tracking ID: the model call can be slow or fail
  // without affecting the filing.
  scheduleAnalysis(newComplaint._id);
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

  // Allow-list projection: only public fields, and actors reduced to role labels.
  const complaint = await Complaint.findOne({ trackingId: String(trackingId) })
    .select(TRACKER_SELECT)
    .populate({
      path: 'statusHistory.changedBy',
      select: 'role',
    });

  if (!complaint) {
    return next(new AppError('No complaint found with this Tracking ID', 404));
  }

  res.status(200).json({
    status: 'success',
    complaint: toTrackerView(complaint),
  });
});

// 4. Download PDF Resolution Receipt
export const downloadReceipt = catchAsync(async (req, res, next) => {
  const { trackingId } = req.params;

  const complaint = await Complaint.findOne({ trackingId: String(trackingId) });

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
