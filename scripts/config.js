import { getMetadata } from './aem.js';

/**
 * Default fallback configuration for Edge Delivery Services
 * In EDS, environment-specific configs can be set via <meta name="..." content="..."> in head.html,
 * spreadsheet-driven config.json, or window.CONFIG.
 */
const DEFAULT_CONFIG = {
  magentoGraphqlEndpoint: 'https://mcstaging.gsfcarparts.com/graphql',
  vrmDetailsEndpoint: 'https://mcstaging.gsfcarparts.com/rest/staff_en/V1/gsf-vrm/vrmdetails',
  fitmentSkusEndpoint: 'https://mcstaging.gsfcarparts.com/rest/staff_en/V1/gsf-vrm/skus',
  vehicleCompatibilityEndpoint: 'https://mcstaging.gsfcarparts.com/rest/staff_en/V1/gsf-vrm/vehiclecompatibility',
  manufacturersEndpoint: 'https://mcstaging.gsfcarparts.com/rest/staff_en/V1/gsf-vrm/manufacturers',
  modelsEndpoint: 'https://mcstaging.gsfcarparts.com/rest/staff_en/V1/gsf-vrm/models',
  vehicleMetadataEndpoint: 'https://mcstaging.gsfcarparts.com/rest/staff_en/V1/gsf-vrm/vehiclemetadata',
  catalogApiEndpoint: '', // Destination for future Adobe App Builder + API Mesh endpoint
  placeholderImage: 'https://mcstaging.gsfcarparts.com/media/catalog/product/placeholder/default/product_placeholder_2.png',
  specialCoupon: 'PARTS30',
  storeCode: 'staff_en',
  pageSizeDefault: 15,
  pageSizeOptions: [15, 30, 45],
};

export const AVAILABLE_STORES = [
  {
    code: 'default',
    id: 1,
    name: 'Default Store',
    label: 'Default (English)',
    shortLabel: 'Default',
    description: 'Standard retail consumer store view',
    icon: '🌐',
  },
  {
    code: 'mobile_en',
    id: 11,
    name: 'Mobile App English',
    label: 'Mobile App (mobile_en)',
    shortLabel: 'Mobile App',
    description: 'Optimized mobile app store view',
    icon: '📱',
  },
  {
    code: 'staff_en',
    id: 13,
    name: 'Staff Website English',
    label: 'Staff Trade (staff_en)',
    shortLabel: 'Staff Trade',
    description: 'Staff & commercial trade account pricing',
    icon: '👔',
  },
];

let activeConfig = null;

/**
 * Returns the currently active store code.
 * Checks localStorage first, then window.CONFIG, metadata, and defaults.
 * @returns {string}
 */
export function getActiveStoreCode() {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage?.getItem('gsf_store_code');
      if (saved && AVAILABLE_STORES.some((s) => s.code === saved)) {
        return saved;
      }
    } catch {}
  }
  return window.CONFIG?.storeCode
    || getMetadata('store-code')
    || window.ENV?.STORE_CODE
    || DEFAULT_CONFIG.storeCode;
}

/**
 * Sets the active store code, persisting to localStorage and cookie,
 * invalidating cached configuration, and dispatching a change event.
 * @param {string} storeCode
 */
export function setActiveStoreCode(storeCode) {
  if (!AVAILABLE_STORES.some((s) => s.code === storeCode)) return;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem('gsf_store_code', storeCode);
      document.cookie = `gsf_store_code=${storeCode};path=/;max-age=31536000;SameSite=Lax`;
    } catch {}
    if (window.CONFIG) {
      window.CONFIG.storeCode = storeCode;
    }
    activeConfig = null;
    try {
      sessionStorage.removeItem('gsf_categories_cache');
    } catch {}
    if (typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsf:store-changed', { detail: { storeCode } }));
    }
  }
}

/**
 * Returns configuration adhering to EDS standards:
 * 1. Checks dynamically loaded window.CONFIG from /config.json (Single Source of Truth)
 * 2. Checks EDS HTML <meta name="..."> tags in document head
 * 3. Checks window.ENV
 * 4. Falls back to DEFAULT_CONFIG
 *
 * @returns {typeof DEFAULT_CONFIG}
 */
