/**
 * Security & Input Sanitization Utilities for AEM Edge Delivery Services
 * Protects against XSS, SQL/GraphQL injection patterns, script tags, and suspicious payloads.
 */

/**
 * Escapes characters for safe inclusion in HTML to prevent DOM XSS.
 * @param {string|any} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes a user-supplied search query string:
 * 1. Strips ASCII control characters & null bytes (0x00-0x1F, 0x7F)
 * 2. Decodes URL-encoded entities to detect obfuscated injections
 * 3. Strips HTML tags (<...>) and JavaScript pseudo-protocols (javascript:, on* event handlers)
 * 4. Strips dangerous punctuation & code execution tokens (quotes, angle brackets, backslashes, semicolons, brackets)
 * 5. Neutralizes common SQL injection signatures (UNION SELECT, DROP TABLE, OR 1=1, comment markers --, /*)
 * 6. Whitelist filter: retains only alphanumeric characters, spaces, and automotive safe chars (- . / & % +)
 * 7. Trims whitespace, collapses multiple consecutive spaces
 * 8. Caps length to a maximum of 80 characters
 *
 * @param {string|any} rawQuery Untrusted query input
 * @returns {string} Clean, safe search query string
 */
export function sanitizeSearchQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return '';
  }

  // 1. Strip ASCII control characters & null bytes
  let cleaned = rawQuery.replace(/[\x00-\x1F\x7F]/g, '');

  // 2. Decode URL-encoded sequences to catch obfuscated payloads like %3Cscript%3E
  try {
    if (cleaned.includes('%')) {
      cleaned = decodeURIComponent(cleaned);
    }
  } catch {
    // Malformed percent-encoding: proceed with raw cleaned string
  }

  // 3. Strip HTML tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');

  // 4. Strip JavaScript/VBScript protocols and event handler attributes
  cleaned = cleaned.replace(/(javascript|vbscript|data):/gi, '');
  cleaned = cleaned.replace(/\bon\w+\s*=/gi, '');

  // 5. Strip dangerous code execution & injection characters:
  // Quotes (', ", `), angle brackets (<, >), semicolons (;), braces ({, }), brackets ([, ]), backslashes (\)
  cleaned = cleaned.replace(/['"`<>\\;{}[\]()]/g, ' ');

  // 6. Strip SQL comment tokens
  cleaned = cleaned.replace(/--+/g, ' ');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ' ');

  // 7. Neutralize destructive SQL injection phrases
  cleaned = cleaned.replace(/\b(union\s+select|drop\s+(table|database)|insert\s+into|delete\s+from|update\s+\w+\s+set|exec\s+)\b/gi, ' ');
  cleaned = cleaned.replace(/\b(or|and)\s+1\s*=\s*1\b/gi, ' ');

  // 8. Whitelist: Retain only standard letters, numbers, spaces, and safe automotive symbols (- . / & % +)
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s\-./&%+]/g, ' ');

  // 9. Collapse multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 10. Cap maximum length to 80 characters
  if (cleaned.length > 80) {
    cleaned = cleaned.slice(0, 80).trim();
  }

  return cleaned;
}
