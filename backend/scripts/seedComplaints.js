import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Dev-only seed script: injects realistic dummy complaints (no images) spread across the
// last N days so the status radar, category donut, urgency ring, activity heatmap, and
// public registry all have real data to render. Writes directly through the Mongoose
// models (bypassing the OTP flow, upload middleware, and admin transition rules), so it
// can construct backdated, terminal-status records that the HTTP API could never produce.
// Run manually with `node scripts/seedComplaints.js [--count=60] [--days=365] [--fresh]`
// — not invoked automatically.
//
// Seeded citizens use an @example.com email marker so `--fresh` can safely delete only
// what this script created, never the real complaints/users already in the database.
dotenv.config();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ---- CLI flags ----
const args = process.argv.slice(2);
const getNumericFlag = (name, fallback) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (!match) return fallback;
  const value = Number(match.split('=')[1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
const COUNT = getNumericFlag('count', 60);
const DAYS = getNumericFlag('days', 365);
const FRESH = args.includes('--fresh');

// ---- Static reference data mirrored from frontend/src/constants/categories.js ----
const CATEGORY_QUESTIONNAIRES = {
  'Road Damage': [
    { id: 'q_accident', question: 'Has there been any accident because of this issue?' },
    { id: 'q_duration', question: 'Has the problem existed for more than one week?' },
    { id: 'q_public_facility', question: 'Is a school or hospital located nearby?' },
    { id: 'q_busy_area', question: 'Is there a market or busy public area nearby?' },
    { id: 'q_vehicle_flow', question: 'Is the issue affecting vehicle movement or blocking traffic?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  'Water Leakage': [
    { id: 'q_flooding', question: 'Is there severe water wastage or street flooding?' },
    { id: 'q_drinking_water', question: 'Has the leakage affected clean drinking water supply?' },
    { id: 'q_duration', question: 'Has the problem existed for more than 3 days?' },
    { id: 'q_public_facility', question: 'Is a school or hospital located nearby?' },
    { id: 'q_property_damage', question: 'Is the water leakage causing structural or property damage?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  Garbage: [
    { id: 'q_overflowing', question: 'Is garbage overflowing onto the main road or public path?' },
    { id: 'q_odor_pest', question: 'Is there a severe foul odor or health hazard/pest risk?' },
    { id: 'q_uncollected', question: 'Has garbage been uncollected for more than 48 hours?' },
    { id: 'q_public_facility', question: 'Is a school, hospital, or food market located nearby?' },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?' },
  ],
  'Street Light': [
    { id: 'q_darkness', question: 'Is the entire street or junction completely dark at night?' },
    { id: 'q_duration', question: 'Has the light malfunctioned for more than one week?' },
    { id: 'q_safety_risk', question: 'Does the dark area pose an immediate safety/crime concern?' },
    { id: 'q_busy_area', question: 'Is a market, bus stop, or public area nearby?' },
    { id: 'q_inconvenience', question: 'Is the issue causing public inconvenience?' },
  ],
  Administrative: [
    { id: 'q_delayed', question: 'Has an official service request been delayed beyond standard limits?' },
    { id: 'q_violation', question: 'Were official administrative procedures violated or unheeded?' },
    { id: 'q_multiple_citizens', question: 'Does this administrative issue affect multiple citizens?' },
    { id: 'q_previous_notice', question: 'Have you previously submitted a physical or verbal request?' },
    { id: 'q_inconvenience', question: 'Is the issue causing public inconvenience?' },
  ],
  Other: [
    { id: 'q_safety_risk', question: 'Is this issue causing immediate public inconvenience or safety risk?' },
    { id: 'q_duration', question: 'Has this issue persisted for more than a week?' },
    { id: 'q_public_facility', question: 'Is a school, hospital, or busy public area nearby?' },
  ],
};

// Weighted so the category donut isn't flat — Road Damage/Garbage are the most common
// municipal complaint types in practice.
const CATEGORY_WEIGHTS = {
  'Road Damage': 5,
  'Water Leakage': 3,
  Garbage: 4,
  'Street Light': 3,
  Administrative: 2,
  Other: 2,
};

const STATUS_WEIGHTS = {
  Pending: 30,
  'In Progress': 25,
  Resolved: 35,
  Rejected: 10,
};

const LOCATIONS = [
  { short: 'Ward 1', full: 'Ward 1, Gandhi Road (Near Railway Station)' },
  { short: 'Ward 2', full: 'Ward 2, Nehru Colony Main Street' },
  { short: 'Ward 3', full: 'Ward 3, Lake View Road (Behind Community Hall)' },
  { short: 'Ward 4', full: 'Ward 4, Main Market Road (Opposite City Hospital)' },
  { short: 'Ward 5', full: 'Ward 5, Industrial Area Phase II' },
  { short: 'Ward 6', full: 'Ward 6, Green Park Extension' },
  { short: 'Ward 7', full: 'Ward 7, Old Bus Stand Road' },
  { short: 'Ward 8', full: 'Ward 8, Sector 12 Housing Colony' },
  { short: 'Ward 9', full: 'Ward 9, Riverside Avenue (Near Municipal School)' },
  { short: 'Ward 10', full: 'Ward 10, Civil Lines Road' },
];

const TITLE_TEMPLATES = {
  'Road Damage': [
    'Deep pothole near {loc} bus stop',
    'Road surface collapsed on {loc} main stretch',
    'Large cracks forming across {loc} carriageway',
    'Broken road divider causing hazard in {loc}',
    'Uneven road patch after utility digging in {loc}',
    'Waterlogged pothole cluster along {loc}',
  ],
  'Water Leakage': [
    'Major pipeline leak flooding {loc}',
    'Continuous water seepage from underground line in {loc}',
    'Burst water pipe near {loc} junction',
    'Drinking water supply line leaking in {loc}',
    'Overflowing water valve chamber at {loc}',
  ],
  Garbage: [
    'Garbage pile uncollected for days in {loc}',
    'Overflowing dustbins near {loc} market',
    'Illegal waste dumping spotted at {loc}',
    'Foul smell from uncollected trash in {loc}',
    'Community bin overflowing onto street in {loc}',
  ],
  'Street Light': [
    'Street light not working at {loc} junction',
    'Entire stretch of {loc} without lighting at night',
    'Flickering street lamp poses safety risk in {loc}',
    'Broken street light pole near {loc}',
    'Dark patch on {loc} main road after sunset',
  ],
  Administrative: [
    'Delayed response to service request in {loc}',
    'No action taken on prior complaint from {loc}',
    'Municipal office unresponsive to {loc} residents',
    'Administrative procedure violation reported in {loc}',
    'Pending certificate issuance for {loc} applicants',
  ],
  Other: [
    'Stray animal issue reported near {loc}',
    'Encroachment on public footpath in {loc}',
    'Noise disturbance complaint from {loc}',
    'Public property damage observed at {loc}',
    'Unsafe construction debris left in {loc}',
  ],
};

const DESCRIPTION_TEMPLATES = {
  'Road Damage': [
    'The road near {loc} has a severe pothole that has damaged multiple vehicle tyres and continues to worsen with each rainfall.',
    'A large section of the carriageway at {loc} has caved in, forcing vehicles to swerve dangerously into oncoming traffic.',
    'Cracks have spread across the entire road surface at {loc}, making the commute unsafe especially for two-wheelers at night.',
  ],
  'Water Leakage': [
    'A pipeline burst near {loc} is causing continuous water wastage and has flooded the adjoining street for several days.',
    'Residents of {loc} have noticed a steady leak from an underground water line that is affecting the drinking water pressure.',
    'The water valve chamber at {loc} has been overflowing, creating a slippery and unhygienic patch on the road.',
  ],
  Garbage: [
    'Household waste has been piling up uncollected near {loc} for over 48 hours, attracting stray animals and pests.',
    'The community dustbin at {loc} is overflowing onto the street, creating a foul smell and health hazard for nearby residents.',
    'Illegal dumping of construction debris has been observed repeatedly at {loc}, blocking pedestrian movement.',
  ],
  'Street Light': [
    'The street light at {loc} junction has not been functioning for over a week, leaving the area completely dark after sunset.',
    'Multiple lamp posts along {loc} are flickering intermittently, creating a safety concern for evening commuters.',
    'A damaged street light pole at {loc} has left a long stretch of road unlit, raising safety concerns for pedestrians.',
  ],
  Administrative: [
    'A service request submitted to the ward office for {loc} has been pending for several weeks without any response.',
    'Despite multiple visits to the municipal office regarding {loc}, no action has been taken on the registered request.',
    'Residents of {loc} have reported that standard administrative procedures were not followed while processing their application.',
  ],
  Other: [
    'An unresolved public nuisance issue near {loc} continues to cause inconvenience to residents and shopkeepers alike.',
    'Encroachment on the footpath at {loc} has forced pedestrians to walk on the main road, creating safety risks.',
    'Residents near {loc} have raised concerns about an ongoing issue that requires municipal attention.',
  ],
};

const IN_PROGRESS_REMARKS = [
  'Field inspection team assigned to the location.',
  'Issue verified on-site; repair work scheduled.',
  'Ward maintenance crew dispatched for assessment.',
  'Complaint forwarded to the concerned municipal department.',
];
const RESOLVED_REMARKS = [
  'Repair completed and verified on site.',
  'Issue resolved after maintenance crew completed the work.',
  'Resolved following successful field inspection and repair.',
  'Corrective action completed; area inspected and confirmed clear.',
];
const REJECTED_REMARKS = [
  'Insufficient location detail provided to dispatch a team.',
  'Issue falls outside municipal jurisdiction.',
  'Unable to verify the reported issue during site visit.',
  'Duplicate of an already resolved complaint.',
];

const SEED_CITIZENS = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '9810011122' },
  { name: 'Priya Verma', email: 'priya.verma@example.com', phone: '9810022233' },
  { name: 'Rohan Mehta', email: 'rohan.mehta@example.com', phone: '9810033344' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '9810044455' },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '9810055566' },
  { name: 'Neha Kapoor', email: 'neha.kapoor@example.com', phone: '9810066677' },
  { name: 'Karan Malhotra', email: 'karan.malhotra@example.com', phone: '9810077788' },
  { name: 'Divya Nair', email: 'divya.nair@example.com', phone: '9810088899' },
];

// ---- Small helpers ----
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];
const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

