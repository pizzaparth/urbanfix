import crypto from 'crypto';
import mongoose from 'mongoose';
import ResearchAccessLog from '../models/ResearchAccessLog.js';

// Hash chain over the research access log (see models/ResearchAccessLog.js).
//
// Limits, stated in the paper: the chain detects edits and deletions by anyone who
// cannot recompute it. A database administrator who rewrites the whole chain is
// detected only against a head hash published earlier, which is why the current
// head is shown in the public statistics (GET /api/public/stats).

export const GENESIS_HASH = '0'.repeat(64);
const MAX_APPEND_RETRIES = 50;

const normalise = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (Array.isArray(value)) return value.map(normalise);
  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') return value.toHexString();
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, normalise(value[k])])
    );
  }
  return value;
};

// Canonical JSON: sorted keys, ISO dates, ids as strings, missing values as null.
export const canonicalJson = (value) => JSON.stringify(normalise(value));

export const chainedFields = (row) => ({
  seq: row.seq,
  researcherId: row.researcherId,
  action: row.action,
  recordCount: row.recordCount ?? 0,
  filters: row.filters ?? null,
  exportFormat: row.exportFormat ?? null,
  ipAddress: row.ipAddress ?? null,
  createdAt: row.createdAt,
});

export const hashRow = (prevHash, row) =>
  crypto.createHash('sha256').update(prevHash).update(canonicalJson(chainedFields(row))).digest('hex');

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Appends one row at the end of the chain. The unique index on seq makes a
// concurrent writer that read the same head fail with a duplicate key; it then
// re-reads the head and tries again.
// Within one process, appends queue behind each other, so parallel requests do not
// race for the same sequence number and retry. The unique index still protects
// the chain when several server processes write.
let queue = Promise.resolve();
export const appendAuditLog = (data) => {
  const next = queue.then(() => appendWithRetry(data));
  queue = next.catch(() => {});
  return next;
};

const appendWithRetry = async (data) => {
  for (let attempt = 0; attempt < MAX_APPEND_RETRIES; attempt++) {
    const head = await ResearchAccessLog.findOne({ seq: { $ne: null } })
      .sort({ seq: -1 })
      .select('seq hash')
      .lean();
    const seq = (head?.seq ?? 0) + 1;
    const prevHash = head?.hash ?? GENESIS_HASH;
    const row = { ...data, seq, createdAt: new Date() };
    try {
      return await ResearchAccessLog.create({ ...row, prevHash, hash: hashRow(prevHash, row) });
    } catch (err) {
      if (err.code !== 11000) throw err;
      await pause(Math.random() * 5 * (attempt + 1));
    }
  }
  throw new Error('Could not append to the research access log (too much contention).');
};

export const auditHead = async () => {
  const head = await ResearchAccessLog.findOne({ seq: { $ne: null } }).sort({ seq: -1 }).select('seq hash').lean();
  return head ? { seq: head.seq, hash: head.hash } : { seq: 0, hash: GENESIS_HASH };
};

// Recomputes the whole chain. Reports the first problem found:
//   gap         a sequence number is missing (a row was deleted)
//   broken_link prevHash does not equal the previous row's hash
//   edited      the stored hash does not match the row's contents
export const verifyAuditChain = async () => {
  const unchained = await ResearchAccessLog.countDocuments({ seq: null });
  const cursor = ResearchAccessLog.find({ seq: { $ne: null } }).sort({ seq: 1 }).lean().cursor();

  let expectedSeq = 1;
  let prevHash = GENESIS_HASH;
  let checked = 0;

  for await (const row of cursor) {
    if (row.seq !== expectedSeq) {
      return { ok: false, checked, unchained, problem: { kind: 'gap', seq: expectedSeq, foundSeq: row.seq } };
    }
    if (row.prevHash !== prevHash) {
      return { ok: false, checked, unchained, problem: { kind: 'broken_link', seq: row.seq, id: String(row._id) } };
    }
    if (hashRow(prevHash, row) !== row.hash) {
      return { ok: false, checked, unchained, problem: { kind: 'edited', seq: row.seq, id: String(row._id) } };
    }
    prevHash = row.hash;
    expectedSeq += 1;
    checked += 1;
  }

  return { ok: true, checked, unchained, head: { seq: expectedSeq - 1, hash: prevHash } };
};
