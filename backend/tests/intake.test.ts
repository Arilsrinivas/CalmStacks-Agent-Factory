import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../src/db/index.js';

describe('Case Intake & AI Structuring Endpoints (/api/v1/intake)', () => {
  const app = createApp();
  let clientToken: string;

  before(async () => {
    resetDatabase(':memory:');
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'client@example.com',
        password: 'Client@12345',
      });
    clientToken = loginRes.body.data.token;
  });

  it('POST /api/v1/intake/submit - successfully submits narrative and extracts structured legal brief', async () => {
    const narrative = 'Landlord in Bengaluru is refusing to return my security deposit of 80000 INR after lease termination.';

    const res = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        raw_problem_description: narrative,
        preferred_language: 'en',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.error, null);
    assert.ok(res.body.data.id);
    assert.ok(res.body.data.intake_id);
    assert.ok(res.body.data.facts_summary.includes('Bengaluru'));
    assert.equal(res.body.data.parties_involved.client_role, 'Tenant');
    assert.ok(res.body.data.suggested_practice_areas.includes('Property & Real Estate'));
    assert.equal(res.body.data.disclaimer_accepted, true);
    assert.ok(res.body.data.statutory_disclaimer.includes('AI does NOT provide legal advice'));
  });

  it('POST /api/v1/intake/submit - fails validation if narrative is less than 15 characters', async () => {
    const res = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        raw_problem_description: 'Too short',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_FAILED');
  });

  it('GET /api/v1/intake/:id/summary - retrieves synthesized AI summary with statutory disclaimer', async () => {
    // 1. Submit an intake
    const submitRes = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        raw_problem_description: 'The vendor has failed to deliver machinery worth 5 lakh INR under signed commercial contract.',
      });

    const intakeId = submitRes.body.data.intake_id;

    // 2. Fetch summary
    const res = await request(app)
      .get(`/api/v1/intake/${intakeId}/summary`)
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intake_id, intakeId);
    assert.ok(res.body.data.suggested_practice_areas.includes('Corporate & Commercial'));
    assert.ok(res.body.data.statutory_disclaimer);
  });

  it('GET /api/v1/intake/:id/practice-areas - retrieves suggested practice areas', async () => {
    const submitRes = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        raw_problem_description: 'Employer terminated my services without 30 days notice or payment of pending gratuity and salary.',
      });

    const intakeId = submitRes.body.data.intake_id;

    const res = await request(app)
      .get(`/api/v1/intake/${intakeId}/practice-areas`)
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.includes('Labour & Employment'));
  });
});
