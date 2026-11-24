import mongoose from 'mongoose';

// Doubles as the researcher's own "data viewed / downloaded" stats and the
// privacy audit trail. Every research endpoint writes a row.
//
// Tamper evidence: rows form a hash chain (utils/auditLog.js). Row n stores
// hash_n = SHA-256(hash_{n-1} || canonical JSON of row n) and a sequence number with
// a unique index, so two writers cannot fork the chain. Editing or deleting a row
// breaks the chain and scripts/verifyAuditLog.js reports where. The application
// itself cannot update or delete rows (hooks below).
const researchAccessLogSchema = new mongoose.Schema({
  researcherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['view_dashboard', 'query', 'export'], required: true },
  recordCount: { type: Number, default: 0 },
  filters: mongoose.Schema.Types.Mixed,
  exportFormat: String,
  ipAddress: String,
  createdAt: { type: Date, default: Date.now },
  // Rows written before the chain existed have no seq and are reported as unchained.
  seq: { type: Number },
  prevHash: String,
  hash: String,
});

researchAccessLogSchema.index({ createdAt: -1 });
researchAccessLogSchema.index({ seq: 1 }, { unique: true, sparse: true });

const appendOnly = function (next) {
  next(new Error('ResearchAccessLog is append-only; rows cannot be changed or deleted.'));
};
for (const op of [
  'updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne',
  'findOneAndDelete', 'deleteOne', 'deleteMany',
]) {
  researchAccessLogSchema.pre(op, appendOnly);
}
researchAccessLogSchema.pre('save', function (next) {
  if (!this.isNew) return appendOnly(next);
  next();
});

export default mongoose.model('ResearchAccessLog', researchAccessLogSchema);
