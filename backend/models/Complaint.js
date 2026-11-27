import mongoose from 'mongoose';
import { STAGES } from '../utils/complaintStage.js';
import { WARDS } from '../constants/wards.js';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    required: true,
  },
  // Internal stage this entry moved the complaint into. Optional: history written
  // before stages existed has none.
  stage: {
    type: String,
    enum: STAGES,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  remarks: {
    type: String,
    required: [true, 'Remarks are required for status updates'],
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

// What the AI service returned for the complaint's photos (Eqs. 3 to 5). Written by
// services/aiClient.js after the citizen already has a tracking ID. Advisory only:
// it never changes the stage or the urgency; the supervisor decides.
const detectionSchema = new mongoose.Schema(
  {
    image: Number, // index into `images`
    box: [Number], // x1, y1, x2, y2 in pixels
    confidence: Number,
    className: String,
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    // pending: queued; done: the service answered; failed: no answer after retries;
    // skipped: nothing to analyse (no photos).
    state: { type: String, enum: ['pending', 'done', 'failed', 'skipped'], default: 'pending' },
    modelVersion: String,
    tau: Number,
    // s* = highest confidence of any detection with s >= tau, over all photos (Eq. 3).
    sStar: Number,
    // Largest masked share of a photo (Eq. 4). Segmentation models only; null for
    // box models. Shown as evidence; never used to change urgency.
    delta: { type: Number, default: null },
    // r = 1[s* < tau] (Eq. 5). Also true whenever the service failed.
    needsReview: { type: Boolean, default: true },
    detections: [detectionSchema],
    annotatedImages: [String],
    inferenceMs: Number,
    attempts: { type: Number, default: 0 },
    error: String,
    analysedAt: Date,
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A complaint must belong to a citizen'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (val) {
          return val.length <= 3;
        },
        message: 'A complaint can have at most 3 images',
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    // Internal workflow stage; `status` above is derived from it (utils/complaintStage.js).
    stage: {
      type: String,
      enum: STAGES,
      default: 'submitted',
    },
    // null = unassigned (the one legacy record whose free-text location has no ward).
    ward: {
      type: String,
      enum: { values: WARDS, message: 'Please choose a valid ward' },
      default: null,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: Date,
    completionImages: {
      type: [String],
      validate: {
        validator: (val) => val.length <= 3,
        message: 'Completion proof can have at most 3 images',
      },
    },
    completionNote: { type: String, default: '' },
    closedAt: Date,
    isPublic: {
      type: Boolean,
      default: false,
    },
    // B7: when the citizen agreed to publication in the registry. Complaints filed
    // before the consent step have no value.
    publicationConsentAt: { type: Date, default: null },
    remarks: {
      type: String,
      default: '',
    },
    pdfReceiptUrl: {
      type: String,
      default: '',
    },
    // Always computed on the server from `answers` (utils/urgency.js, Eq. 2).
    // Older complaints filed before answers were stored keep their original label.
    urgencyLevel: {
      type: String,
      enum: ['High Urgency', 'Medium Urgency', 'Standard Urgency'],
      default: 'Standard Urgency',
    },
    // Questionnaire answers (question id -> 'Yes' | 'No'). Published, so anyone can
    // recompute urgencyScore and urgencyLevel.
    answers: {
      type: Map,
      of: { type: String, enum: ['Yes', 'No'] },
      default: undefined,
    },
    urgencyScore: { type: Number, min: 0, max: 1 },
    aiAnalysis: { type: aiAnalysisSchema, default: undefined },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    // save() fails with a VersionError when another request changed the complaint
    // since it was loaded, so two simultaneous transitions cannot both succeed.
    optimisticConcurrency: true,
  }
);

// Create indexes to optimize query performance on frequent filters
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ location: 1 });
complaintSchema.index({ isPublic: 1 });
complaintSchema.index({ stage: 1 });
complaintSchema.index({ ward: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ createdAt: 1 });
complaintSchema.index({ 'aiAnalysis.needsReview': 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
