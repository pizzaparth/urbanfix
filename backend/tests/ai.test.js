// G1: the backend calls the vision service after filing and stores aiAnalysis.
// A failed or missing service never blocks filing; it flags the complaint for review.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import request from 'supertest';

import { startServer, stopServer, resetState, makeStaff, fileComplaint, jpeg, waitFor, app } from './helpers.js';
import Complaint from '../models/Complaint.js';

const settled = (trackingId) =>
  waitFor(async () => {
    const c = await Complaint.findOne({ trackingId }).lean();
    return c?.aiAnalysis && c.aiAnalysis.state !== 'pending' ? c : null;
  });

// A stand-in for ai_service/main.py with the same response shape.
const fakeService = (handler) =>
  new Promise((resolve) => {
    const calls = [];
    const server = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', (d) => chunks.push(d));
      req.on('end', () => {
        calls.push({ url: req.url, body: Buffer.concat(chunks) });
        handler(req, res, calls.length);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, calls, url: `http://127.0.0.1:${server.address().port}` }));
  });

const tinyJpegBase64 = async () => (await jpeg()).toString('base64');

describe('AI analysis', () => {
  before(startServer);
  after(async () => {
    delete process.env.AI_SERVICE_URL;
    await stopServer();
  });
  beforeEach(async () => {
    await resetState();
    delete process.env.AI_SERVICE_URL;
  });

  it('service not configured: filing succeeds and the complaint is flagged', async () => {
    const res = await fileComplaint({}, { images: [await jpeg()] });
    assert.equal(res.status, 201);
    const c = await settled(res.body.complaint.trackingId);
    assert.equal(c.aiAnalysis.state, 'failed');
    assert.equal(c.aiAnalysis.needsReview, true);
  });

  it('service down: filing answers 201 at once, then 3 attempts, then flagged', async () => {
    const svc = await fakeService(() => {});
    svc.server.close();
    process.env.AI_SERVICE_URL = svc.url; // nothing listens here any more
    const started = Date.now();
    const res = await fileComplaint({}, { images: [await jpeg()] });
    assert.equal(res.status, 201);
    assert.ok(Date.now() - started < 2000);
    const c = await settled(res.body.complaint.trackingId);
    assert.equal(c.aiAnalysis.state, 'failed');
    assert.equal(c.aiAnalysis.needsReview, true);
    assert.equal(c.aiAnalysis.attempts, 3);
  });

  it('service returns 500 twice then answers: the retry stores the result', async () => {
    const annotated = await tinyJpegBase64();
    const svc = await fakeService((req, res, n) => {
      if (n < 3) {
        res.writeHead(500).end('busy');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({
          model_version: 'pothole_road_damage@abc123', tau: 0.25, s_star: 0.91, delta: 0.12, needs_review: false, inference_ms: 40,
          images: [{ index: 0, detections: [{ box: [1, 2, 30, 40], confidence: 0.91, class_name: 'Pothole' }], annotated_jpeg_base64: annotated }],
        })
      );
    });
    process.env.AI_SERVICE_URL = svc.url;
    const res = await fileComplaint({}, { images: [await jpeg()] });
    const c = await settled(res.body.complaint.trackingId);
    svc.server.close();
    assert.equal(svc.calls.length, 3);
    assert.equal(svc.calls[0].url, '/predict/pothole_road_damage');
    assert.equal(c.aiAnalysis.state, 'done');
    assert.equal(c.aiAnalysis.needsReview, false);
    assert.equal(c.aiAnalysis.sStar, 0.91);
    assert.equal(c.aiAnalysis.delta, 0.12);
    assert.equal(c.aiAnalysis.detections[0].className, 'Pothole');
    await request(app).get(c.aiAnalysis.annotatedImages[0]).expect(200);
  });

  it('a slow service does not delay the filing response', async () => {
    const svc = await fakeService((req, res) => setTimeout(() => res.writeHead(503).end(), 1500));
    process.env.AI_SERVICE_URL = svc.url;
    const started = Date.now();
    const res = await fileComplaint({}, { images: [await jpeg()] });
    const elapsed = Date.now() - started;
    assert.equal(res.status, 201);
    assert.ok(elapsed < 1000, `filing took ${elapsed} ms`);
    await settled(res.body.complaint.trackingId);
    svc.server.close();
  });

  it('a complaint without photos is skipped and flagged', async () => {
    const res = await fileComplaint();
    const c = await settled(res.body.complaint.trackingId);
    assert.equal(c.aiAnalysis.state, 'skipped');
    assert.equal(c.aiAnalysis.needsReview, true);
  });

  it('the supervisor sees aiAnalysis; the AI never changes stage or urgency', async () => {
    const svc = await fakeService((req, res) =>
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({ model_version: 'm@1', tau: 0.25, s_star: 0.1, delta: 0.9, needs_review: true, images: [] })
      )
    );
    process.env.AI_SERVICE_URL = svc.url;
    const res = await fileComplaint({}, { images: [await jpeg()] });
    const c = await settled(res.body.complaint.trackingId);
    svc.server.close();
    assert.equal(c.stage, 'submitted');
    assert.equal(c.urgencyLevel, 'Standard Urgency');
    const sup = await makeStaff('supervisor');
    const view = await request(app).get(`/api/supervisor/complaints/${c._id}`).set(sup.auth).expect(200);
    assert.equal(view.body.complaint.aiAnalysis.needsReview, true);
    const pub = await request(app).get(`/api/complaints/track/${c.trackingId}`).expect(200);
    assert.equal(pub.body.complaint.aiAnalysis, undefined);
  });

  // End to end with the real service: AI_SERVICE_E2E_URL=http://127.0.0.1:8000 npm test
  it('end to end with the real vision service', { skip: !process.env.AI_SERVICE_E2E_URL }, async () => {
    const fs = await import('fs');
    const path = await import('path');
    process.env.AI_SERVICE_URL = process.env.AI_SERVICE_E2E_URL;
    const photo = fs.readFileSync(path.resolve('../ai_service/tests/fixtures/pothole.jpg'));
    const res = await fileComplaint({}, { images: [photo] });
    const c = await waitFor(async () => {
      const doc = await Complaint.findOne({ trackingId: res.body.complaint.trackingId }).lean();
      return doc?.aiAnalysis?.state !== 'pending' ? doc : null;
    }, { timeoutMs: 30000 });
    assert.equal(c.aiAnalysis.state, 'done', c.aiAnalysis.error);
    assert.equal(c.aiAnalysis.needsReview, false);
    assert.ok(c.aiAnalysis.sStar >= c.aiAnalysis.tau);
    assert.ok(c.aiAnalysis.delta == null, 'the pothole model is a box detector, so no damage share (A10)');
  });
});
