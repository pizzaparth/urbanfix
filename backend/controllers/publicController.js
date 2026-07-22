import Complaint from '../models/Complaint.js';
import catchAsync from '../utils/catchAsync.js';
import { getStatusBreakdown } from '../utils/statsHelpers.js';

// 1. Fetch public resolution statistics for Landing Page
export const getPublicStats = catchAsync(async (req, res, next) => {
  const formattedStats = await getStatusBreakdown();

  // Group count of resolved complaints by category
  const categoryStats = await Complaint.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    stats: {
      statusBreakdown: formattedStats,
      categoryDistribution: categoryStats
    }
  });
});

// 2. Fetch list of public complaints (redacted details)
export const getPublicComplaints = catchAsync(async (req, res, next) => {
  const { category, location, status, page = 1, limit = 50 } = req.query;

  const query = { isPublic: true };

  if (category) {
    query.category = category;
  }
  if (status) {
    query.status = status;
  }
  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  const skipIndex = (page - 1) * limit;

  // Query complaint list redacting citizen references
  const complaints = await Complaint.find(query)
    .select('-citizenId -statusHistory.changedBy') // Redact citizen details and specific user IDs
    .sort({ createdAt: -1 })
    .skip(skipIndex)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: 'success',
    pagination: {
      total,
      pages: totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit)
    },
    complaints
  });
});
