import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCategoryComponentIds,
  getCategoryNavInfo,
} from '../scripts/category-component-map.js';

test('resolveCategoryComponentIds: resolves Braking category to expected component IDs', () => {
  const result = resolveCategoryComponentIds({ categoryId: '5461', categoryName: 'Braking' });
  assert.ok(Array.isArray(result));
  assert.ok(result.length > 0);
  // Braking components include 814 (Front Brake Disc), 816 (Rear Brake Disc), 817 (Front Pads)
  assert.ok(result.includes('814') || result.includes('816') || result.includes('817'));
});

test('getCategoryNavInfo: constructs breadcrumbs and category metadata', () => {
  const nav = getCategoryNavInfo('5461', 'Braking');
  assert.ok(nav);
  assert.equal(String(nav.current?.id), '5461');
  assert.equal(nav.current?.name, 'Braking');
  assert.ok(Array.isArray(nav.breadcrumbs));
  assert.ok(nav.breadcrumbs.length > 0);
  assert.equal(nav.breadcrumbs[0].name, 'Home');
});
