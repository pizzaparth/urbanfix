import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Complaint from '../models/Complaint.js';
import { stageForStatus } from '../utils/complaintStage.js';
import { wardFromLocation } from '../constants/wards.js';

// One-off, idempotent migration for the multi-role rollout. Safe to re-run.
//   stage    <- status   (Pending→submitted, In Progress→accepted, Resolved→closed, Rejected→triage_rejected)
//   ward     <- location (parses a leading "Ward <n>"; anything else stays null and shows up
//                         under the admin "no ward" filter for manual fixing)
//   closedAt <- the Resolved entry in statusHistory (so resolution time can be computed)
//   statusHistory[].stage <- derived from each entry's status
//
// Only fills what is missing: it never overwrites a stage or ward that was already set,
// so it is also safe to run after real workflow activity exists.
// Run manually: `node scripts/backfillStageAndWard.js` — not invoked automatically.
dotenv.config();

const run = async () => {
  await connectDB();

  // The schema default would make `stage` look set on hydrate, so query the raw collection.
  const raw = Complaint.collection;
  const docs = await raw
    .find({}, { projection: { status: 1, stage: 1, ward: 1, location: 1, closedAt: 1, statusHistory: 1 } })
    .toArray();

  let stageSet = 0;
  let wardSet = 0;
  let wardNull = 0;
  let closedSet = 0;
  let historySet = 0;
  const unmatched = [];

  for (const d of docs) {
    const $set = {};

    if (!d.stage) {
      $set.stage = stageForStatus(d.status);
      stageSet++;
    }

    if (d.ward === undefined) {
      const ward = wardFromLocation(d.location);
      $set.ward = ward;
      if (ward) wardSet++;
      else {
        wardNull++;
        unmatched.push(d.location);
      }
    }

    const resolvedEntry = (d.statusHistory || []).find((h) => h.status === 'Resolved');
    if (!d.closedAt && d.status === 'Resolved' && resolvedEntry) {
      $set.closedAt = resolvedEntry.changedAt;
      closedSet++;
    }

    (d.statusHistory || []).forEach((h, i) => {
      if (!h.stage) {
        $set[`statusHistory.${i}.stage`] = stageForStatus(h.status);
        historySet++;
      }
    });

    if (Object.keys($set).length) await raw.updateOne({ _id: d._id }, { $set });
  }

  console.log(`Scanned ${docs.length} complaint(s).`);
  console.log(`  stage set:        ${stageSet}`);
  console.log(`  ward set:         ${wardSet}`);
  console.log(`  ward left null:   ${wardNull}`);
  unmatched.forEach((l) => console.log(`      • "${l}"`));
  console.log(`  closedAt set:     ${closedSet}`);
  console.log(`  history stages:   ${historySet}`);

  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
