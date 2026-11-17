/**
 * Magento GraphQL and REST API Client for GSF Car Parts
 */

export const MAGENTO_CONFIG = {
  graphqlEndpoint: 'https://gsf-carparts-staging.agilecollab.com/graphql',
  restEndpoint: 'https://gsf-carparts-staging.agilecollab.com/rest/V1',
  specialCoupon: 'GSF22',
};

/**
 * Execute GraphQL request against Magento
 * @param {string} query
 * @param {object} variables
 * @returns {Promise<object>}
 */
export async function executeGraphQL(query, variables = {}) {
  const response = await fetch(MAGENTO_CONFIG.graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0]?.message || 'GraphQL error occurred');
  }

  return json.data;
}

/**
 * Fetch top-level and second-level categories for the navigation menu
 */
export async function fetchCategories() {
  const query = `
    query GetCategoryTree {
      categoryList {
        id
        name
        url_key
        url_path
        children_count
        children {
          id
          name
          url_key
          url_path
          children {
            id
            name
            url_key
            url_path
          }
        }
      }
    }
  `;

  const data = await executeGraphQL(query);
  const root = data?.categoryList?.[0];
  return root?.children || [];
}

/**
 * Fragment for product fields
 */
const PRODUCTS_FRAGMENT = `
  fragment Products on ProductInterface {
    id
    name
    art_nr
    quality
    sku
    size_label
    qty
    url_key
    best_seller
    sold_in_pairs
    stop_start_compatible
    warranty_guaranteed_text
    is_recommended
    special_to_date
    special_from_date
    thumbnail {
      url
      label
    }
    promo_offer {
      label
      promo_image
    }
    price_range {
      minimum_price {
        final_price {
          value
          currency
        }
      }
    }
    brand_group {
      id
      name
      sku
      size
      qty
      url_key
      best_seller
      sold_in_pairs
      warranty_guaranteed_text
      is_recommended
      special_price
      special_to_date
      special_from_date
      thumbnail {
        url
        label
      }
      promo_offer {
        label
        promo_image
      }
      price_range {
        minimum_price {
          final_price {
            value
            currency
          }
        }
      }
    }
    extraVariable {
      brand_info {
        id
        title
        image
      }
      breadcrumbs {
        id
        label
      }
    }
  }
`;

const AGGREGATION_FRAGMENT = `
  fragment AggregationFragment on Aggregation {
    label
    count
    attribute_code
    options {
      count
      label
      value
    }
  }
`;

/**
 * Product search & filter query using the user's exact specification
 */
const PRODUCT_FILTER_QUERY = `
  query ProductFilterEngineOil(
    $productPageSize: Int
    $currentPage: Int
    $productSort: ProductAttributeSortInput
    $productfilters: ProductAttributeFilterInput
    $aggregationsFilter: AggregationsFilterInput
  ) {
    products(
      sort: $productSort
      filter: $productfilters
      currentPage: $currentPage
      pageSize: $productPageSize
      specialCoupon: "${MAGENTO_CONFIG.specialCoupon}"
    ) {
      total_count
      page_info {
        page_size
        current_page
        total_pages
      }
      items {
        ...Products
      }
      aggregations(filter: $aggregationsFilter) {
        ...AggregationFragment
      }
    }
  }
  ${PRODUCTS_FRAGMENT}
  ${AGGREGATION_FRAGMENT}
`;

/**
 * Query products with filtering, sorting, pagination, and VRM fitment SKUs
 */
export async function fetchProducts({
  categoryId = null,
  skus = null,
  searchPhrase = null,
  sort = { position: 'ASC' },
  page = 1,
  pageSize = 12,
  priceFrom = null,
  priceTo = null,
  customFilters = {},
} = {}) {
  const productfilters = {};

  if (categoryId) {
    productfilters.category_id = { in: [Number(categoryId)] };
  }

  if (skus && Array.isArray(skus) && skus.length > 0) {
    productfilters.sku = { in: skus };
  }

  if (priceFrom !== null || priceTo !== null) {
    productfilters.price = {};
    if (priceFrom !== null) productfilters.price.from = Number(priceFrom);
    if (priceTo !== null) productfilters.price.to = Number(priceTo);
  }

  // Merge any facet filters (e.g. brand, quality)
  Object.entries(customFilters).forEach(([code, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      productfilters[code] = { in: value };
    } else if (value) {
      productfilters[code] = { eq: String(value) };
    }
  });

  // Magento requires at least one filter criterion in 'filter'
  if (Object.keys(productfilters).length === 0) {
    productfilters.price = { from: 0.01 };
  }

  const variables = {
    currentPage: Number(page) || 1,
    productPageSize: Number(pageSize) || 12,
    productSort: sort || { position: 'ASC' },
    productfilters,
  };

  const data = await executeGraphQL(PRODUCT_FILTER_QUERY, variables);
  return data?.products || { total_count: 0, items: [], aggregations: [] };
}

