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

// ---- Static reference data mirrored from mobile/src/constants/categories.js ----
// (scripts run standalone via `node`, outside the app's Metro bundle, so this can't
// import that ESM module directly — kept in sync by hand.)
const CATEGORY_QUESTIONNAIRES = {
  'Pothole / Road Damage': [
    { id: 'q_accident', question: 'Has this pothole/damage caused an accident or vehicle damage?', weight: 2 },
    { id: 'q_size', question: 'Is the pothole/damage large or deep enough to be a serious hazard?', weight: 2 },
    { id: 'q_traffic', question: 'Is it affecting vehicle movement or blocking traffic?', weight: 1 },
    { id: 'q_duration', question: 'Has the problem existed for more than one week?', weight: 1 },
    { id: 'q_public_facility', question: 'Is a school, hospital, or busy market nearby?', weight: 1 },
  ],
  'Garbage / Litter': [
    { id: 'q_health_hazard', question: 'Is there a foul odor, pest infestation, or health hazard?', weight: 2 },
    { id: 'q_overflowing', question: 'Is garbage overflowing onto the road or public path?', weight: 1 },
    { id: 'q_uncollected', question: 'Has garbage been uncollected for more than 48 hours?', weight: 1 },
    { id: 'q_public_facility', question: 'Is a school, hospital, or food market located nearby?', weight: 1 },
    { id: 'q_inconvenience', question: 'Is the issue causing severe public inconvenience?', weight: 1 },
  ],
  'Open Manhole': [
    { id: 'q_uncovered', question: 'Is the manhole completely uncovered, posing a fall hazard?', weight: 2 },
    { id: 'q_busy_area', question: 'Is it located on a busy road, pathway, or residential area with children?', weight: 2 },
    { id: 'q_duration', question: 'Has it been open for more than 2 days?', weight: 1 },
    { id: 'q_lighting', question: 'Is the area poorly lit, making the manhole hard to notice at night?', weight: 1 },
    { id: 'q_near_facility', question: 'Is a school or playground located nearby?', weight: 1 },
  ],
  Graffiti: [
    { id: 'q_offensive', question: 'Does the graffiti contain offensive, hateful, or inappropriate content?', weight: 2 },
    { id: 'q_public_building', question: 'Is it on a government building, monument, or public property?', weight: 1 },
    { id: 'q_duration', question: 'Has it been there for more than two weeks?', weight: 1 },
    { id: 'q_high_visibility', question: 'Is it in a high-visibility public area?', weight: 1 },
    { id: 'q_repeat', question: 'Is this a recurring vandalism spot?', weight: 1 },
  ],
};

// Weighted so the category donut isn't flat — potholes/garbage are the most common
// municipal complaint types in practice, rarer hazards (open manholes, graffiti) less so.
const CATEGORY_WEIGHTS = {
  'Pothole / Road Damage': 6,
  'Garbage / Litter': 5,
  'Open Manhole': 2,
  Graffiti: 2,
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
  'Pothole / Road Damage': [
    'Deep pothole near {loc} bus stop',
    'Road surface collapsed on {loc} main stretch',
    'Large cracks forming across {loc} carriageway',
    'Cluster of potholes slowing traffic on {loc}',
    'Uneven road patch after utility digging in {loc}',
  ],
  'Garbage / Litter': [
    'Garbage pile uncollected for days in {loc}',
    'Overflowing dustbins near {loc} market',
    'Illegal waste dumping spotted at {loc}',
    'Foul smell from uncollected trash in {loc}',
    'Litter scattered across {loc} pavement',
  ],
  'Open Manhole': [
    'Uncovered manhole poses fall risk near {loc}',
    'Open manhole cover reported on {loc} main road',
    'Missing manhole cover near {loc} school zone',
    'Manhole left uncovered after maintenance in {loc}',
    'Dangerous open drain cover spotted at {loc}',
  ],
  Graffiti: [
    'Graffiti covering public wall near {loc}',
    'Offensive graffiti spotted on {loc} community center',
    'Vandalized bus shelter with graffiti at {loc}',
    'Spray-paint tags defacing {loc} underpass',
    'Graffiti on municipal building near {loc}',
  ],
};

const DESCRIPTION_TEMPLATES = {
  'Pothole / Road Damage': [
    'The road near {loc} has a severe pothole that has damaged multiple vehicle tyres and continues to worsen with each rainfall.',
    'A large section of the carriageway at {loc} has caved in, forcing vehicles to swerve dangerously into oncoming traffic.',
    'Cracks have spread across the entire road surface at {loc}, making the commute unsafe especially for two-wheelers at night.',
  ],
  'Garbage / Litter': [
    'Household waste has been piling up uncollected near {loc} for over 48 hours, attracting stray animals and pests.',
    'The community dustbin at {loc} is overflowing onto the street, creating a foul smell and health hazard for nearby residents.',
    'Litter and food wrappers are scattered across the pavement at {loc}, making the area look neglected and unhygienic.',
  ],
  'Open Manhole': [
    'An uncovered manhole near {loc} poses a serious fall risk to pedestrians, especially after dark.',
    'The manhole cover on the main road at {loc} appears to have been missing for several days, endangering commuters.',
    'A drain cover near the {loc} school zone has been left open, putting children at risk while walking to school.',
  ],
  Graffiti: [
    'A public wall near {loc} has been covered in graffiti, making the area look unkempt and neglected.',
    'Offensive graffiti has appeared on the community center building at {loc}, drawing complaints from residents.',
    'The underpass near {loc} has been repeatedly defaced with spray-paint tags over the past month.',
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
  // Mirrors mobile/src/utils/urgency.js's weighted-ratio calculation: each question's
  // severity `weight` (2 = safety-critical, 1 = standard) is summed for "Yes" answers and
  // scored as a proportion of the category's total possible weight.
  const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 1), 0);
  const scoredWeight = questions.reduce((sum, q) => sum + (answers[q.id] === 'Yes' ? q.weight || 1 : 0), 0);
  const urgencyRatio = totalWeight > 0 ? scoredWeight / totalWeight : 0;
  const urgencyLevel = urgencyRatio >= 0.6 ? 'High Urgency' : urgencyRatio >= 0.3 ? 'Medium Urgency' : 'Standard Urgency';

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
    // Mirrors adminController.updateComplaintStatus's real resolution side-effect.
    pdfReceiptUrl: status === 'Resolved' ? `/api/complaints/download-receipt/${trackingId}` : '',
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