export function getConfig() {
  if (activeConfig) return activeConfig;

  const currentStore = getActiveStoreCode();
  const replaceStore = (url) => (url ? url.replace(/\/rest\/[^/]+\/V1\//, `/rest/${currentStore}/V1/`) : url);

  const rawVrmDetails = window.CONFIG?.vrmDetailsEndpoint
    || getMetadata('vrm-details-endpoint')
    || window.ENV?.VRM_DETAILS_ENDPOINT
    || DEFAULT_CONFIG.vrmDetailsEndpoint;

  const rawFitmentSkus = window.CONFIG?.fitmentSkusEndpoint
    || getMetadata('fitment-skus-endpoint')
    || window.ENV?.FITMENT_SKUS_ENDPOINT
    || DEFAULT_CONFIG.fitmentSkusEndpoint;

  const rawVehicleComp = window.CONFIG?.vehicleCompatibilityEndpoint
    || getMetadata('vehicle-compatibility-endpoint')
    || window.ENV?.VEHICLE_COMPATIBILITY_ENDPOINT
    || DEFAULT_CONFIG.vehicleCompatibilityEndpoint;

  const rawManufacturers = window.CONFIG?.manufacturersEndpoint
    || getMetadata('manufacturers-endpoint')
    || window.ENV?.MANUFACTURERS_ENDPOINT
    || DEFAULT_CONFIG.manufacturersEndpoint;

  const rawModels = window.CONFIG?.modelsEndpoint
    || getMetadata('models-endpoint')
    || window.ENV?.MODELS_ENDPOINT
    || DEFAULT_CONFIG.modelsEndpoint;

  const rawMetadata = window.CONFIG?.vehicleMetadataEndpoint
    || getMetadata('vehicle-metadata-endpoint')
    || window.ENV?.VEHICLE_METADATA_ENDPOINT
    || DEFAULT_CONFIG.vehicleMetadataEndpoint;

  activeConfig = {
    magentoGraphqlEndpoint: window.CONFIG?.magentoGraphqlEndpoint
      || getMetadata('magento-graphql-endpoint')
      || window.ENV?.MAGENTO_GRAPHQL_ENDPOINT
      || DEFAULT_CONFIG.magentoGraphqlEndpoint,

    vrmDetailsEndpoint: replaceStore(rawVrmDetails),
    fitmentSkusEndpoint: replaceStore(rawFitmentSkus),
    vehicleCompatibilityEndpoint: replaceStore(rawVehicleComp),
    manufacturersEndpoint: replaceStore(rawManufacturers),
    modelsEndpoint: replaceStore(rawModels),
    vehicleMetadataEndpoint: replaceStore(rawMetadata),

    catalogApiEndpoint: window.CONFIG?.catalogApiEndpoint
      || getMetadata('catalog-api-endpoint')
      || window.ENV?.CATALOG_API_ENDPOINT
      || DEFAULT_CONFIG.catalogApiEndpoint,

    placeholderImage: window.CONFIG?.placeholderImage
      || getMetadata('placeholder-image')
      || DEFAULT_CONFIG.placeholderImage,

    specialCoupon: window.CONFIG?.specialCoupon
      || getMetadata('special-coupon')
      || window.ENV?.SPECIAL_COUPON
      || DEFAULT_CONFIG.specialCoupon,

    storeCode: currentStore,

    pageSizeDefault: window.CONFIG?.pageSizeDefault
      || parseInt(getMetadata('page-size-default'), 10)
      || DEFAULT_CONFIG.pageSizeDefault,

    pageSizeOptions: window.CONFIG?.pageSizeOptions
      || DEFAULT_CONFIG.pageSizeOptions,
  };

  return activeConfig;
}

/**
 * Asynchronously loads /config.json if available to allow spreadsheet / remote config overrides.
 * Uses default browser caching and fails silently back to metadata and DEFAULT_CONFIG.
 */
export async function loadConfig() {
  try {
    const res = await fetch('/config.json');
    if (res.ok) {
      const json = await res.json();
      window.CONFIG = { ...window.CONFIG, ...json };
      activeConfig = null; // Invalidate cache so getConfig() re-evaluates
    }
  } catch (err) {
    console.debug('Using metadata or default config:', err.message);
  }

  return getConfig();
}

export default getConfig;
