import Complaint from '../models/Complaint.js';

// Aggregate and format complaint counts grouped by status
export const getStatusBreakdown = async (matchQuery = {}) => {
  const stats = await Complaint.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const formattedStats = {
    Pending: 0,
    'In Progress': 0,
    Resolved: 0,
    Rejected: 0,
    total: 0,
  };

  stats.forEach(stat => {
    if (stat._id) {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    }
  });

  return formattedStats;
};
