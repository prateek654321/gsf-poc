import test from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import {
  AVAILABLE_STORES,
  getActiveStoreCode,
  setActiveStoreCode,
  getConfig,
} from '../scripts/config.js';

test('store switcher: AVAILABLE_STORES contains default, mobile_en, and staff_en', () => {
  assert.equal(AVAILABLE_STORES.length, 3);
  const codes = AVAILABLE_STORES.map((s) => s.code);
  assert.ok(codes.includes('default'), 'Should include default');
  assert.ok(codes.includes('mobile_en'), 'Should include mobile_en');
  assert.ok(codes.includes('staff_en'), 'Should include staff_en');
});

test('store switcher: getActiveStoreCode defaults to staff_en when not explicitly set', () => {
  window.localStorage.removeItem('gsf_store_code');
  const code = getActiveStoreCode();
  assert.equal(code, 'staff_en');
});

test('store switcher: setActiveStoreCode switches to mobile_en and updates endpoints', () => {
  setActiveStoreCode('mobile_en');
  assert.equal(getActiveStoreCode(), 'mobile_en');
  assert.equal(window.localStorage.getItem('gsf_store_code'), 'mobile_en');

  const cfg = getConfig();
  assert.equal(cfg.storeCode, 'mobile_en');
  assert.ok(cfg.vrmDetailsEndpoint.includes('/rest/mobile_en/V1/'), 'Endpoint should contain /rest/mobile_en/V1/');
  assert.ok(cfg.fitmentSkusEndpoint.includes('/rest/mobile_en/V1/'), 'Endpoint should contain /rest/mobile_en/V1/');
});

test('store switcher: setActiveStoreCode switches to default and updates endpoints', () => {
  setActiveStoreCode('default');
  assert.equal(getActiveStoreCode(), 'default');
  assert.equal(window.localStorage.getItem('gsf_store_code'), 'default');

  const cfg = getConfig();
  assert.equal(cfg.storeCode, 'default');
  assert.ok(cfg.vrmDetailsEndpoint.includes('/rest/default/V1/'), 'Endpoint should contain /rest/default/V1/');
});

test('store switcher: setActiveStoreCode ignores invalid store codes', () => {
  setActiveStoreCode('invalid_store_xyz');
  // Should remain on previous valid store
  assert.equal(getActiveStoreCode(), 'default');
});

test('store switcher: restoring staff_en updates all endpoints back to staff_en', () => {
  setActiveStoreCode('staff_en');
  assert.equal(getActiveStoreCode(), 'staff_en');
  const cfg = getConfig();
  assert.equal(cfg.storeCode, 'staff_en');
  assert.ok(cfg.vrmDetailsEndpoint.includes('/rest/staff_en/V1/'));
});
