// C4: the research access log is a hash chain; edits and deletions are detected.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { startServer, stopServer, resetState, makeUser, makeResearcher, app } from './helpers.js';
import ResearchAccessLog from '../models/ResearchAccessLog.js';
import { appendAuditLog, verifyAuditChain } from '../utils/auditLog.js';

const write = async (researcherId, n) => {
  for (let i = 0; i < n; i++) {
    await appendAuditLog({ researcherId, action: 'query', recordCount: i, filters: { groupBy: 'ward', page: i + 1 }, ipAddress: '127.0.0.1' });
  }
};

describe('Tamper-evident research audit log', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('50 rows verify as intact', async () => {
    const r = await makeResearcher();
    await write(r.user._id, 50);
    const result = await verifyAuditChain();
    assert.equal(result.ok, true);
    assert.equal(result.checked, 50);
    assert.equal(result.head.seq, 50);
  });

  it('an edited row is reported', async () => {
    const r = await makeResearcher();
    await write(r.user._id, 50);
    // Direct database write, as an attacker with database access would do.
    await ResearchAccessLog.collection.updateOne({ seq: 23 }, { $set: { recordCount: 9999 } });
    const result = await verifyAuditChain();
    assert.equal(result.ok, false);
    assert.deepEqual([result.problem.kind, result.problem.seq], ['edited', 23]);
  });

  it('a deleted row is reported as a gap', async () => {
    const r = await makeResearcher();
    await write(r.user._id, 50);
    await ResearchAccessLog.collection.deleteOne({ seq: 31 });
    const result = await verifyAuditChain();
    assert.equal(result.ok, false);
    assert.deepEqual([result.problem.kind, result.problem.seq], ['gap', 31]);
  });

  it('a recomputed row that does not link to its predecessor is reported', async () => {
    const r = await makeResearcher();
    await write(r.user._id, 10);
    await ResearchAccessLog.collection.updateOne({ seq: 5 }, { $set: { prevHash: 'f'.repeat(64) } });
    const result = await verifyAuditChain();
    assert.equal(result.problem.kind, 'broken_link');
  });

  it('the application cannot update or delete log rows', async () => {
    const r = await makeResearcher();
    await write(r.user._id, 2);
    await assert.rejects(ResearchAccessLog.updateOne({ seq: 1 }, { recordCount: 5 }), /append-only/);
    await assert.rejects(ResearchAccessLog.deleteMany({}), /append-only/);
    const row = await ResearchAccessLog.findOne({ seq: 1 });
    row.recordCount = 7;
    await assert.rejects(row.save(), /append-only/);
  });

  it('parallel research calls keep one unbroken chain', async () => {
    const r = await makeResearcher();
    await Promise.all(Array.from({ length: 25 }, () => request(app).get('/api/research/query').set(r.auth)));
    const result = await verifyAuditChain();
    assert.equal(result.ok, true);
    assert.equal(result.checked, 25);
  });

  it('admins can run the verifier, and the public stats publish the head hash', async () => {
    const admin = await makeUser('admin');
    const r = await makeResearcher();
    await write(r.user._id, 3);
    const v = await request(app).get('/api/admin/audit/research/verify').set(admin.auth).expect(200);
    assert.equal(v.body.ok, true);
    const stats = await request(app).get('/api/public/stats').expect(200);
    assert.deepEqual(stats.body.researchAuditHead, v.body.head);
  });
});
