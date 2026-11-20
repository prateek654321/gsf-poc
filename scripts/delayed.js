import { sampleRUM } from './aem.js';

/**
 * Standard Adobe Edge Delivery Services delayed phase handler.
 * Executed after a 3000ms delay to ensure zero interference with critical rendering / LCP.
 */

// Core Web Vitals RUM collector enhancement
sampleRUM('cwv');

// Deferred analytics, martech, and non-essential telemetry can be initialized here
