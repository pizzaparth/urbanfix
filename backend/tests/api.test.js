// The sixteen API tests reported in the paper (Fig. 15), ported unchanged in intent:
// T1-T6 intake and OTP, T7-T8 privacy, T9-T14 workflow guards, T15 research scope,
// T16 authentication.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import request from 'supertest';

import {
  startServer, stopServer, resetState, makeUser, makeStaff, makeResearcher,
  fileComplaint, complaintAt, latestOtpFor, app,
} from './helpers.js';
import Otp from '../models/Otp.js';

describe('Fig. 15 API tests', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('T1 health check answers 200', async () => {
    await request(app).get('/health').expect(200);
  });

  it('T2 filing without an email is refused (400)', async () => {
    const res = await fileComplaint({ email: '' }, { otp: '123456' });
    assert.equal(res.status, 400);
  });

  it('T3 a category outside the supported set is refused (400)', async () => {
    const res = await fileComplaint({ category: 'Water Leakage', answers: '{}' }, { otp: '123456' });
    assert.equal(res.status, 400);
  });

  it('T4 a wrong OTP is refused (400)', async () => {
    await request(app).post('/api/complaints/request-otp').send({ email: 'citizen@example.test' }).expect(200);
    const issued = latestOtpFor('citizen@example.test');
    const res = await fileComplaint({}, { otp: issued === '000000' ? '111111' : '000000' });
    assert.equal(res.status, 400);
  });

  it('T5 an expired OTP is refused (400)', async () => {
    const email = 'citizen@example.test';
    await Otp.create({
      email,
      otpHash: crypto.createHash('sha256').update(`${email}:123456`).digest('hex'),
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await fileComplaint({}, { otp: '123456' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /expired/i);
  });

  it('T6 a valid complaint is filed (201) and gets a tracking ID', async () => {
    const res = await fileComplaint();
    assert.equal(res.status, 201, res.body.message);
    assert.match(res.body.complaint.trackingId, /^COMP-\d{8}-[A-Z0-9]+$/);
  });

  it('T7 the tracker shows the filing citizen only as "Citizen"', async () => {
    const filed = await fileComplaint({ name: 'Asha Verma' });
    const res = await request(app).get(`/api/complaints/track/${filed.body.complaint.trackingId}`).expect(200);
    const first = res.body.complaint.statusHistory[0];
    assert.equal(first.changedBy.name, 'Citizen');
    assert.ok(!JSON.stringify(res.body).includes('Asha Verma'));
  });

  it('T8 the registry carries no citizen identity', async () => {
    await fileComplaint();
    const res = await request(app).get('/api/public/complaints').expect(200);
    assert.equal(res.body.complaints.length, 1);
    const body = JSON.stringify(res.body);
    assert.ok(!body.includes('citizenId'));
    assert.ok(!body.includes('citizen@example.test'));
  });

  it('T9 a field worker cannot accept a complaint (403)', async () => {
    const field = await makeStaff('field');
    const c = await complaintAt('submitted');
    const res = await request(app)
      .patch(`/api/supervisor/complaints/${c._id}/accept`)
      .set(field.auth)
      .send({ remarks: 'Looks valid to me.' });
    assert.equal(res.status, 403);
  });

  it('T10 remarks shorter than ten characters are refused (400)', async () => {
    const sup = await makeStaff('supervisor');
    const c = await complaintAt('submitted');
    const res = await request(app).patch(`/api/supervisor/complaints/${c._id}/accept`).set(sup.auth).send({ remarks: 'ok' });
    assert.equal(res.status, 400);
  });

  it('T11 a supervisor accepts a submitted complaint (200)', async () => {
    const sup = await makeStaff('supervisor');
    const c = await complaintAt('submitted');
    const res = await request(app)
      .patch(`/api/supervisor/complaints/${c._id}/accept`)
      .set(sup.auth)
      .send({ remarks: 'Verified from the photos.' });
    assert.equal(res.status, 200);
    assert.equal(res.body.complaint.stage, 'accepted');
  });

  it('T12 rejecting after acceptance is an illegal transition (400)', async () => {
    const sup = await makeStaff('supervisor');
    const c = await complaintAt('accepted');
    const res = await request(app)
      .patch(`/api/supervisor/complaints/${c._id}/reject`)
      .set(sup.auth)
      .send({ remarks: 'Changed my mind about it.' });
    assert.equal(res.status, 400);
  });

  it('T13 assigning field staff from another ward is refused (400)', async () => {
    const sup = await makeStaff('supervisor', 'Ward 1');
    const field = await makeStaff('field', 'Ward 2');
    const c = await complaintAt('accepted');
    const res = await request(app)
      .patch(`/api/supervisor/complaints/${c._id}/assign`)
      .set(sup.auth)
      .send({ fieldEmployeeId: String(field.user._id) });
    assert.equal(res.status, 400);
  });

  it('T14 a receipt before closure is refused (400)', async () => {
    const c = await complaintAt('accepted');
    const res = await request(app).get(`/api/complaints/download-receipt/${c.trackingId}`);
    assert.equal(res.status, 400);
  });

  it('T15 an aggregate-only researcher cannot read records (403)', async () => {
    const r = await makeResearcher('aggregate_only');
    const res = await request(app).get('/api/research/query?records=true').set(r.auth);
    assert.equal(res.status, 403);
  });

  it('T16 a wrong password is refused (401)', async () => {
    const u = await makeUser('citizen');
    const res = await request(app).post('/api/auth/login').send({ email: u.user.email, password: 'wrong-password-1' });
    assert.equal(res.status, 401);
  });
});

describe('P9 ward monitoring on the admin dashboard', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('reports flag rate among model-checked complaints and median days to closure per ward', async () => {
    const day = 86400000;
    const t0 = new Date('2026-01-01T00:00:00Z');
    const done = (needsReview) => ({ state: 'done', needsReview, sStar: needsReview ? null : 0.9, tau: 0.4 });
    await complaintAt('closed', { ward: 'Ward 1', createdAt: t0, closedAt: new Date(+t0 + 2 * day), aiAnalysis: done(false) });
    await complaintAt('closed', { ward: 'Ward 1', createdAt: t0, closedAt: new Date(+t0 + 4 * day), aiAnalysis: done(true) });
    await complaintAt('closed', { ward: 'Ward 1', createdAt: t0, closedAt: new Date(+t0 + 9 * day), aiAnalysis: done(true) });
    await complaintAt('submitted', { ward: 'Ward 1', aiAnalysis: { state: 'failed', needsReview: true } });
    await complaintAt('submitted', { ward: 'Ward 2', aiAnalysis: done(false) });

    const admin = await makeUser('admin');
    const res = await request(app).get('/api/admin/stats').set(admin.auth).expect(200);
    const byWard = Object.fromEntries(res.body.stats.wardMonitoring.map((w) => [w.ward, w]));
    assert.deepEqual(byWard['Ward 1'], { ward: 'Ward 1', filed: 4, checked: 3, flagRate: 2 / 3, closed: 3, medianResolutionDays: 4 });
    assert.deepEqual(byWard['Ward 2'], { ward: 'Ward 2', filed: 1, checked: 1, flagRate: 0, closed: 0, medianResolutionDays: null });
  });
});

describe('Admin status control follows the state machine', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  const patch = async (admin, c, status) =>
    request(app).patch(`/api/admin/complaints/${c._id}/status`).set(admin.auth)
      .send({ status, remarks: 'Administrator decision with a reason.' });

  it('cannot close without proof, reject after acceptance, or move backwards', async () => {
    const admin = await makeUser('admin');
    for (const stage of ['accepted', 'assigned', 'work_in_progress']) {
      const c = await complaintAt(stage);
      assert.equal((await patch(admin, c, 'Resolved')).status, 400, `closed from ${stage}`);
      assert.equal((await patch(admin, c, 'Rejected')).status, 400, `rejected from ${stage}`);
      assert.equal((await patch(admin, c, 'Pending')).status, 400, `moved back from ${stage}`);
    }
  });

  it('can accept or reject a submitted complaint and close one with proof', async () => {
    const admin = await makeUser('admin');
    const a = await complaintAt('submitted');
    assert.equal((await patch(admin, a, 'In Progress')).status, 200);
    const r = await complaintAt('submitted');
    assert.equal((await patch(admin, r, 'Rejected')).status, 200);
    const p = await complaintAt('proof_submitted', { completionImages: ['/uploads/proof.jpg'] });
    const res = await patch(admin, p, 'Resolved');
    assert.equal(res.status, 200, res.body.message);
    assert.equal(res.body.complaint.stage, 'closed');
  });
});
