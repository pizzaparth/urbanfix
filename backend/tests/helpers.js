import './setup-env.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createApp } from '../app.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import { testOutbox } from '../services/emailService.js';
import { resetRateLimits } from '../middleware/rateLimits.js';
import { CATEGORY_QUESTIONNAIRES } from '../constants/questionnaires.js';

let mongod;
export let app;

// One in-memory MongoDB per test file. Set MONGOMS_SYSTEM_BINARY to use an
// installed mongod instead of a downloaded one.
export const startServer = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  app = createApp();
  return app;
};

export const stopServer = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

export const resetState = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  testOutbox.length = 0;
  await resetRateLimits();
};

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

let counter = 0;
export const makeUser = async (role, extra = {}) => {
  counter += 1;
  const user = await User.create({
    name: `${role} user ${counter}`,
    email: `${role}${counter}@example.test`,
    password: 'correct-horse-battery',
    role,
    isVerified: true,
    ...extra,
  });
  return { user, token: sign(user), auth: { Authorization: `Bearer ${sign(user)}` } };
};

export const makeResearcher = (scope = 'anonymised_records') =>
  makeUser('researcher', {
    researcher: {
      institute: 'Test University',
      title: 'Researcher',
      accessGrantedAt: new Date(),
      accessExpiresAt: new Date(Date.now() + 7 * 86400000),
      datasetScope: scope,
    },
  });

export const makeStaff = (role, ward = 'Ward 1') =>
  makeUser(role, { employee: { ward, employeeCode: `E${Date.now()}${Math.random().toString(36).slice(2, 6)}` } });

export const latestOtpFor = (email) => {
  const mail = [...testOutbox].reverse().find((m) => m.to === email && /Verification Code/.test(m.subject));
  return mail?.html.match(/>(\d{6})</)?.[1];
};

export const noAnswers = (category) =>
  Object.fromEntries((CATEGORY_QUESTIONNAIRES[category] || []).map((q) => [q.id, 'No']));

export const complaintFields = (overrides = {}) => {
  const category = overrides.category || 'Pothole / Road Damage';
  return {
    name: 'Test Citizen',
    email: 'citizen@example.test',
    phone: '9876543210',
    title: 'Deep pothole on main road',
    description: 'A deep pothole near the bus stop is damaging vehicles.',
    category,
    location: 'MG Road near bus stop',
    ward: 'Ward 1',
    answers: JSON.stringify(noAnswers(category)),
    ...overrides,
  };
};

// A small JPEG. With gps=true it carries EXIF GPS and camera tags, like a phone photo.
export const jpeg = async ({ gps = false, width = 64, height = 48 } = {}) => {
  let img = sharp({ create: { width, height, channels: 3, background: { r: 120, g: 90, b: 60 } } }).jpeg();
  if (gps) {
    img = img.withExif({
      IFD0: { Make: 'TestPhone', Model: 'Model X', Copyright: 'Owner Name' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '23/1 15/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '77/1 24/1 0/1' },
    });
  }
  return img.toBuffer();
};

// Requests a code, reads it from the test outbox and files the complaint.
export const fileComplaint = async (overrides = {}, { images = [], otp } = {}) => {
  const fields = complaintFields(overrides);
  if (!otp) {
    await request(app).post('/api/complaints/request-otp').send({ email: fields.email }).expect(200);
    otp = latestOtpFor(fields.email);
  }
  const req = request(app).post('/api/complaints');
  for (const [k, v] of Object.entries({ ...fields, otp })) if (v !== undefined) req.field(k, v);
  images.forEach((buf, i) => req.attach('images', buf, { filename: `photo${i}.jpg`, contentType: 'image/jpeg' }));
  return req;
};

export const waitFor = async (check, { timeoutMs = 5000, everyMs = 25 } = {}) => {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > end) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, everyMs));
  }
};

// Puts a complaint straight into a stage, for workflow tests.
export const complaintAt = async (stage, extra = {}) => {
  const citizen = await makeUser('citizen');
  const status = { submitted: 'Pending', triage_rejected: 'Rejected', closed: 'Resolved' }[stage] || 'In Progress';
  return Complaint.create({
    trackingId: `COMP-TEST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    citizenId: citizen.user._id,
    title: 'Seeded complaint',
    description: 'Seeded complaint used by the workflow tests.',
    category: 'Pothole / Road Damage',
    location: 'Test street',
    ward: 'Ward 1',
    status,
    stage,
    isPublic: true,
    statusHistory: [{ status: 'Pending', stage: 'submitted', changedBy: citizen.user._id, remarks: 'Filed.' }],
    ...extra,
  });
};
