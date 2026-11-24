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
import { RECORD_COLUMNS } from '../utils/researchProjection.js';

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

  it('two researchers get different record IDs for the same complaint; one researcher gets stable IDs', async () => {
    await complaintAt('submitted');
    const a = await makeResearcher();
    const b = await makeResearcher();
    const ra1 = await request(app).get('/api/research/query?records=true').set(a.auth).expect(200);
    const ra2 = await request(app).get('/api/research/query?records=true').set(a.auth).expect(200);
    const rb = await request(app).get('/api/research/query?records=true').set(b.auth).expect(200);
    assert.equal(ra1.body.records[0].recordId, ra2.body.records[0].recordId);
    assert.notEqual(ra1.body.records[0].recordId, rb.body.records[0].recordId);
  });

  it('research records carry only generalised fields (ISO week, no dates, no text)', async () => {
    await complaintAt('closed', { closedAt: new Date() });
    const r = await makeResearcher();
    const res = await request(app).get('/api/research/query?records=true').set(r.auth).expect(200);
    const rec = res.body.records[0];
    assert.deepEqual(Object.keys(rec).sort(), [...RECORD_COLUMNS].sort());
    assert.match(rec.filedWeek, /^\d{4}-W\d{2}$/);
    assert.ok(Number.isInteger(rec.resolutionDays));
    const csv = await request(app).get('/api/research/export?records=true').set(r.auth).expect(200);
    assert.equal(csv.text.split('\n')[0], RECORD_COLUMNS.join(','));
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
