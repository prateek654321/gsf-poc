import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVrm,
  formatPlateDisplay,
  getVehicleMotAndHealth,
} from '../scripts/vehicle-lookup.js';

test('normalizeVrm: normalizes various UK plate formats', () => {
  assert.equal(normalizeVrm('WP19 WTE'), 'WP19WTE');
  assert.equal(normalizeVrm('wp19 wte'), 'WP19WTE');
  assert.equal(normalizeVrm('  ea17rsu  '), 'EA17RSU');
  assert.equal(normalizeVrm('ro 64 ffa'), 'RO64FFA');
  assert.equal(normalizeVrm(''), '');
  assert.equal(normalizeVrm(null), '');
});

test('formatPlateDisplay: formats UK registrations with standard spacing', () => {
  assert.equal(formatPlateDisplay('WP19WTE'), 'WP19 WTE');
  assert.equal(formatPlateDisplay('wp19wte'), 'WP19 WTE');
  assert.equal(formatPlateDisplay('EA17RSU'), 'EA17 RSU');
  assert.equal(formatPlateDisplay('RO64'), 'RO64');
  assert.equal(formatPlateDisplay(''), '');
});

test('getVehicleMotAndHealth: calculates deterministic MOT status and advisory', () => {
  const result = getVehicleMotAndHealth('WP19WTE', 2019);
  assert.ok(result);
  assert.equal(result.motStatus, 'Valid');
  assert.equal(result.taxStatus, 'Taxed');
  assert.ok(typeof result.daysLeft === 'number');
  assert.ok(result.daysLeft >= 20 && result.daysLeft <= 160);
  assert.ok(result.motExpiry.length > 5);
  assert.ok(result.serviceRecommendation.length > 0);
});
