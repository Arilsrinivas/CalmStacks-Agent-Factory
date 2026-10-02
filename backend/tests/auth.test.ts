import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../src/db/index.js';

describe('Authentication & Identity Endpoints (/api/v1/auth)', () => {
  const app = createApp();

  before(() => {
    resetDatabase(':memory:');
  });

  it('POST /api/v1/auth/register - successfully registers a new client user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'priya.test@example.com',
        password: 'Password@123',
        full_name: 'Priya Sharma',
        role: 'client',
        phone: '+919999000001',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.error, null);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'priya.test@example.com');
    assert.equal(res.body.data.user.role, 'client');
    assert.ok(res.body.timestamp);
  });

  it('POST /api/v1/auth/register - returns 409 Conflict when registering with duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'priya.test@example.com',
        password: 'Password@123',
        full_name: 'Priya Duplicate',
        role: 'client',
        phone: '+919999000002',
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.data, null);
    assert.equal(res.body.error.code, 'USER_ALREADY_EXISTS');
  });

  it('POST /api/v1/auth/register - returns 400 Bad Request on invalid payload properties (under 8 chars, non-string)', async () => {
    let res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'shortpass@example.com',
        password: 'short',
        full_name: 'Short Pass',
        role: 'client',
        phone: '+919999000003',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_FAILED');

    // Test non-string email injection
    res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: { "$ne": null },
        password: 'Password@123',
        full_name: 'Invalid Input',
        role: 'client',
        phone: '+919999000004',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_FAILED');
  });

  it('POST /api/v1/auth/login - successfully authenticates seeded user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'client@example.com',
        password: 'Client@12345',
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'client@example.com');
    assert.equal(res.body.data.user.role, 'client');
  });

  it('POST /api/v1/auth/login - returns 401/400 for incorrect or malformed payload', async () => {
    let res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'client@example.com',
        password: 'WrongPassword@123',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.data, null);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');

    // Test non-string email injection
    res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: { "$ne": null },
        password: 'Password@123',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_FAILED');
  });

  it('GET /api/v1/auth/me - returns authenticated user profile with valid Bearer token', async () => {
    // 1. Login to obtain token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'client@example.com',
        password: 'Client@12345',
      });

    const token = loginRes.body.data.token;

    // 2. Access /me
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'client@example.com');
    assert.equal(res.body.data.role, 'client');
    assert.equal(res.body.data.full_name, 'Aarav Mehta');
  });

  it('GET /api/v1/auth/me - returns 401 Unauthorized without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

});
