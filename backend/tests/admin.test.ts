import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../src/db/index.js';

describe('Admin Verification & Operational Analytics (/api/v1/admin)', () => {
  const app = createApp();
  let adminToken: string;
  let clientToken: string;

  before(async () => {
    resetDatabase(':memory:');

    // Admin login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@legalconnect.calmstacks.com',
        password: 'Admin@12345',
      });
    adminToken = adminLogin.body.data.token;

    // Client login
    const clientLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'client@example.com',
        password: 'Client@12345',
      });
    clientToken = clientLogin.body.data.token;
  });

  it('GET /api/v1/admin/advocates/pending - lists pending advocate applications for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/advocates/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    for (const adv of res.body.data) {
      assert.equal(adv.verification_status, 'pending');
    }
  });

  it('GET /api/v1/admin/advocates/pending - returns 403 Forbidden when called by a client', async () => {
    const res = await request(app)
      .get('/api/v1/admin/advocates/pending')
      .set('Authorization', `Bearer ${clientToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('PATCH /api/v1/admin/advocates/:id/verify - successfully verifies an advocate profile', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/advocates/adv-pending-1/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        verification_status: 'verified',
        notes: 'State Bar Council enrollment verified against public register.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, 'adv-pending-1');
    assert.equal(res.body.data.verification_status, 'verified');
  });

  it('GET /api/v1/admin/analytics - retrieves operational health metrics and practice area breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.total_registered_users > 0);
    assert.ok(res.body.data.total_verified_advocates > 0);
    assert.ok(typeof res.body.data.practice_area_breakdown === 'object');
    assert.ok(res.body.data.practice_area_breakdown['Property & Real Estate'] > 0);
  });
});
