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

// Merge filed-by-day and resolved-by-day counts into a continuous,
// zero-filled daily series for the admin activity heatmap. "Resolved on day
// X" comes from statusHistory.changedAt (the actual transition timestamp),
// not createdAt/updatedAt.
export const getActivityByDay = async (days = 365) => {
  const daysNum = Math.max(1, Math.min(parseInt(days, 10) || 365, 366));

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (daysNum - 1));

  const [result] = await Complaint.aggregate([
    {
      $facet: {
        filed: [
          { $match: { createdAt: { $gte: start } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
              count: { $sum: 1 },
            },
          },
        ],
        resolved: [
          { $unwind: '$statusHistory' },
          {
            $match: {
              'statusHistory.status': 'Resolved',
              'statusHistory.changedAt': { $gte: start },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$statusHistory.changedAt', timezone: 'UTC' } },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const filedMap = new Map(result.filed.map(r => [r._id, r.count]));
  const resolvedMap = new Map(result.resolved.map(r => [r._id, r.count]));

  const activity = [];
  let maxCount = 0;

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const filedCount = filedMap.get(date) || 0;
    const resolvedCount = resolvedMap.get(date) || 0;
    const count = filedCount + resolvedCount;
    if (count > maxCount) maxCount = count;
    activity.push({ date, filedCount, resolvedCount, count });
  }

  return { activity, maxCount };
};
