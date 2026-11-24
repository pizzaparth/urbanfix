import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { verifyAuditChain } from '../utils/auditLog.js';

// Recomputes the research access log hash chain and prints the result.
// Exit code 0 when the chain is intact, 1 when a row was edited or deleted.
// Usage: npm run audit:verify
dotenv.config();

const run = async () => {
  await connectDB();
  const result = await verifyAuditChain();
  console.log(JSON.stringify(result, null, 2));
  await mongoose.connection.close();
  process.exit(result.ok ? 0 : 1);
};

run().catch((err) => {
  console.error('Verification failed:', err.message);
  process.exit(2);
});
