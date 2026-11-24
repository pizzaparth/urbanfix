import mongoose from 'mongoose';

// One counter per researcher per UTC day. Incremented with a single conditional
// update, so parallel export requests cannot exceed the daily limit
// (controllers/researchController.js, consumeExportQuota).
const exportQuotaSchema = new mongoose.Schema({
  researcherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true }, // YYYY-MM-DD, UTC
  used: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

exportQuotaSchema.index({ researcherId: 1, day: 1 }, { unique: true });
// Old counters are only needed for a day; keep three for the researcher's own stats.
exportQuotaSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3 * 24 * 60 * 60 });

export default mongoose.model('ExportQuota', exportQuotaSchema);
