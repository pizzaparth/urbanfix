// C3: races on the export quota and on complaint transitions.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { startServer, stopServer, resetState, makeStaff, makeResearcher, complaintAt, app } from './helpers.js';
import Complaint from '../models/Complaint.js';
import sharp from 'sharp';

describe('Concurrency', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('10 parallel exports: at most 5 succeed (daily quota)', async () => {
    const r = await makeResearcher();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request(app).get('/api/research/export?format=json').set(r.auth))
    );
    const ok = results.filter((x) => x.status === 200).length;
    const limited = results.filter((x) => x.status === 429).length;
    assert.equal(ok, 5);
    assert.equal(limited, 5);
    const me = await request(app).get('/api/research/me').set(r.auth).expect(200);
    assert.equal(me.body.usage.exportsRemainingToday, 0);
  });

  it('two supervisors accept the same complaint at once: exactly one succeeds', async () => {
    const a = await makeStaff('supervisor');
    const b = await makeStaff('supervisor');
    const c = await complaintAt('submitted');
    const results = await Promise.all(
      [a, b].map((s) =>
        request(app).patch(`/api/supervisor/complaints/${c._id}/accept`).set(s.auth).send({ remarks: 'Verified on site photos.' })
      )
    );
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const after = await Complaint.findById(c._id).lean();
    assert.equal(after.stage, 'accepted');
    assert.equal(after.statusHistory.filter((h) => h.stage === 'accepted').length, 1);
  });

  it('accept and reject at once: one wins, history has one decision', async () => {
    const a = await makeStaff('supervisor');
    const c = await complaintAt('submitted');
    const results = await Promise.all([
      request(app).patch(`/api/supervisor/complaints/${c._id}/accept`).set(a.auth).send({ remarks: 'Verified on site photos.' }),
      request(app).patch(`/api/supervisor/complaints/${c._id}/reject`).set(a.auth).send({ remarks: 'Duplicate of another one.' }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const after = await Complaint.findById(c._id).lean();
    assert.ok(['accepted', 'triage_rejected'].includes(after.stage));
    assert.equal(after.statusHistory.length, 2);
  });

  it('close and rework at once on submitted proof: one legal result', async () => {
    const sup = await makeStaff('supervisor');
    const field = await makeStaff('field');
    const c = await complaintAt('proof_submitted', { assignedTo: field.user._id, completionImages: ['/uploads/x.jpg'] });
    const results = await Promise.all([
      request(app).patch(`/api/supervisor/complaints/${c._id}/close`).set(sup.auth).send({ remarks: 'Repair checked, closing.' }),
      request(app).patch(`/api/supervisor/complaints/${c._id}/rework`).set(sup.auth).send({ remarks: 'Patch is uneven, redo.' }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const after = await Complaint.findById(c._id).lean();
    assert.ok(['closed', 'assigned'].includes(after.stage));
    assert.equal(after.statusHistory.length, 2);
    assert.equal(Boolean(after.closedAt), after.stage === 'closed');
  });

  it('field proof and supervisor rework race: final stage is legal and history consistent', async () => {
    const sup = await makeStaff('supervisor');
    const field = await makeStaff('field');
    const c = await complaintAt('work_in_progress', { assignedTo: field.user._id });
    const photo = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#888' } }).jpeg().toBuffer();
    const [proof, rework] = await Promise.all([
      request(app)
        .post(`/api/field/tasks/${c._id}/proof`)
        .set(field.auth)
        .field('completionNote', 'Filled and compacted.')
        .attach('images', photo, { filename: 'p.jpg', contentType: 'image/jpeg' }),
      request(app)
        .patch(`/api/supervisor/complaints/${c._id}/rework`)
        .set(sup.auth)
        .send({ remarks: 'Patch is uneven, redo.' }),
    ]);
    // Rework is only legal after proof; whichever order the server saw, the
    // result is one of the two legal end states and the history matches it.
    assert.equal(proof.status, 200);
    assert.ok([200, 400, 409].includes(rework.status));
    const after = await Complaint.findById(c._id).lean();
    const expected = rework.status === 200 ? 'assigned' : 'proof_submitted';
    assert.equal(after.stage, expected);
    assert.equal(after.statusHistory.at(-1).stage, expected);
    const stages = after.statusHistory.map((h) => h.stage);
    assert.deepEqual(stages.slice(1), rework.status === 200 ? ['proof_submitted', 'assigned'] : ['proof_submitted']);
  });
});