// Skews toward small offsets so more complaints land in recent months than a year ago.
const randomAgeDays = (maxDays) => Math.floor(maxDays * Math.pow(Math.random(), 2));

const pickWeighted = (weights) => {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    if (r < w) return key;
    r -= w;
  }
  return entries[entries.length - 1][0];
};

// Downgrades a randomly picked target status if the complaint isn't old enough to have
// plausibly gone through the corresponding statusHistory transitions yet.
const resolveTargetStatus = (rawStatus, ageDays) => {
  if (rawStatus === 'Resolved') {
    if (ageDays >= 14) return 'Resolved';
    if (ageDays >= 3) return 'In Progress';
    return 'Pending';
  }
  if (rawStatus === 'In Progress') {
    return ageDays >= 3 ? 'In Progress' : 'Pending';
  }
  if (rawStatus === 'Rejected') {
    return ageDays >= 5 ? 'Rejected' : 'Pending';
  }
  return 'Pending';
};

// Builds a statusHistory chain matching the real submission flow's first entry
// (complaintController.submitComplaint), then appends admin transitions as needed.
const buildStatusHistory = (status, createdAt, citizenId, adminId) => {
  const history = [
    {
      status: 'Pending',
      changedBy: citizenId,
      remarks: 'Complaint filed successfully after email verification.',
      changedAt: createdAt,
    },
  ];

  if (status === 'Pending') {
    return { history, topRemarks: '', updatedAt: createdAt };
  }

  if (status === 'Rejected') {
    const rejectedAt = addDays(createdAt, randomInt(2, 5));
    const remarks = randomChoice(REJECTED_REMARKS);
    history.push({ status: 'Rejected', changedBy: adminId, remarks, changedAt: rejectedAt });
    return { history, topRemarks: remarks, updatedAt: rejectedAt };
  }

  // In Progress / Resolved both pass through an In Progress transition first, mirroring
  // the admin console's enforced Pending -> In Progress -> Resolved state machine.
  const inProgressAt = addDays(createdAt, randomInt(1, 3));
  const inProgressRemarks = randomChoice(IN_PROGRESS_REMARKS);
  history.push({ status: 'In Progress', changedBy: adminId, remarks: inProgressRemarks, changedAt: inProgressAt });

  if (status === 'In Progress') {
    return { history, topRemarks: inProgressRemarks, updatedAt: inProgressAt };
  }

  const resolvedAt = addDays(inProgressAt, randomInt(2, 8));
  const resolvedRemarks = randomChoice(RESOLVED_REMARKS);
  history.push({ status: 'Resolved', changedBy: adminId, remarks: resolvedRemarks, changedAt: resolvedAt });
  return { history, topRemarks: resolvedRemarks, updatedAt: resolvedAt };
};

