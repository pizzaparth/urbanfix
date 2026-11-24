import Complaint from '../models/Complaint.js';
import catchAsync from '../utils/catchAsync.js';
import { getStatusBreakdown } from '../utils/statsHelpers.js';
import { containsInsensitive } from '../utils/escapeRegex.js';
import { REGISTRY_SELECT } from '../utils/publicView.js';
import { auditHead } from '../utils/auditLog.js';

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
    },
    // Latest hash of the research access log. Publishing it lets anyone holding an
    // earlier copy detect a rewritten log (utils/auditLog.js).
    researchAuditHead: await auditHead(),
  });
});

// 2. Fetch list of public complaints (redacted details)
export const getPublicComplaints = catchAsync(async (req, res, next) => {
  const { category, location, status, ward } = req.query;
  const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const query = { isPublic: true };

  // String() stops operator injection such as ?status[$ne]=x.
  if (category) query.category = String(category);
  if (status) query.status = String(status);
  if (ward) query.ward = String(ward);
  // Matched literally: user input is escaped before it becomes a regular expression.
  if (location) query.location = containsInsensitive(location);

  // Allow-list projection: a field is public only if utils/publicView.js names it.
  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .select(REGISTRY_SELECT)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Complaint.countDocuments(query),
  ]);

  res.status(200).json({
    status: 'success',
    pagination: {
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum,
    },
    complaints,
  });
});
