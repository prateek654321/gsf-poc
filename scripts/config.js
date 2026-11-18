import { getMetadata } from './aem.js';

/**
 * Default fallback configuration for Edge Delivery Services
 * In EDS, environment-specific configs can be set via <meta name="..." content="..."> in head.html,
 * spreadsheet-driven config.json, or window.CONFIG.
 */
const DEFAULT_CONFIG = {
  magentoGraphqlEndpoint: 'https://gsf-carparts-staging.agilecollab.com/graphql',
  vrmDetailsEndpoint: 'https://gsf-carparts-staging.agilecollab.com/rest/default/V1/gsf-vrm/vrmdetails',
  fitmentSkusEndpoint: 'https://gsf-carparts-staging.agilecollab.com/rest/default/V1/gsf-vrm/skus',
  vehicleCompatibilityEndpoint: 'https://gsf-carparts-staging.agilecollab.com/rest/default/V1/gsf-vrm/vehiclecompatibility',
  manufacturersEndpoint: 'https://gsf-carparts-staging.agilecollab.com/rest/default/V1/gsf-vrm/manufacturers',
  modelsEndpoint: 'https://gsf-carparts-staging.agilecollab.com/rest/default/V1/gsf-vrm/models',
  vehicleMetadataEndpoint: 'https://gsf-carparts-staging.agilecollab.com/rest/default/V1/gsf-vrm/vehiclemetadata',
  catalogApiEndpoint: '', // Destination for future Adobe App Builder + API Mesh endpoint
  placeholderImage: 'https://gsf-carparts-staging.agilecollab.com/media/catalog/product/placeholder/default/product_placeholder_2.png',
  specialCoupon: 'GSF22',
  storeCode: 'default',
  pageSizeDefault: 15,
  pageSizeOptions: [15, 30, 60],
};

let activeConfig = null;

/**
 * Returns configuration adhering to EDS standards:
 * 1. Checks EDS HTML <meta name="..."> tags in document head
 * 2. Checks window.CONFIG or window.ENV
 * 3. Falls back to DEFAULT_CONFIG
 *
 * @returns {typeof DEFAULT_CONFIG}
 */
export function getConfig() {
  if (activeConfig) return activeConfig;

  activeConfig = {
    magentoGraphqlEndpoint: getMetadata('magento-graphql-endpoint')
      || window.CONFIG?.magentoGraphqlEndpoint
      || window.ENV?.MAGENTO_GRAPHQL_ENDPOINT
      || DEFAULT_CONFIG.magentoGraphqlEndpoint,

    vrmDetailsEndpoint: getMetadata('vrm-details-endpoint')
      || window.CONFIG?.vrmDetailsEndpoint
      || window.ENV?.VRM_DETAILS_ENDPOINT
      || DEFAULT_CONFIG.vrmDetailsEndpoint,

    fitmentSkusEndpoint: getMetadata('fitment-skus-endpoint')
      || window.CONFIG?.fitmentSkusEndpoint
      || window.ENV?.FITMENT_SKUS_ENDPOINT
      || DEFAULT_CONFIG.fitmentSkusEndpoint,

    vehicleCompatibilityEndpoint: getMetadata('vehicle-compatibility-endpoint')
      || window.CONFIG?.vehicleCompatibilityEndpoint
      || window.ENV?.VEHICLE_COMPATIBILITY_ENDPOINT
      || DEFAULT_CONFIG.vehicleCompatibilityEndpoint,

    manufacturersEndpoint: getMetadata('manufacturers-endpoint')
      || window.CONFIG?.manufacturersEndpoint
      || window.ENV?.MANUFACTURERS_ENDPOINT
      || DEFAULT_CONFIG.manufacturersEndpoint,

    modelsEndpoint: getMetadata('models-endpoint')
      || window.CONFIG?.modelsEndpoint
      || window.ENV?.MODELS_ENDPOINT
      || DEFAULT_CONFIG.modelsEndpoint,

    vehicleMetadataEndpoint: getMetadata('vehicle-metadata-endpoint')
      || window.CONFIG?.vehicleMetadataEndpoint
      || window.ENV?.VEHICLE_METADATA_ENDPOINT
      || DEFAULT_CONFIG.vehicleMetadataEndpoint,

    catalogApiEndpoint: getMetadata('catalog-api-endpoint')
      || window.CONFIG?.catalogApiEndpoint
      || window.ENV?.CATALOG_API_ENDPOINT
      || DEFAULT_CONFIG.catalogApiEndpoint,

    placeholderImage: getMetadata('placeholder-image')
      || window.CONFIG?.placeholderImage
      || DEFAULT_CONFIG.placeholderImage,

    specialCoupon: getMetadata('special-coupon')
      || window.CONFIG?.specialCoupon
      || window.ENV?.SPECIAL_COUPON
      || DEFAULT_CONFIG.specialCoupon,

    storeCode: getMetadata('store-code')
      || window.CONFIG?.storeCode
      || window.ENV?.STORE_CODE
      || DEFAULT_CONFIG.storeCode,

    pageSizeDefault: parseInt(getMetadata('page-size-default'), 10)
      || window.CONFIG?.pageSizeDefault
      || DEFAULT_CONFIG.pageSizeDefault,

    pageSizeOptions: window.CONFIG?.pageSizeOptions
      || DEFAULT_CONFIG.pageSizeOptions,
  };

  return activeConfig;
}

/**
 * Asynchronously loads /config.json if available to allow spreadsheet / remote config overrides
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
