import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../src/db/index.js';

describe('Case Workspace Secure Collaboration (/api/v1/workspaces)', () => {
  const app = createApp();
  let clientToken: string;
  let unauthorizedClientToken: string;
  let advocateToken: string;
  let workspaceId: string;

  before(async () => {
    resetDatabase(':memory:');

    // Client 1 (participant)
    const clientLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'client@example.com',
        password: 'Client@12345',
      });
    clientToken = clientLogin.body.data.token;

    // Client 2 (unauthorized non-participant)
    const unauthLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'ananya.sharma@example.com',
        password: 'Client@12345',
      });
    unauthorizedClientToken = unauthLogin.body.data.token;

    // Advocate
    const advLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'adv.rajesh.sharma@delhibar.org',
        password: 'Advocate@12345',
      });
    advocateToken = advLogin.body.data.token;

    // Book a consultation to provision a workspace
    const slotsRes = await request(app).get('/api/v1/advocates/adv-delhi-1/slots');
    const slotId = slotsRes.body.data[0].id;

    const bookRes = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        advocate_id: 'adv-delhi-1',
        slot_id: slotId,
        mode: 'video',
      });

    workspaceId = bookRes.body.data.workspace_id;
  });

  it('GET /api/v1/workspaces - lists active workspaces for participant client', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.equal(res.body.data[0].id, workspaceId);
  });

  it('GET /api/v1/workspaces/:id - retrieves workspace details for authorized client', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, workspaceId);
    assert.equal(res.body.data.status, 'active');
  });

  it('GET /api/v1/workspaces/:id - returns 403 Forbidden for non-participant client', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${unauthorizedClientToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('POST /api/v1/workspaces/:id/documents - uploads legal document metadata to vault', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        file_name: 'Commercial_Lease_Agreement_2025.pdf',
        file_url: 'https://vault.legalconnect.internal/docs/lease-2025.pdf',
        file_size_bytes: 2458000,
        mime_type: 'application/pdf',
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.id);
    assert.equal(res.body.data.file_name, 'Commercial_Lease_Agreement_2025.pdf');
    assert.equal(res.body.data.workspace_id, workspaceId);
  });

  it('GET /api/v1/workspaces/:id/documents - lists vault documents for participants', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/documents`)
      .set('Authorization', `Bearer ${advocateToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.equal(res.body.data[0].file_name, 'Commercial_Lease_Agreement_2025.pdf');
  });

  it('POST /api/v1/workspaces/:id/messages - posts privileged message in case thread', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        message_text: 'Dear Counsel, I have uploaded the signed lease agreement for your review before our call.',
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.id);
    assert.ok(res.body.data.message_text.includes('uploaded the signed lease agreement'));
  });

  it('GET /api/v1/workspaces/:id/messages - retrieves chronological message thread', async () => {
    // Post reply from advocate
    await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/messages`)
      .set('Authorization', `Bearer ${advocateToken}`)
      .send({
        message_text: 'Thank you. I am reviewing Clause 14 regarding security deposit return.',
      });

    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/messages`)
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 2);
    assert.ok(res.body.data[0].message_text.includes('Dear Counsel'));
    assert.ok(res.body.data[1].message_text.includes('Clause 14'));
  });
});
