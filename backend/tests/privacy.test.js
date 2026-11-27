// C6: privacy regression tests (B2 photo metadata, B3 text redaction, B4 research
// keys and generalisation, B6 registry allow-list).
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import request from 'supertest';
import sharp from 'sharp';

import {
  startServer, stopServer, resetState, makeStaff, makeResearcher, fileComplaint, complaintAt, jpeg, app,
} from './helpers.js';
import Complaint from '../models/Complaint.js';
import { REGISTRY_FIELDS } from '../utils/publicView.js';
import { RECORD_COLUMNS, K_ANONYMITY, MIN_CELL } from '../utils/researchProjection.js';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const IDENTITY = ['Asha Verma', 'asha.verma@example.test', '9876501234'];

const topLevelKeys = (obj) => Object.keys(obj).filter((k) => k !== '_id');

describe('Privacy', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('uploaded photos are served without EXIF, GPS or device tags', async () => {
    const original = await jpeg({ gps: true });
    const before = await sharp(original).metadata();
    assert.ok(before.exif, 'fixture must carry EXIF');

    const res = await fileComplaint({}, { images: [original] });
    assert.equal(res.status, 201, res.body.message);
    const c = await Complaint.findOne({ trackingId: res.body.complaint.trackingId }).lean();
    const served = await request(app).get(c.images[0]).buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on('data', (d) => chunks.push(d));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    assert.equal(served.status, 200);
    const meta = await sharp(served.body).metadata();
    assert.equal(meta.exif, undefined);
    assert.equal(meta.xmp, undefined);
    assert.equal(meta.iptc, undefined);
    assert.ok(!served.body.includes(Buffer.from('TestPhone')));
  });

  it('a file that is not an image is refused and not kept', async () => {
    const fs = await import('fs');
    const count = () => fs.readdirSync(process.env.UPLOAD_DIR).length;
    const before = count();
    const bad = await request(app)
      .post('/api/complaints')
      .attach('images', Buffer.from('<?php echo 1; ?>'), { filename: 'x.jpg', contentType: 'image/jpeg' });
    assert.equal(bad.status, 400);
    assert.equal(count(), before);
  });

  it('phone numbers, emails, Aadhaar, PAN and plates are removed from published text', async () => {
    const res = await fileComplaint({
      title: 'Pothole call 9876543210',
      description: 'Contact me at asha@example.org or +91 98765 43210. Aadhaar 1234 5678 9012, PAN ABCDE1234F, car MP 04 AB 1234.',
      location: 'Near shop of 9123456789',
    });
    assert.equal(res.status, 201, res.body.message);
    const reg = await request(app).get('/api/public/complaints').expect(200);
    const tr = await request(app).get(`/api/complaints/track/${res.body.complaint.trackingId}`).expect(200);
    for (const body of [JSON.stringify(reg.body), JSON.stringify(tr.body)]) {
      for (const leaked of ['9876543210', 'asha@example.org', '98765 43210', '1234 5678 9012', 'ABCDE1234F', 'MP 04 AB 1234', '9123456789']) {
        assert.ok(!body.includes(leaked), `${leaked} leaked`);
      }
      assert.ok(body.includes('[removed]'));
    }
  });

  it('staff remarks are redacted before they reach the tracker', async () => {
    const sup = await makeStaff('supervisor');
    const c = await complaintAt('submitted');
    await request(app)
      .patch(`/api/supervisor/complaints/${c._id}/accept`)
      .set(sup.auth)
      .send({ remarks: 'Call the resident on 9876543210 first.' })
      .expect(200);
    const tr = await request(app).get(`/api/complaints/track/${c.trackingId}`).expect(200);
    assert.ok(!JSON.stringify(tr.body).includes('9876543210'));
  });

  it('registry and tracker contain no identity, contact, citizen ID or staff ID', async () => {
    const sup = await makeStaff('supervisor');
    const res = await fileComplaint({ name: IDENTITY[0], email: IDENTITY[1], phone: IDENTITY[2] });
    const c = await Complaint.findOne({ trackingId: res.body.complaint.trackingId });
    await request(app).patch(`/api/supervisor/complaints/${c._id}/accept`).set(sup.auth).send({ remarks: 'Verified from photos.' }).expect(200);

    const reg = await request(app).get('/api/public/complaints').expect(200);
    const tr = await request(app).get(`/api/complaints/track/${c.trackingId}`).expect(200);
    for (const body of [JSON.stringify(reg.body), JSON.stringify(tr.body)]) {
      for (const secret of [...IDENTITY, String(c.citizenId), String(sup.user._id), sup.user.name, sup.user.email]) {
        assert.ok(!body.includes(secret), `${secret} leaked`);
      }
    }
    // Staff appear in the tracker only as a role label.
    assert.equal(tr.body.complaint.statusHistory[1].changedBy.name, 'Supervisor');
  });

  it('the registry returns only allow-listed fields, even for fields added later', async () => {
    await fileComplaint();
    await Complaint.collection.updateMany({}, { $set: { internalNote: 'secret', newField: 1 } });
    const reg = await request(app).get('/api/public/complaints').expect(200);
    const allowedTop = new Set(REGISTRY_FIELDS.map((f) => f.split('.')[0]));
    for (const item of reg.body.complaints) {
      for (const k of topLevelKeys(item)) assert.ok(allowedTop.has(k), `unexpected registry field ${k}`);
      for (const h of item.statusHistory) {
        for (const k of Object.keys(h)) assert.ok(['status', 'stage', 'changedAt', 'remarks'].includes(k), `unexpected history field ${k}`);
      }
    }
    assert.ok(!JSON.stringify(reg.body).includes('aiAnalysis'));
  });

  // Five complaints that share every released field form one class of size k = 5.
  const sameClass = (n, stage = 'submitted', extra = {}) =>
    Promise.all(Array.from({ length: n }, () => complaintAt(stage, extra)));

  it('two researchers get different record IDs for the same complaint; one researcher gets stable IDs', async () => {
    await sameClass(K_ANONYMITY);
    const a = await makeResearcher();
    const b = await makeResearcher();
    const ra1 = await request(app).get('/api/research/query?records=true').set(a.auth).expect(200);
    const ra2 = await request(app).get('/api/research/query?records=true').set(a.auth).expect(200);
    const rb = await request(app).get('/api/research/query?records=true').set(b.auth).expect(200);
    assert.equal(ra1.body.records.length, K_ANONYMITY);
    assert.deepEqual(ra1.body.records.map((r) => r.recordId), ra2.body.records.map((r) => r.recordId));
    const ids = new Set(ra1.body.records.map((r) => r.recordId));
    assert.ok(rb.body.records.every((r) => !ids.has(r.recordId)));
  });

  it('research records carry only generalised fields (quarter filed, no dates, no resolution time, no text)', async () => {
    await sameClass(K_ANONYMITY, 'closed', { closedAt: new Date() });
    const r = await makeResearcher();
    const res = await request(app).get('/api/research/query?records=true').set(r.auth).expect(200);
    const rec = res.body.records[0];
    assert.deepEqual(Object.keys(rec).sort(), [...RECORD_COLUMNS].sort());
    assert.match(rec.filedQuarter, /^\d{4}-Q[1-4]$/);
    assert.ok(!('resolutionDays' in rec) && !('filedWeek' in rec));
    const csv = await request(app).get('/api/research/export?records=true').set(r.auth).expect(200);
    assert.equal(csv.text.split('\n')[0], RECORD_COLUMNS.join(','));
  });

  it('records in classes smaller than k = 5 are withheld from queries and exports, without a count', async () => {
    await sameClass(K_ANONYMITY);                                  // released
    await sameClass(K_ANONYMITY - 1, 'submitted', { ward: 'Ward 2' }); // class of 4: withheld
    await sameClass(1, 'closed', { closedAt: new Date() });        // unique: withheld
    const r = await makeResearcher();
    const res = await request(app).get('/api/research/query?records=true').set(r.auth).expect(200);
    assert.equal(res.body.records.length, K_ANONYMITY);
    assert.equal(res.body.pagination.total, K_ANONYMITY);
    assert.ok(res.body.records.every((x) => x.ward === 'Ward 1' && x.status === 'Pending'));
    assert.ok(!JSON.stringify(res.body).includes('suppressed"'), 'the number withheld must not be returned');
    const onlyWard2 = await request(app).get('/api/research/query?records=true&ward=Ward%202').set(r.auth).expect(200);
    assert.equal(onlyWard2.body.records.length, 0);
    const exp = await request(app).get('/api/research/export?records=true&format=json').set(r.auth).expect(200);
    assert.equal(exp.body.rowCount, K_ANONYMITY);
  });

  it('a day-level date filter returns the whole quarter, so it cannot split a class', async () => {
    const days = ['2025-01-06', '2025-01-20', '2025-02-11', '2025-03-03', '2025-03-28'];
    await Promise.all(days.map((d) => complaintAt('submitted', { createdAt: new Date(`${d}T10:00:00Z`) })));
    const r = await makeResearcher();
    const res = await request(app)
      .get('/api/research/query?records=true&from=2025-02-11&to=2025-02-11').set(r.auth).expect(200);
    assert.equal(res.body.records.length, days.length);
    assert.ok(res.body.records.every((x) => x.filedQuarter === '2025-Q1'));
  });

  it('aggregate cells below 5 show no counts; small resolved or unresolved parts are hidden', async () => {
    await sameClass(MIN_CELL);                                     // Ward 1: 5 pending
    await sameClass(1, 'closed', { closedAt: new Date() });        // Ward 1: 1 resolved
    await sameClass(MIN_CELL - 1, 'submitted', { ward: 'Ward 2' }); // Ward 2: 4
    const r = await makeResearcher();
    const res = await request(app).get('/api/research/query?groupBy=ward').set(r.auth).expect(200);
    const by = Object.fromEntries(res.body.rows.map((x) => [x.key, x]));
    assert.equal(by['Ward 1'].count, MIN_CELL + 1);
    assert.equal(by['Ward 1'].resolved, null, 'one resolved complaint is a small group');
    assert.equal(by['Ward 1'].avgResolutionDays, null);
    assert.equal(by['Ward 2'].count, null);
    assert.equal(by['Ward 2'].suppressed, true);
    const dash = await request(app).get('/api/research/dashboard').set(r.auth).expect(200);
    assert.equal(dash.body.dashboard.byWard.find((x) => x.key === 'Ward 2').count, null);
  });

  it('the server refuses to start without RESEARCH_HMAC_KEY, or with a short or reused key', () => {
    const cases = [
      { RESEARCH_HMAC_KEY: '' },
      { RESEARCH_HMAC_KEY: 'too-short' },
      { RESEARCH_HMAC_KEY: process.env.JWT_SECRET },
    ];
    for (const override of cases) {
      const env = { ...process.env, ...override, NODE_ENV: 'production', MONGO_URI: 'mongodb://127.0.0.1:1/none' };
      const out = spawnSync(process.execPath, ['server.js'], { cwd: backendDir, env, encoding: 'utf8', timeout: 10000 });
      assert.equal(out.status, 1, `started with ${JSON.stringify(override)}`);
      assert.match(out.stderr, /RESEARCH_HMAC_KEY/);
    }
  });
});
