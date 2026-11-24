// C7: registry filters are matched literally (no regex or operator injection).
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { startServer, stopServer, resetState, complaintAt, makeStaff, app } from './helpers.js';

describe('Registry filters', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('a catastrophic-backtracking pattern is treated as text and answers fast', async () => {
    await complaintAt('submitted', { location: 'a'.repeat(40) + '!' });
    const started = Date.now();
    const res = await request(app).get('/api/public/complaints').query({ location: '(a+)+$' }).expect(200);
    assert.equal(res.body.complaints.length, 0);
    assert.ok(Date.now() - started < 1000);
  });

  it('".*" does not match everything', async () => {
    await complaintAt('submitted', { location: 'MG Road' });
    const res = await request(app).get('/api/public/complaints').query({ location: '.*' }).expect(200);
    assert.equal(res.body.complaints.length, 0);
    const ok = await request(app).get('/api/public/complaints').query({ location: 'mg road' }).expect(200);
    assert.equal(ok.body.complaints.length, 1);
  });

  it('operator objects in the query string are not passed to MongoDB', async () => {
    await complaintAt('submitted');
    const res = await request(app).get('/api/public/complaints?status[$ne]=x').expect(200);
    assert.equal(res.body.complaints.length, 0);
  });

  it('page size is capped', async () => {
    await complaintAt('submitted');
    const res = await request(app).get('/api/public/complaints?limit=100000').expect(200);
    assert.equal(res.body.pagination.limit, 100);
  });

  it('the supervisor search is escaped too', async () => {
    const sup = await makeStaff('supervisor');
    await complaintAt('submitted', { title: 'Plain title' });
    const res = await request(app).get('/api/supervisor/queue').query({ stage: 'all', search: '.*' }).set(sup.auth).expect(200);
    assert.equal(res.body.complaints.length, 0);
  });
});