const generateTrackingId = (date, existingIds) => {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  let trackingId;
  do {
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    trackingId = `COMP-${datePart}-${randomPart}`;
  } while (existingIds.has(trackingId));
  existingIds.add(trackingId);
  return trackingId;
};

const cleanupSeedData = async () => {
  const seedUsers = await User.find({ email: /@example\.com$/i, role: 'citizen' });
  const seedUserIds = seedUsers.map((u) => u._id);

  if (seedUserIds.length === 0) {
    console.log('--fresh: no existing seed data found.');
    return;
  }

  const deletedComplaints = await Complaint.deleteMany({ citizenId: { $in: seedUserIds } });
  const deletedUsers = await User.deleteMany({ _id: { $in: seedUserIds } });
  console.log(`--fresh: removed ${deletedComplaints.deletedCount} complaint(s) and ${deletedUsers.deletedCount} seed citizen(s).`);
};

const ensureSeedCitizens = async () => {
  const citizens = [];
  for (const c of SEED_CITIZENS) {
    let user = await User.findOne({ email: c.email });
    if (!user) {
      user = await User.create({
        name: c.name,
        email: c.email,
        phone: c.phone,
        password: 'SeedCitizenPass123',
        role: 'citizen',
        isVerified: true,
      });
    }
    citizens.push(user);
  }
  return citizens;
};

