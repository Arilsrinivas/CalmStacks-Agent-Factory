import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDatabase } from '../src/db/index.js';

describe('Advocates Directory & BCI Rule 36 Search (/api/v1/advocates)', () => {
  const app = createApp();

  before(() => {
    resetDatabase(':memory:');
  });

  it('GET /api/v1/advocates - lists verified advocates across major Indian metro jurisdictions', async () => {
    const res = await request(app).get('/api/v1/advocates');

    assert.equal(res.status, 200);
    assert.equal(res.body.error, null);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 6); // Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata

    // Verify all returned advocates are verified (BCI rule compliance)
    for (const adv of res.body.data) {
      assert.equal(adv.verification_status, 'verified');
      assert.ok(adv.bar_council_enrollment);
      assert.ok(adv.full_name);
    }
  });

  it('GET /api/v1/advocates?city=Delhi - filters advocates by Delhi jurisdiction', async () => {
    const res = await request(app).get('/api/v1/advocates?city=Delhi');

    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    for (const adv of res.body.data) {
      assert.equal(adv.city, 'Delhi');
    }
  });

  it('GET /api/v1/advocates?practice_area=Corporate - filters advocates by practice area', async () => {
    const res = await request(app).get('/api/v1/advocates?practice_area=Corporate');

    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    for (const adv of res.body.data) {
      const hasCorporate = adv.practice_areas.some((p: string) =>
        p.toLowerCase().includes('corporate')
      );
      assert.ok(hasCorporate);
    }
  });

  it('GET /api/v1/advocates?language=Tamil - filters advocates by consultation language', async () => {
    const res = await request(app).get('/api/v1/advocates?language=Tamil');

    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    for (const adv of res.body.data) {
      assert.ok(adv.languages.includes('Tamil'));
    }
  });

  it('GET /api/v1/advocates?fee=2000 - filters advocates by maximum consultation fee', async () => {
    const res = await request(app).get('/api/v1/advocates?fee=2000');

    assert.equal(res.status, 200);
    for (const adv of res.body.data) {
      assert.ok(adv.consultation_fee <= 2000);
    }
  });

  it('GET /api/v1/advocates/:id - retrieves single advocate profile details', async () => {
    const res = await request(app).get('/api/v1/advocates/adv-delhi-1');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, 'adv-delhi-1');
    assert.equal(res.body.data.bar_council_enrollment, 'D/1842/2012');
    assert.equal(res.body.data.full_name, 'Adv. Rajesh Kumar Sharma');
    assert.ok(Array.isArray(res.body.data.courts));
  });

  it('GET /api/v1/advocates/:id - returns 404 for non-existent advocate', async () => {
    const res = await request(app).get('/api/v1/advocates/non-existent-id');

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  it('GET /api/v1/advocates/:id/slots - retrieves open availability slots for booking', async () => {
    const res = await request(app).get('/api/v1/advocates/adv-delhi-1/slots');

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    for (const slot of res.body.data) {
      assert.equal(slot.is_booked, false);
      assert.equal(slot.advocate_id, 'adv-delhi-1');
      assert.ok(slot.start_time);
      assert.ok(slot.mode);
    }
  });
});
