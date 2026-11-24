// C8: urgency is computed on the server from the stored answers (Eq. 2).
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import request from 'supertest';

import { startServer, stopServer, resetState, fileComplaint, noAnswers, app } from './helpers.js';
import { CATEGORY_QUESTIONNAIRES } from '../constants/questionnaires.js';
import { scoreAnswers, bandForScore } from '../utils/urgency.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// Every combination of five yes/no answers for one weight profile.
const allAnswerSets = (category) => {
  const qs = CATEGORY_QUESTIONNAIRES[category];
  return Array.from({ length: 2 ** qs.length }, (_, mask) =>
    Object.fromEntries(qs.map((q, i) => [q.id, mask & (1 << i) ? 'Yes' : 'No']))
  );
};

describe('Server-side urgency', () => {
  before(startServer);
  after(stopServer);
  beforeEach(resetState);

  it('scores all 64 answer combinations of both weight profiles to the right band', () => {
    // Pothole has weights (2,2,1,1,1), litter (2,1,1,1,1): the two profiles of Fig. 5.
    for (const [category, total] of [['Pothole / Road Damage', 7], ['Garbage / Litter', 6]]) {
      const qs = CATEGORY_QUESTIONNAIRES[category];
      assert.equal(qs.reduce((s, q) => s + q.weight, 0), total);
      for (const answers of allAnswerSets(category)) {
        const scored = qs.reduce((s, q) => s + (answers[q.id] === 'Yes' ? q.weight : 0), 0);
        const U = scored / total;
        const expected = U >= 0.6 ? 'High Urgency' : U >= 0.3 ? 'Medium Urgency' : 'Standard Urgency';
        const out = scoreAnswers(category, answers);
        assert.equal(out.level, expected, `${category} ${JSON.stringify(answers)}`);
        assert.ok(Math.abs(out.score - U) < 1e-4);
      }
    }
    // The paper's worked example: one safety-critical yes gives 2/7 (Standard) vs 2/6 (Medium).
    assert.equal(bandForScore(2 / 7), 'Standard Urgency');
    assert.equal(bandForScore(2 / 6), 'Medium Urgency');
  });

  it('ignores a tampered client urgency and stores the answers and score', async () => {
    const category = 'Pothole / Road Damage';
    const res = await fileComplaint({ urgencyLevel: 'High Urgency', answers: JSON.stringify(noAnswers(category)) });
    assert.equal(res.status, 201, res.body.message);
    assert.equal(res.body.complaint.urgencyLevel, 'Standard Urgency');
    const reg = await request(app).get('/api/public/complaints').expect(200);
    const c = reg.body.complaints[0];
    assert.equal(c.urgencyScore, 0);
    assert.deepEqual(c.answers, noAnswers(category));
  });

  it('anyone can recompute the published score from the published answers', async () => {
    const category = 'Open Manhole';
    const answers = { ...noAnswers(category), q_uncovered: 'Yes', q_busy_area: 'Yes', q_lighting: 'Yes' };
    await fileComplaint({ category, answers: JSON.stringify(answers) });
    const c = (await request(app).get('/api/public/complaints').expect(200)).body.complaints[0];
    const qs = CATEGORY_QUESTIONNAIRES[c.category];
    const U = qs.reduce((s, q) => s + (c.answers[q.id] === 'Yes' ? q.weight : 0), 0) / qs.reduce((s, q) => s + q.weight, 0);
    assert.ok(Math.abs(U - c.urgencyScore) < 1e-4);
    assert.equal(c.urgencyLevel, 'High Urgency');
  });

  it('refuses missing, unknown or non yes/no answers', async () => {
    const category = 'Graffiti';
    const missing = { ...noAnswers(category) };
    delete missing.q_repeat;
    for (const bad of [undefined, 'not json', JSON.stringify(missing), JSON.stringify({ ...noAnswers(category), q_extra: 'Yes' }), JSON.stringify({ ...noAnswers(category), q_repeat: 'Maybe' })]) {
      const res = await fileComplaint({ category, answers: bad }, { otp: '123456' });
      assert.equal(res.status, 400, String(bad));
    }
  });

  it('the app copy of the questionnaires matches the server copy', () => {
    const mobile = fs.readFileSync(path.join(here, '../../mobile/src/constants/categories.js'), 'utf8');
    for (const [category, qs] of Object.entries(CATEGORY_QUESTIONNAIRES)) {
      for (const q of qs) {
        const line = new RegExp(`id: '${q.id}', question: '${q.question.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}', weight: ${q.weight}`);
        assert.match(mobile, line, `${category} ${q.id}`);
      }
    }
  });
});
