import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

// Dev-only: creates one account per role so every phase can be exercised without
// clicking through the admin UI. Idempotent (skips accounts that exist), uses
// @example.com addresses so they are trivially distinguishable from real
// accounts, prints the credentials it creates, and refuses to run in production.
// Run manually: `node scripts/seedRoles.js`
dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed test accounts with NODE_ENV=production.');
  process.exit(1);
}

const PASSWORD = 'Passw0rd!123';
const inDays = (n) => new Date(Date.now() + n * 86400000);

const run = async () => {
  await connectDB();

  const supervisorSpec = {
    name: 'Sunita Supervisor',
    email: 'supervisor@example.com',
    role: 'supervisor',
    employee: { employeeCode: 'SUP-0001', ward: 'Ward 1', phone: '9000000001' },
  };

  const created = [];
  const ensure = async (spec) => {
    const existing = await User.findOne({ email: spec.email });
    if (existing) return existing;
    const user = await User.create({ password: PASSWORD, isVerified: true, ...spec });
    created.push(spec);
    return user;
  };

  const supervisor = await ensure(supervisorSpec);

  await ensure({
    name: 'Farhan Field',
    email: 'field1@example.com',
    role: 'field',
    employee: { employeeCode: 'FLD-0001', ward: 'Ward 1', phone: '9000000011', supervisorId: supervisor._id },
  });
  await ensure({
    name: 'Fatima Field',
    email: 'field2@example.com',
    role: 'field',
    employee: { employeeCode: 'FLD-0002', ward: 'Ward 2', phone: '9000000012', supervisorId: supervisor._id },
  });

  // Aggregate-only researcher (the default scope) and one with record-level access.
  await ensure({
    name: 'Rhea Researcher',
    email: 'researcher@example.com',
    role: 'researcher',
    researcher: {
      institute: 'Example Institute of Urban Studies',
      title: 'PhD candidate, Urban Planning',
      accessGrantedAt: new Date(),
      accessExpiresAt: inDays(60),
      datasetScope: 'aggregate_only',
    },
  });
  await ensure({
    name: 'Ravi Records',
    email: 'researcher-records@example.com',
    role: 'researcher',
    researcher: {
      institute: 'Example Institute of Urban Studies',
      title: 'Research fellow',
      accessGrantedAt: new Date(),
      accessExpiresAt: inDays(60),
      datasetScope: 'anonymised_records',
    },
  });

  // The existing real admin is created by seedAdmin.js; add an example one only if absent.
  await ensure({ name: 'Ada Admin', email: 'admin@example.com', role: 'admin' });

  if (created.length === 0) {
    console.log('All role accounts already exist. Nothing to do.');
  } else {
    console.log('\n======================================');
    console.log('Seeded role accounts');
    console.log('======================================');
    created.forEach((u) => console.log(`${u.role.padEnd(11)} ${u.email}`));
    console.log(`\nPassword for all: ${PASSWORD}`);
    console.log('======================================\n');
  }

  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
