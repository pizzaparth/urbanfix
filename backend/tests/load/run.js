// Load test (feedback/action.md, C5). Free tools only: autocannon and an in-memory
// MongoDB. Seeds N complaints, starts the API in a child process and measures four
// scenarios. Results go to tests/load/results/<timestamp>.json with the hardware.
//
//   node tests/load/run.js [--count=10000] [--duration=60] [--connections=50,200]
//                          [--submit-connections=20] [--ai=http://127.0.0.1:8000]
//                          [--scenarios=read,submit]
//
// The numbers describe one machine. They are not a claim about city-scale capacity.
import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import autocannon from 'autocannon';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { MongoMemoryServer } from 'mongodb-memory-server';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const COUNT = Number(arg('count', 10000));
const DURATION = Number(arg('duration', 60));
const CONNECTIONS = arg('connections', '50,200').split(',').map(Number);
const SUBMIT_CONNECTIONS = Number(arg('submit-connections', 20));
const AI_URL = arg('ai', '');
// Comma list of read,submit. --scenarios=submit with and without --ai measures the
// filing response time with and without the vision service (action G1, step 6).
const SCENARIOS = arg('scenarios', 'read,submit').split(',');

const env = {
  ...process.env,
  NODE_ENV: 'test', // in-process mail capture: no SMTP traffic during the test
  JWT_SECRET: 'load-test-jwt-secret-0000000000000000',
  RESEARCH_HMAC_KEY: 'load-test-research-key-00000000000000000000',
  RATE_LIMIT_SCALE: '1000000', // limits would otherwise throttle the generator
  UPLOAD_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'urbanfix-load-')),
  ...(AI_URL ? { AI_SERVICE_URL: AI_URL } : {}),
};
delete env.AI_SERVICE_URL_E2E;
if (!AI_URL) delete env.AI_SERVICE_URL;

const CATEGORIES = ['Pothole / Road Damage', 'Garbage / Litter', 'Graffiti'];
const STATUSES = [['submitted', 'Pending'], ['accepted', 'In Progress'], ['closed', 'Resolved'], ['triage_rejected', 'Rejected']];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const seed = async () => {
  const { default: User } = await import('../../models/User.js');
  const { default: Complaint } = await import('../../models/Complaint.js');
  const { default: Otp } = await import('../../models/Otp.js');
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

  const citizen = await User.create({ name: 'Load Citizen', email: 'load@example.test', password: 'load-password-1', role: 'citizen' });
  const researcher = await User.create({
    name: 'Load Researcher', email: 'researcher@example.test', password: 'load-password-1', role: 'researcher',
    researcher: { accessGrantedAt: new Date(), accessExpiresAt: new Date(Date.now() + 86400000), datasetScope: 'anonymised_records' },
  });

  const now = Date.now();
  const trackingIds = [];
  for (let i = 0; i < COUNT; i += 1000) {
    const docs = Array.from({ length: Math.min(1000, COUNT - i) }, (_, j) => {
      const [stage, status] = pick(STATUSES);
      const createdAt = new Date(now - Math.random() * 365 * 86400000);
      const trackingId = `COMP-LOAD-${String(i + j).padStart(6, '0')}`;
      trackingIds.push(trackingId);
      return {
        trackingId, citizenId: citizen._id, title: 'Load test complaint', description: 'Seeded for the load test.',
        category: pick(CATEGORIES), location: 'Load street', ward: `Ward ${1 + Math.floor(Math.random() * 10)}`,
        stage, status, isPublic: true, createdAt, updatedAt: createdAt,
        closedAt: stage === 'closed' ? new Date(createdAt.getTime() + Math.random() * 20 * 86400000) : undefined,
        statusHistory: [{ status: 'Pending', stage: 'submitted', changedBy: citizen._id, remarks: 'Filed.', changedAt: createdAt }],
      };
    });
    await Complaint.insertMany(docs, { timestamps: false });
  }

  // One valid code per possible submission (the code itself is 123456).
  const otps = Array.from({ length: 50000 }, (_, i) => {
    const email = `load${i}@example.test`;
    return { email, otpHash: crypto.createHash('sha256').update(`${email}:123456`).digest('hex'), attempts: 0, expiresAt: new Date(now + 3600000) };
  });
  await Otp.insertMany(otps);

  return { trackingIds, researcherToken: jwt.sign({ id: researcher._id }, env.JWT_SECRET, { expiresIn: '2h' }) };
};

const startApi = (mongoUri) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(here, 'server.js')], { env: { ...env, MONGO_URI: mongoUri, PORT: '0' }, stdio: ['ignore', 'pipe', 'inherit'] });
    child.stdout.on('data', (d) => {
      const m = String(d).match(/READY (\d+)/);
      if (m) resolve({ child, port: Number(m[1]) });
    });
    child.on('exit', (code) => reject(new Error(`API exited with ${code}`)));
  });