const buildComplaintDoc = (context) => {
  const { citizens, admin, existingTrackingIds, now } = context;

  const category = pickWeighted(CATEGORY_WEIGHTS);
  const questions = CATEGORY_QUESTIONNAIRES[category];
  const location = randomChoice(LOCATIONS);
  const citizen = randomChoice(citizens);

  // Dynamic questionnaire answers, mirroring FileComplaint/index.jsx's submission payload.
  const answers = {};
  questions.forEach((q) => {
    answers[q.id] = Math.random() < 0.35 ? 'Yes' : 'No';
  });
  const yesCount = Object.values(answers).filter((a) => a === 'Yes').length;
  const urgencyLevel = yesCount >= 3 ? 'High Urgency' : yesCount >= 1 ? 'Medium Urgency' : 'Standard Urgency';

  const title = randomChoice(TITLE_TEMPLATES[category]).replace('{loc}', location.short);
  const freeText = randomChoice(DESCRIPTION_TEMPLATES[category]).replace('{loc}', location.short);

  let questionnaireSummary = '[CATEGORY QUESTIONNAIRE RESPONSES]\n';
  questions.forEach((q) => {
    questionnaireSummary += `• ${q.question}: ${answers[q.id]}\n`;
  });
  questionnaireSummary += `\n[CITIZEN DESCRIPTION]\n${freeText}`;

  const ageDays = randomAgeDays(DAYS);
  const msOffsetInDay = Math.floor(Math.random() * MS_PER_DAY);
  const createdAt = new Date(now.getTime() - ageDays * MS_PER_DAY - msOffsetInDay);

  const rawStatus = pickWeighted(STATUS_WEIGHTS);
  const status = resolveTargetStatus(rawStatus, ageDays);
  const { history, topRemarks, updatedAt } = buildStatusHistory(status, createdAt, citizen._id, admin._id);

  const trackingId = generateTrackingId(createdAt, existingTrackingIds);

  return {
    trackingId,
    citizenId: citizen._id,
    title,
    description: questionnaireSummary,
    category,
    location: location.full,
    images: [],
    status,
    isPublic: true,
    remarks: topRemarks,
    urgencyLevel,
    statusHistory: history,
    createdAt,
    updatedAt,
  };
};

const run = async () => {
  await connectDB();

  console.log(`Seeding complaints: count=${COUNT}, days=${DAYS}, fresh=${FRESH}`);

  if (FRESH) {
    await cleanupSeedData();
  }

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user found. Run `node seedAdmin.js` first, then re-run this script.');
    await mongoose.connection.close();
    process.exit(1);
  }

  const citizens = await ensureSeedCitizens();

  const existingTrackingIds = new Set(
    (await Complaint.find({}, 'trackingId').lean()).map((c) => c.trackingId)
  );

  const now = new Date();
  const docs = [];
  for (let i = 0; i < COUNT; i++) {
    docs.push(buildComplaintDoc({ citizens, admin, existingTrackingIds, now }));
  }

  const CHUNK_SIZE = 25;
  let inserted = 0;
  for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
    const chunk = docs.slice(i, i + CHUNK_SIZE);
    // timestamps: false — otherwise Mongoose would overwrite our backdated createdAt/updatedAt.
    await Complaint.insertMany(chunk, { timestamps: false });
    inserted += chunk.length;
    console.log(`Inserted ${inserted}/${docs.length} complaints...`);
  }

  const statusTally = docs.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});
  const totalComplaints = await Complaint.countDocuments();

  console.log('\n======================================');
  console.log('Seed complete');
  console.log('======================================');
  console.log(`Inserted this run: ${docs.length}`);
  console.log(`Status breakdown (this run): ${JSON.stringify(statusTally)}`);
  console.log(`Total complaints in database: ${totalComplaints}`);
  console.log('======================================\n');

  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
