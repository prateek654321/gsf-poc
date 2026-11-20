import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isUniversalProduct,
  getBrandNameFromQuality,
  getQualityCodeForBrand,
} from '../scripts/catalog-service.js';

test('isUniversalProduct: detects automotive universal products correctly', () => {
  // Universal products (cleaning, screenwash, tools)
  assert.equal(isUniversalProduct({ name: 'Screenwash 5L Concentrated Winter' }), true);
  assert.equal(isUniversalProduct({ name: 'WD-40 Multi-Use Maintenance Spray 400ml' }), true);
  assert.equal(isUniversalProduct({ name: 'Universal Antifreeze & Coolant Ready Mixed' }), true);
  assert.equal(isUniversalProduct({ name: 'Trade Workshop Socket Set 94 Piece' }), true);

  // Vehicle-specific products (require fitment)
  assert.equal(isUniversalProduct({ name: 'Front Vented Brake Disc Set' }), false);
  assert.equal(isUniversalProduct({ name: 'Rear Brake Pad Set with Sensor' }), false);
  assert.equal(isUniversalProduct({ name: 'Engine Oil Filter Cartridge' }), false);
});

test('getBrandNameFromQuality: maps Magento attribute code to human-readable brand name', () => {
  assert.equal(getBrandNameFromQuality('91098'), 'EBC Brakes');
  assert.equal(getBrandNameFromQuality('90744'), 'Bosch');
  assert.equal(getBrandNameFromQuality('90745'), 'Brembo');
  assert.equal(getBrandNameFromQuality('90746'), 'Febi Bilstein');
  assert.equal(getBrandNameFromQuality('', 'Borg & Beck'), 'Borg & Beck');
});

test('getQualityCodeForBrand: maps brand name to Magento attribute code', () => {
  assert.equal(getQualityCodeForBrand('EBC Brakes'), '91098');
  assert.equal(getQualityCodeForBrand('ebc'), '91098');
  assert.equal(getQualityCodeForBrand('Bosch'), '90744');
  assert.equal(getQualityCodeForBrand('Brembo'), '90745');
});
