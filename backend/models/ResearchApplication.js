import mongoose from 'mongoose';
import { DATASET_SCOPES } from '../constants/roles.js';

const researchApplicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    institute: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true, minlength: 100 },
    datasetScope: { type: String, enum: DATASET_SCOPES, default: 'aggregate_only' },
    requestedDays: { type: Number, required: true, min: 1, max: 180 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewNote: String,
    // Set on approval.
    createdUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('ResearchApplication', researchApplicationSchema);
