import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Complaint from '../models/Complaint.js';
import mongoose from 'mongoose';

// One-off migration: populate urgencyLevel on legacy complaint records that predate the field.
// Run manually with `node scripts/backfillUrgencyLevels.js` — not invoked automatically.
dotenv.config();

const run = async () => {
  await connectDB();

  const result = await Complaint.updateMany(
    { $or: [{ urgencyLevel: { $exists: false } }, { urgencyLevel: null }] },
    [
      {
        $set: {
          urgencyLevel: {
            $cond: {
              if: { $in: ['$category', ['Electricity', 'Water Supply']] },
              then: 'High Urgency',
              else: {
                $cond: {
                  if: { $in: ['$category', ['Sanitation', 'Roads', 'Road Damage']] },
                  then: 'Medium Urgency',
                  else: 'Standard Urgency',
                },
              },
            },
          },
        },
      },
    ]
  );

  console.log(`Backfilled urgencyLevel on ${result.modifiedCount} complaint(s).`);
  await mongoose.connection.close();
};

run().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
