import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { updateStatusSchema } from '../validators/adminValidator.js';
import { applyTransition } from '../services/complaintWorkflow.js';
import { getStatusBreakdown, getActivityByDay } from '../utils/statsHelpers.js';
import { containsInsensitive } from '../utils/escapeRegex.js';

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
      wardMonitoring: await getWardMonitoring(),
    },
  });
});

const median = (xs) => {
  if (!xs.length) return null;
  const v = [...xs].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

// P9 fairness monitoring: per ward, the share of model-checked complaints the
// model flagged for review, and the median days from filing to closure. A ward
// whose complaints are flagged more often, or closed more slowly, becomes
// visible here. Complaint counts per ward are shown but are not a measure of
// need: who reports varies with income and access (paper, Section on fairness).
export const getWardMonitoring = async () => {
  const rows = await Complaint.aggregate([
    {
      $group: {
        _id: { $ifNull: ['$ward', 'Unknown'] },
        filed: { $sum: 1 },
        checked: { $sum: { $cond: [{ $eq: ['$aiAnalysis.state', 'done'] }, 1, 0] } },
        flagged: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$aiAnalysis.state', 'done'] }, { $eq: ['$aiAnalysis.needsReview', true] }] }, 1, 0],
          },
        },
        days: {
          $push: {
            $cond: [
              { $and: [{ $eq: ['$stage', 'closed'] }, { $ne: [{ $ifNull: ['$closedAt', null] }, null] }] },
              { $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 86400000] },
              '$$REMOVE',
            ],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({
    ward: r._id,
    filed: r.filed,
    checked: r.checked,
    flagRate: r.checked ? r.flagged / r.checked : null,
    closed: r.days.length,
    medianResolutionDays: r.days.length ? Math.round(median(r.days) * 10) / 10 : null,
  }));
};

// 1b. Get daily filed+resolved activity for the admin action panel's heatmap
export const getActivityHeatmap = catchAsync(async (req, res, next) => {
  const { days } = req.query;
  const { activity, maxCount } = await getActivityByDay(days);

  res.status(200).json({
    status: 'success',
    days: activity.length,
    maxCount,
    activity,
  });
});

// 2. Paginated and Filtered Complaint Listing for Admin Console
export const getAllComplaints = catchAsync(async (req, res, next) => {
  const { status, category, page = 1, limit = 10, search, stage, ward } = req.query;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (stage) query.stage = stage;
  // ward=none surfaces complaints with no ward, so they can be fixed by hand.
  if (ward === 'none') query.ward = null;
  else if (ward) query.ward = ward;
  if (search) {
    query.$or = [
      { trackingId: containsInsensitive(search) },
      { title: containsInsensitive(search) },
    ];
  }

  const skipIndex = (page - 1) * limit;
  
  // Populate citizen contact fields
  const complaints = await Complaint.find(query)
    .populate('citizenId', 'name email phone')
    .populate('assignedTo', 'name employee.ward')
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

  // The admin's status control goes through the same state machine as everyone
  // else (paper Eq. 6): it can accept or reject a submitted complaint and close one
  // whose proof has been submitted. It cannot close without proof, reject after
  // acceptance, or move a complaint backwards.
  const ADMIN_STATUS_ACTIONS = {
    'In Progress': { submitted: 'accept' },
    Rejected: { submitted: 'reject' },
    Resolved: { proof_submitted: 'close' },
  };
  const action = ADMIN_STATUS_ACTIONS[newStatus]?.[complaint.stage];
  if (!action) {
    return next(new AppError(
      newStatus === 'Resolved'
        ? 'A complaint can be resolved only after field staff have submitted proof of the repair.'
        : `Cannot set "${newStatus}" on a complaint that is at stage "${complaint.stage}".`,
      400
    ));
  }
  await applyTransition(complaint, action, req.user, { remarks });

  res.status(200).json({
    status: 'success',
    message: `Complaint status successfully updated to ${newStatus}.`,
    complaint,
  });
});
