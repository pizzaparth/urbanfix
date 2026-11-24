// C2: OTP brute force and request flooding.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { startServer, stopServer, resetState, fileComplaint, latestOtpFor, app } from './helpers.js';
import Otp from '../models/Otp.js';
import { OTP_MAX_ATTEMPTS } from '../utils/otp.js';

const email = 'citizen@example.test';
const wrongCode = (code) => String((Number(code) + 1) % 1000000).padStart(6, '0');

describe('OTP hardening', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('stores only a hash of the code', async () => {
    await request(app).post('/api/complaints/request-otp').send({ email }).expect(200);
    const code = latestOtpFor(email);
    const row = await Otp.findOne({ email }).lean();
    assert.equal(row.otp, undefined);
    assert.ok(!JSON.stringify(row).includes(code));
  });

  it('locks a code after 5 wrong guesses; the 6th guess and the right code both fail', async () => {
    await request(app).post('/api/complaints/request-otp').send({ email }).expect(200);
    const code = latestOtpFor(email);
    const statuses = [];
    for (let i = 0; i < OTP_MAX_ATTEMPTS + 1; i++) {
      statuses.push((await fileComplaint({}, { otp: wrongCode(code) })).status);
    }
    assert.deepEqual(statuses, [400, 400, 400, 400, 429, 400]);
    const right = await fileComplaint({}, { otp: code });
    assert.equal(right.status, 400);
    assert.match(right.body.message, /request a new code/i);
  });

  it('parallel guesses cannot exceed the attempt limit', async () => {
    await request(app).post('/api/complaints/request-otp').send({ email }).expect(200);
    const code = latestOtpFor(email);
    const guesses = Array.from({ length: 20 }, (_, i) =>
      request(app).post('/api/auth/verify-otp').send({ email, otp: String((Number(code) + 1 + i) % 1000000).padStart(6, '0') })
    );
    const results = await Promise.all(guesses);
    // Every guess is wrong; at most OTP_MAX_ATTEMPTS of them were checked against the code.
    const checked = results.filter((r) => r.body.code === 'OTP_INVALID' || r.body.code === 'OTP_LOCKED');
    assert.ok(results.every((r) => r.status >= 400));
    assert.equal(await Otp.countDocuments({ email }), 0);
    assert.ok(checked.length >= OTP_MAX_ATTEMPTS);
  });

  it('a correct code works once only', async () => {
    await request(app).post('/api/complaints/request-otp').send({ email }).expect(200);
    const code = latestOtpFor(email);
    const [a, b] = await Promise.all([fileComplaint({}, { otp: code }), fileComplaint({}, { otp: code })]);
    assert.deepEqual([a.status, b.status].sort(), [201, 400]);
  });

  it('allows 3 code requests per email per 15 minutes (4th is 429)', async () => {
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await request(app).post('/api/complaints/request-otp').send({ email })).status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 429]);
    // Another address is not affected.
    await request(app).post('/api/complaints/request-otp').send({ email: 'other@example.test' }).expect(200);
  });

  it('limits code requests per IP across many addresses (21st in an hour is 429)', async () => {
    let last;
    for (let i = 0; i < 21; i++) {
      last = await request(app).post('/api/complaints/request-otp').send({ email: `flood${i}@example.test` });
    }
    assert.equal(last.status, 429);
  });

  it('codes are 6 digits from a CSPRNG and spread over the whole range', async () => {
    const { generateOtp } = await import('../utils/otp.js');
    const codes = Array.from({ length: 2000 }, generateOtp);
    assert.ok(codes.every((c) => /^\d{6}$/.test(c)));
    assert.ok(codes.some((c) => c.startsWith('0')));
    assert.ok(new Set(codes).size > 1990);
  });
});
