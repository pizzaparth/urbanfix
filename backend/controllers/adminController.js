import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { updateStatusSchema } from '../validators/adminValidator.js';
import { sendStatusUpdateEmail, sendResolutionEmailWithPdf } from '../services/emailService.js';
import { generateResolutionPdf } from '../services/pdfService.js';
import { getStatusBreakdown } from '../utils/statsHelpers.js';

// 1. Get Summary Metrics for Admin Dashboard
export const getAdminStats = catchAsync(async (req, res, next) => {
  const formattedStats = await getStatusBreakdown();

  // Calculate complaint volume per category
  const categoryStats = await Complaint.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate urgency distribution
  const urgencyStats = await Complaint.aggregate([
    {
      $group: {
        _id: '$urgencyLevel',
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate timeline trend (by date)
  const timelineStats = await Complaint.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalCount: { $sum: 1 },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        }
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 14 }
  ]);

  res.status(200).json({
    status: 'success',
    stats: {
      statusBreakdown: formattedStats,
      categoryDistribution: categoryStats,
      urgencyDistribution: urgencyStats,
      timelineTrend: timelineStats,
    },
  });
});

// 2. Paginated and Filtered Complaint Listing for Admin Console
export const getAllComplaints = catchAsync(async (req, res, next) => {
  const { status, category, page = 1, limit = 10, search } = req.query;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { trackingId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  const skipIndex = (page - 1) * limit;
  
  // Populate citizen contact fields
  const complaints = await Complaint.find(query)
    .populate('citizenId', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skipIndex)
    .limit(parseInt(limit));

  const totalComplaints = await Complaint.countDocuments(query);
  const totalPages = Math.ceil(totalComplaints / limit);

  res.status(200).json({
    status: 'success',
    pagination: {
      total: totalComplaints,
      pages: totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    },
    complaints,
  });
});

// 3. Update Complaint Status & Generate PDF receipt on resolution
export const updateComplaintStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const validationResult = updateStatusSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.errors.map(err => err.message).join('. ');
    return next(new AppError(errorMsg, 400));
  }

  const { status: newStatus, remarks } = validationResult.data;

  // Retrieve target complaint
  const complaint = await Complaint.findById(id).populate('citizenId');
  if (!complaint) {
    return next(new AppError('No complaint found with this ID', 404));
  }

  const currentStatus = complaint.status;

  // State transitions constraints validation
  if (currentStatus === 'Resolved' || currentStatus === 'Rejected') {
    return next(new AppError('Complaint is in a terminal status and cannot be modified.', 400));
  }

  if (currentStatus === 'Pending' && newStatus === 'Resolved') {
    return next(new AppError('A pending complaint must be transitioned to "In Progress" before resolution.', 400));
  }

  // Apply updates
  complaint.status = newStatus;
  complaint.remarks = remarks;

  // Record history
  complaint.statusHistory.push({
    status: newStatus,
    changedBy: req.user._id,
    remarks,
  });

  // Action: Resolved updates generate PDF receipt and dispatch attachment
  if (newStatus === 'Resolved') {
    const pdfBuffer = await generateResolutionPdf(complaint);
    
    // Dispatch resolution email
    await sendResolutionEmailWithPdf(complaint.citizenId.email, complaint.trackingId, remarks, pdfBuffer);

    // Save download reference URL path
    complaint.pdfReceiptUrl = `/api/complaints/download-receipt/${complaint.trackingId}`;
  } else {
    // Normal transitions dispatch updates emails
    await sendStatusUpdateEmail(complaint.citizenId.email, complaint.trackingId, newStatus, remarks);
  }

  await complaint.save();

  res.status(200).json({
    status: 'success',
    message: `Complaint status successfully updated to ${newStatus}.`,
    complaint,
  });
});
