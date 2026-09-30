import mongoose from 'mongoose';

// Doubles as the researcher's own "data viewed / downloaded" stats and the
// privacy audit trail. Every research endpoint writes a row.
const researchAccessLogSchema = new mongoose.Schema(
  {
    researcherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: ['view_dashboard', 'query', 'export'], required: true },
    recordCount: { type: Number, default: 0 },
    filters: mongoose.Schema.Types.Mixed,
    exportFormat: String,
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

researchAccessLogSchema.index({ createdAt: -1 });

export default mongoose.model('ResearchAccessLog', researchAccessLogSchema);