const multipart = (fields, image) => {
  const boundary = `----urbanfix${crypto.randomBytes(8).toString('hex')}`;
  const parts = Object.entries(fields).map(
    ([k, v]) => Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`)
  );
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`));
  parts.push(image, Buffer.from(`\r\n--${boundary}--\r\n`));
  return { body: Buffer.concat(parts), type: `multipart/form-data; boundary=${boundary}` };
};

const run = (opts) =>
  new Promise((resolve, reject) => {
    const instance = autocannon({ duration: DURATION, ...opts }, (err, res) => (err ? reject(err) : resolve(res)));
    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: false, renderLatencyTable: false });
  });

const summarise = (name, connections, r) => ({
  scenario: name,
  connections,
  durationS: r.duration,
  requests: r.requests.total,
  requestsPerSecond: r.requests.average,
  latencyMs: { p50: r.latency.p50, p90: r.latency.p90, p97_5: r.latency.p97_5, p99: r.latency.p99, max: r.latency.max },
  non2xx: r.non2xx,
  errors: r.errors,
  timeouts: r.timeouts,
  errorRate: r.requests.total ? (r.non2xx + r.errors) / r.requests.total : 0,
});

const main = async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log(`Seeding ${COUNT} complaints...`);
  const { trackingIds, researcherToken } = await seed();
  const { child, port } = await startApi(mongod.getUri());
  const base = `http://127.0.0.1:${port}`;

  // A ~300 KB photo: random noise compresses badly, like a real phone photo.
  const noise = crypto.randomBytes(640 * 480 * 3);
  const image = await sharp(noise, { raw: { width: 640, height: 480, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
  const answers = JSON.stringify({ q_accident: 'No', q_size: 'Yes', q_traffic: 'No', q_duration: 'No', q_public_facility: 'No' });

  const results = [];
  for (const c of SCENARIOS.includes('read') ? CONNECTIONS : []) {
    console.log(`Registry list, ${c} connections`);
    results.push(summarise('registry_list', c, await run({ url: `${base}/api/public/complaints?page=1&limit=20`, connections: c })));

    console.log(`Tracker lookup, ${c} connections`);
    results.push(summarise('tracker_lookup', c, await run({
      url: base, connections: c,
      requests: [{ method: 'GET', setupRequest: (req) => ({ ...req, path: `/api/complaints/track/${pick(trackingIds)}` }) }],
    })));

    console.log(`Research records (paged, audit-logged), ${c} connections`);
    results.push(summarise('research_records', c, await run({
      url: base, connections: c, headers: { Authorization: `Bearer ${researcherToken}` },
      requests: [{ method: 'GET', setupRequest: (req) => ({ ...req, path: `/api/research/query?records=true&page=${1 + Math.floor(Math.random() * 20)}` }) }],
    })));
  }

  let n = 0;
  if (SCENARIOS.includes('submit')) {
  console.log(`Complaint submission with a ${Math.round(image.length / 1024)} KB photo, ${SUBMIT_CONNECTIONS} connections${AI_URL ? ', AI service on' : ''}`);
  results.push(summarise(AI_URL ? 'submit_with_ai' : 'submit', SUBMIT_CONNECTIONS, await run({
    url: base, connections: SUBMIT_CONNECTIONS,
    requests: [{
      method: 'POST', path: '/api/complaints',
      setupRequest: (req) => {
        const { body, type } = multipart({
          name: 'Load Citizen', email: `load${n++}@example.test`, otp: '123456', title: 'Pothole on load street',
          description: 'A deep pothole on the load test street.', category: 'Pothole / Road Damage',
          location: 'Load street', ward: 'Ward 1', answers,
        }, image);
        return { ...req, body, headers: { ...req.headers, 'content-type': type } };
      },
    }],
  })));
  }

  child.kill();
  await mongoose.disconnect();
  await mongod.stop();

  const cpu = os.cpus();
  const report = {
    date: new Date().toISOString(),
    hardware: { cpu: cpu[0]?.model, cores: cpu.length, memoryGB: Math.round(os.totalmem() / 2 ** 30), platform: `${os.platform()} ${os.release()}`, arch: os.arch() },
    software: { node: process.version, database: 'mongodb-memory-server (in-memory MongoDB, one instance)' },
    settings: { scenarios: SCENARIOS, complaints: COUNT, durationS: DURATION, connections: CONNECTIONS, submitConnections: SUBMIT_CONNECTIONS, imageKB: Math.round(image.length / 1024), aiService: AI_URL || null },
    note: 'autocannon reports p97.5 rather than p95. Single laptop; not a city-scale capacity claim.',
    results,
  };
  const outDir = path.join(here, 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${report.date.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  console.table(results.map((r) => ({ scenario: r.scenario, conn: r.connections, rps: Math.round(r.requestsPerSecond), p50: r.latencyMs.p50, p99: r.latencyMs.p99, errRate: r.errorRate.toFixed(4) })));
  console.log(`Saved ${file}`);
  fs.rmSync(env.UPLOAD_DIR, { recursive: true, force: true });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
