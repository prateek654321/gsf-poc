import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSearchQuery, escapeHtml } from '../scripts/sanitize.js';

test('escapeHtml: escapes HTML control characters properly', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml('Borg & Beck'), 'Borg &amp; Beck');
  assert.equal(escapeHtml("Part 'A'"), 'Part &#39;A&#39;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('sanitizeSearchQuery: blocks XSS script tags and event handlers', () => {
  assert.equal(sanitizeSearchQuery('<script>alert("xss")</script>'), 'alert xss');
  assert.equal(sanitizeSearchQuery('<img src=x onerror=alert(1)>'), '');
  assert.equal(sanitizeSearchQuery('javascript:alert(document.cookie)'), 'alert document.cookie');
  assert.equal(sanitizeSearchQuery('%3Cscript%3Ealert(1)%3C%2Fscript%3E'), 'alert 1');
});

test('sanitizeSearchQuery: blocks SQL injection patterns and comment markers', () => {
  assert.equal(sanitizeSearchQuery("' OR 1=1 --"), '');
  assert.equal(sanitizeSearchQuery("' UNION SELECT * FROM users --"), 'FROM users');
  assert.equal(sanitizeSearchQuery('DROP TABLE products;'), 'products');
  assert.equal(sanitizeSearchQuery("admin'/* comment */"), 'admin');
  assert.equal(sanitizeSearchQuery("1; EXEC sp_msforeachdb 'DROP DATABASE'"), '1 sp msforeachdb');
});

test('sanitizeSearchQuery: trims whitespace and caps maximum query length', () => {
  assert.equal(sanitizeSearchQuery('   brake   pads   '), 'brake pads');
  const longQuery = 'a'.repeat(120);
  assert.equal(sanitizeSearchQuery(longQuery).length, 80);
});

test('sanitizeSearchQuery: preserves legitimate automotive terms, SKUs, and brands', () => {
  assert.equal(sanitizeSearchQuery('CAS15F64E'), 'CAS15F64E');
  assert.equal(sanitizeSearchQuery('ADLADB114393'), 'ADLADB114393');
  assert.equal(sanitizeSearchQuery('CASTROL GTX 5W-30 C4'), 'CASTROL GTX 5W-30 C4');
  assert.equal(sanitizeSearchQuery('0W-20 Engine Oil'), '0W-20 Engine Oil');
  assert.equal(sanitizeSearchQuery('Borg & Beck'), 'Borg & Beck');
  assert.equal(sanitizeSearchQuery('1.2L / 1.4L'), '1.2L / 1.4L');
  assert.equal(sanitizeSearchQuery('180+ Stores'), '180+ Stores');
});
