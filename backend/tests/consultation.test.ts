import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../src/db/index.js';

describe('Consultation Scheduling & Workspace Provisioning (/api/v1/consultations)', () => {
  const app = createApp();
  let clientToken: string;
  let advocateToken: string;
  let bookedSlotId: string;
  let createdConsultationId: string;
  let createdWorkspaceId: string;

  before(async () => {
    resetDatabase(':memory:');

    // Login as client
    const clientLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'client@example.com',
        password: 'Client@12345',
      });
    clientToken = clientLogin.body.data.token;

    // Login as Delhi advocate
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'adv.rajesh.sharma@delhibar.org',
        password: 'Advocate@12345',
      });
    advocateToken = advLogin.body.data.token;
  });

  it('POST /api/v1/consultations - successfully books an available slot and auto-provisions case workspace', async () => {
    // 1. Get an open slot for Delhi advocate
    const slotsRes = await request(app).get('/api/v1/advocates/adv-delhi-1/slots');
    assert.ok(slotsRes.body.data.length > 0);
    bookedSlotId = slotsRes.body.data[0].id;

    // 2. Book the slot
    const bookRes = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        advocate_id: 'adv-delhi-1',
        slot_id: bookedSlotId,
        mode: 'video',
        notes: 'Pre-litigation advisory regarding commercial lease default.',
      });

    assert.equal(bookRes.status, 201);
    assert.equal(bookRes.body.error, null);
    assert.ok(bookRes.body.data.consultation.id);
    assert.ok(bookRes.body.data.workspace_id);
    assert.equal(bookRes.body.data.consultation.status, 'requested');

    createdConsultationId = bookRes.body.data.consultation.id;
    createdWorkspaceId = bookRes.body.data.workspace_id;
  });

  it('POST /api/v1/consultations - returns 409 Conflict when attempting to double-book the same slot', async () => {
    const doubleBookRes = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        advocate_id: 'adv-delhi-1',
        slot_id: bookedSlotId,
        mode: 'video',
      });

    assert.equal(doubleBookRes.status, 409);
    assert.equal(doubleBookRes.body.error.code, 'SLOT_ALREADY_BOOKED');
  });

  it('GET /api/v1/consultations - lists scheduled consultations for authenticated client', async () => {
    const res = await request(app)
      .get('/api/v1/consultations')
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((c: { id: string }) => c.id === createdConsultationId));
  });

  it('GET /api/v1/consultations/:id - retrieves consultation details', async () => {
    const res = await request(app)
      .get(`/api/v1/consultations/${createdConsultationId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, createdConsultationId);
    assert.equal(res.body.data.advocate_id, 'adv-delhi-1');
  });

  it('PATCH /api/v1/consultations/:id/status - updates consultation status to confirmed', async () => {
    const res = await request(app)
      .patch(`/api/v1/consultations/${createdConsultationId}/status`)
      .set('Authorization', `Bearer ${advocateToken}`)
      .send({
        status: 'confirmed',
        notes: 'Advocate accepted consultation advisory session.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'confirmed');
  });
});
