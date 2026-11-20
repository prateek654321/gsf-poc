import { getMetadata } from './aem.js';

/**
 * Default fallback configuration for Edge Delivery Services
 * In EDS, environment-specific configs can be set via <meta name="..." content="..."> in head.html,
 * spreadsheet-driven config.json, or window.CONFIG.
 */
const DEFAULT_CONFIG = {
  magentoGraphqlEndpoint: 'https://mcstaging.gsfcarparts.com/graphql',
  vrmDetailsEndpoint: 'https://mcstaging.gsfcarparts.com/rest/default/V1/gsf-vrm/vrmdetails',
  fitmentSkusEndpoint: 'https://mcstaging.gsfcarparts.com/rest/default/V1/gsf-vrm/skus',
  vehicleCompatibilityEndpoint: 'https://mcstaging.gsfcarparts.com/rest/default/V1/gsf-vrm/vehiclecompatibility',
  manufacturersEndpoint: 'https://mcstaging.gsfcarparts.com/rest/default/V1/gsf-vrm/manufacturers',
  modelsEndpoint: 'https://mcstaging.gsfcarparts.com/rest/default/V1/gsf-vrm/models',
  vehicleMetadataEndpoint: 'https://mcstaging.gsfcarparts.com/rest/default/V1/gsf-vrm/vehiclemetadata',
  catalogApiEndpoint: '', // Destination for future Adobe App Builder + API Mesh endpoint
  placeholderImage: 'https://mcstaging.gsfcarparts.com/media/catalog/product/placeholder/default/product_placeholder_2.png',
  specialCoupon: 'PARTS30',
  storeCode: 'default',
  pageSizeDefault: 15,
  pageSizeOptions: [15, 30, 45],
};

let activeConfig = null;

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

  activeConfig = {
    magentoGraphqlEndpoint: window.CONFIG?.magentoGraphqlEndpoint
      || getMetadata('magento-graphql-endpoint')
      || window.ENV?.MAGENTO_GRAPHQL_ENDPOINT
      || DEFAULT_CONFIG.magentoGraphqlEndpoint,

    vrmDetailsEndpoint: window.CONFIG?.vrmDetailsEndpoint
      || getMetadata('vrm-details-endpoint')
      || window.ENV?.VRM_DETAILS_ENDPOINT
      || DEFAULT_CONFIG.vrmDetailsEndpoint,

    fitmentSkusEndpoint: window.CONFIG?.fitmentSkusEndpoint
      || getMetadata('fitment-skus-endpoint')
      || window.ENV?.FITMENT_SKUS_ENDPOINT
      || DEFAULT_CONFIG.fitmentSkusEndpoint,

    vehicleCompatibilityEndpoint: window.CONFIG?.vehicleCompatibilityEndpoint
      || getMetadata('vehicle-compatibility-endpoint')
      || window.ENV?.VEHICLE_COMPATIBILITY_ENDPOINT
      || DEFAULT_CONFIG.vehicleCompatibilityEndpoint,

    manufacturersEndpoint: window.CONFIG?.manufacturersEndpoint
      || getMetadata('manufacturers-endpoint')
      || window.ENV?.MANUFACTURERS_ENDPOINT
      || DEFAULT_CONFIG.manufacturersEndpoint,

    modelsEndpoint: window.CONFIG?.modelsEndpoint
      || getMetadata('models-endpoint')
      || window.ENV?.MODELS_ENDPOINT
      || DEFAULT_CONFIG.modelsEndpoint,

    vehicleMetadataEndpoint: window.CONFIG?.vehicleMetadataEndpoint
      || getMetadata('vehicle-metadata-endpoint')
      || window.ENV?.VEHICLE_METADATA_ENDPOINT
      || DEFAULT_CONFIG.vehicleMetadataEndpoint,

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

    storeCode: window.CONFIG?.storeCode
      || getMetadata('store-code')
      || window.ENV?.STORE_CODE
      || DEFAULT_CONFIG.storeCode,

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
