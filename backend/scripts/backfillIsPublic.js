import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Complaint from '../models/Complaint.js';
import mongoose from 'mongoose';

// One-off migration: mark pre-existing complaints as public.
// The admin's manual public-visibility toggle was removed from the product, so every
// complaint is now public by default (see complaintController.submitComplaint); this
// backfills records filed before that default was introduced.
// Run manually with `node scripts/backfillIsPublic.js` — not invoked automatically.
dotenv.config();

const run = async () => {
  await connectDB();

  const result = await Complaint.updateMany({ isPublic: false }, { $set: { isPublic: true } });

  console.log(`Backfilled isPublic on ${result.modifiedCount} complaint(s).`);
  await mongoose.connection.close();
};

run().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