/**
 * Query a single product by SKU
 */
export async function fetchProductBySku(sku) {
  const query = `
    query GetProductDetail($sku: String!) {
      products(filter: { sku: { eq: $sku } }, pageSize: 1) {
        items {
          ...Products
          description {
            html
          }
          short_description {
            html
          }
        }
      }
    }
    ${PRODUCTS_FRAGMENT}
  `;

  const data = await executeGraphQL(query, { sku });
  return data?.products?.items?.[0] || null;
}

/**
 * REST: VRM Vehicle Details Lookup
 */
export async function fetchVrmDetails(vrm) {
  const url = `${MAGENTO_CONFIG.restEndpoint}/gsf-vrm/vrmdetails?vrm=${encodeURIComponent(vrm)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`VRM lookup failed (${response.status})`);
  }

  const data = await response.json();
  const entry = Array.isArray(data) ? data[0] : data;

  if (!entry || !entry.vrm) {
    throw new Error('Vehicle not found');
  }

  const { session, vehicle } = entry.vrm;
  if (session?.statusCode && session.statusCode !== 'Vehicle_Found') {
    throw new Error(session.statusCode.replace(/_/g, ' ') || 'Vehicle not found');
  }
  if (vehicle?.statusCode && vehicle.statusCode !== 'Ok') {
    throw new Error(vehicle.statusCode || 'Vehicle lookup failed');
  }
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  const componentIds = (vehicle.components || []).map((c) => String(c.id));
  const vehicleData = {
    make: vehicle.make,
    model: vehicle.model,
    description: vehicle.description,
    imageUrl: vehicle.imageUrl,
    fuel: vehicle.fuel,
    engineSize: vehicle.engineSize,
    bodyStyle: vehicle.bodyStyle,
    colour: vehicle.colour,
    year: vehicle.dateFirstRegistered?.slice(0, 4) || vehicle.dateOfManufacture?.slice(0, 4) || '',
  };

  return {
    vrm: vehicle.vrm || vrm,
    sessionId: session?.sessionId || '',
    componentIds,
    components: vehicle.components || [],
    vehicle: vehicleData,
  };
}

/**
 * REST: Fetch Fitment SKUs
 */
export async function fetchFitmentSkus({ sessionId, componentIds, vrm = '', categoryId = '' }) {
  const compStr = Array.isArray(componentIds) ? componentIds.join(',') : String(componentIds);
  const params = new URLSearchParams({
    sessionId,
    componentIds: compStr,
    'vrmFilter[vrm]': vrm,
    categoryIds: categoryId || '',
    bundleCategoryId: '0',
    activeComponentId: '0',
    mandatoryComponentIds: '',
  });

  const url = `${MAGENTO_CONFIG.restEndpoint}/gsf-vrm/skus?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Fitment SKUs lookup failed (${response.status})`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    if (data[0] === 'NoPartsFound' || data[0] === 'ErrorFetchingSkus') {
      return [];
    }
    return data;
  }
  if (data?.active_products && Array.isArray(data.active_products)) {
    return data.active_products;
  }
  return [];
}

/**
 * REST: Check single SKU compatibility
 */
export async function checkProductCompatibility({ sku, sessionId, componentId, categoryId = '' }) {
  const params = new URLSearchParams({
    sku,
    sessionId: sessionId || '',
    componentId: componentId || '',
    categoryId: categoryId || '',
    specialCoupon: MAGENTO_CONFIG.specialCoupon,
  });

  const url = `${MAGENTO_CONFIG.restEndpoint}/gsf-vrm/vehiclecompatibility?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return { isCompatible: false };

  const data = await response.json();
  const resp = data?.vrm?.response || data?.response;
  return {
    isCompatible: Boolean(resp?.isCompatible),
    statusCode: resp?.statusCode,
    recommendedSku: resp?.recommendedSku || null,
  };
}
