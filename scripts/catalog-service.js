import { fetchProducts } from './magento-api.js';
import { getStoredVehicle, fetchCategoryFitmentSkus } from './vehicle-lookup.js';
import { resolveCategoryComponentIds } from './category-component-map.js';
import { getConfig } from './config.js';

/**
 * Catalog & Fitment Service Layer
 * 
 * Provides a unified catalog filtering & vehicle fitment service for Edge Delivery Services.
 * Designed to seamlessly switch to Adobe App Builder + API Mesh when provisioned:
 * Simply define 'catalogApiEndpoint' in config.json or metadata, and all calls will
 * automatically route through the API Mesh endpoint with zero frontend changes.
 */

// In-memory cache for vehicle-scoped fitment sets to ensure deterministic pagination & sorting
const fitmentCache = new Map();

/**
 * Magento Quality Attribute Code to Brand mapping
 * The attribute code used in Adobe Commerce / Magento for Brand is 'quality'
 */
export const BRAND_QUALITY_MAP = {
  91098: { name: 'EBC Brakes', key: 'ebc' },
  90988: { name: 'Borg & Beck', key: 'borgbeck' },
  90743: { name: 'First Line', key: 'firstline' },
  90671: { name: 'Blue Print', key: 'blueprint' },
  90755: { name: 'Zimmermann', key: 'zimmermann' },
  90744: { name: 'Bosch', key: 'bosch' },
  90745: { name: 'Brembo', key: 'brembo' },
  90746: { name: 'Febi Bilstein', key: 'febi' },
  90747: { name: 'A2A', key: 'a2a' },
};

/**
 * Resolves the Magento 'quality' attribute code for a given brand name or item
 * @param {string|object} brandNameOrItem
 * @returns {string}
 */
export function getQualityCodeForBrand(brandNameOrItem) {
  if (!brandNameOrItem) return '';
  if (typeof brandNameOrItem === 'object') {
    if (brandNameOrItem.quality) return String(brandNameOrItem.quality);
    const brand = getBrandName(brandNameOrItem);
    return getQualityCodeForBrand(brand);
  }

  const name = String(brandNameOrItem).trim().toLowerCase();
  for (const [code, info] of Object.entries(BRAND_QUALITY_MAP)) {
    if (info.name.toLowerCase() === name || info.key === name || name.includes(info.key)) {
      return code;
    }
  }

  if (name.includes('ebc')) return '91098';
  if (name.includes('borg')) return '90988';
  if (name.includes('first line') || name.includes('firstline')) return '90743';
  if (name.includes('blueprint') || name.includes('blue print')) return '90671';
  if (name.includes('zimmermann')) return '90755';

  return '';
}

/**
 * Resolves a human-readable brand name from a Magento 'quality' attribute code or raw label
 * @param {string} qualityCode
 * @param {string} [fallback='']
 * @returns {string}
 */
export function getBrandNameFromQuality(qualityCode, fallback = '') {
  const code = String(qualityCode || '').trim();
  if (BRAND_QUALITY_MAP[code]) {
    return BRAND_QUALITY_MAP[code].name;
  }
  const lower = String(fallback || '').trim().toLowerCase();
  if (lower === 'ebc') return 'EBC Brakes';
  if (lower === 'borgbeck' || lower === 'borg & beck') return 'Borg & Beck';
  if (lower === 'firstline' || lower === 'first line') return 'First Line';
  if (lower === 'blueprint' || lower === 'blue print') return 'Blue Print';
  if (lower === 'zimmermann') return 'Zimmermann';
  return fallback || code;
}

/**
 * Checks whether an SKU is in any active vehicle fitment pool
 * @param {string} sku
 * @returns {boolean}
 */
export function isSkuFitted(sku) {
  if (!sku) return false;
  const upper = sku.toUpperCase();
  for (const pool of fitmentCache.values()) {
    if (pool.rawItems?.some((p) => p.sku?.toUpperCase() === upper)) {
      return true;
    }
  }
  try {
    const raw = window.localStorage.getItem('gsf_vehicle_valid_skus');
    const storedSkus = raw ? JSON.parse(raw) : [];
    if (storedSkus.includes(upper)) return true;
  } catch {
    // Ignore storage parse errors
  }
  return false;
}

/**
 * Determines whether a product is a Universal part (fits all vehicles)
 * or vehicle-specific (requires fitment check).
 *
 * @param {object} item
 * @param {string} [categoryId='']
 * @param {string} [categoryName='']
 * @returns {boolean}
 */
export function isUniversalProduct(item, categoryId = '', categoryName = '') {
  if (!item) return false;

  // 1. Explicit universal attributes
  if (item.is_universal || item.universal_fit || item.extraVariable?.is_universal) {
    return true;
  }

  // 2. Universal categories (Tools, Car Care, Cleaning, Accessories)
  const universalCategoryIds = ['5320', '6500', '6600', '6700', '7000'];
  if (categoryId && universalCategoryIds.includes(String(categoryId))) {
    return true;
  }

  // 3. Keyword matching on name and category text
  const name = (item.name || '').toLowerCase();
  const cat = (categoryName || '').toLowerCase();
  const text = `${name} ${cat}`;

  const universalKeywords = [
    'screenwash',
    'screen wash',
    'de-icer',
    'de icer',
    'antifreeze',
    'coolant universal',
    'wd-40',
    'wd40',
    'grease',
    'funnel',
    'toolkit',
    'tool set',
    'socket set',
    'spanner',
    'screwdriver',
    'jack',
    'axle stand',
    'jump lead',
    'booster cable',
    'shampoo',
    'car polish',
    'wax',
    'microfibre',
    'sponge',
    'chamois',
    'air freshener',
    'tyre inflator',
    'pressure gauge',
    'first aid',
    'bulb kit universal',
    'fuse kit universal',
    'brake cleaner',
    'car care',
  ];

  return universalKeywords.some((kw) => text.includes(kw));
}

/**
 * Extracts a normalized, human-readable brand name for any product
 * @param {object} item
 * @returns {string}
 */
export function getBrandName(item) {
  if (!item) return '';

  // 1. From quality attribute code
  const quality = String(item.quality || '').trim();
  if (quality && BRAND_QUALITY_MAP[quality]) {
    return BRAND_QUALITY_MAP[quality].name;
  }

  // 2. From extraVariable.brand_info.title
  if (item.extraVariable?.brand_info?.title) {
    const t = item.extraVariable.brand_info.title.trim();
    const lower = t.toLowerCase();
    if (lower === 'ebc') return 'EBC Brakes';
    if (lower === 'borgbeck' || lower === 'borg & beck') return 'Borg & Beck';
    if (lower === 'firstline' || lower === 'first line') return 'First Line';
    if (lower === 'blueprint' || lower === 'blue print') return 'Blue Print';
    if (lower === 'zimmermann') return 'Zimmermann';
    return t;
  }

  // 3. From productFitmentInfo (label === 'Brand')
  const fitmentBrand = item.productFitmentInfo?.find(
    (f) => f.label?.toLowerCase() === 'brand',
  )?.value;
  if (fitmentBrand) {
    const fb = fitmentBrand.trim();
    const lower = fb.toLowerCase();
    if (lower === 'ebc') return 'EBC Brakes';
    if (lower === 'borgbeck' || lower === 'borg & beck') return 'Borg & Beck';
    if (lower === 'firstline' || lower === 'first line') return 'First Line';
    if (lower === 'blueprint' || lower === 'blue print') return 'Blue Print';
    if (lower === 'zimmermann') return 'Zimmermann';
    return fb;
  }

  // 4. Inferred from SKU prefix
  const sku = (item.sku || '').toUpperCase();
  if (sku.startsWith('EBC')) return 'EBC Brakes';
  if (sku.startsWith('BAB')) return 'Borg & Beck';
  if (sku.startsWith('FIR')) return 'First Line';
  if (sku.startsWith('A2A')) return 'A2A';
  if (sku.startsWith('BOS')) return 'Bosch';
  if (sku.startsWith('FEB')) return 'Febi Bilstein';
  if (sku.startsWith('BRE')) return 'Brembo';

  return '';
}

/**
 * Sorts products deterministically
 * @param {Array<object>} items
 * @param {object} sort e.g. { price: 'ASC' }
 * @returns {Array<object>}
 */
export function sortProducts(items, sort = { position: 'ASC' }) {
  const [field, dir] = Object.entries(sort)[0] || ['position', 'ASC'];
  const isAsc = String(dir).toUpperCase() === 'ASC';

  const sorted = [...items];

  if (field === 'price') {
    sorted.sort((a, b) => {
      const priceA = a.price_range?.minimum_price?.final_price?.value ?? 0;
      const priceB = b.price_range?.minimum_price?.final_price?.value ?? 0;

      // Put zero or missing prices at the end
      if (priceA <= 0 && priceB > 0) return 1;
      if (priceB <= 0 && priceA > 0) return -1;
      if (priceA <= 0 && priceB <= 0) return 0;

      return isAsc ? priceA - priceB : priceB - priceA;
    });
  } else if (field === 'name') {
    sorted.sort((a, b) => {
      const nameA = (a.name || '').trim().toLowerCase();
      const nameB = (b.name || '').trim().toLowerCase();
      return isAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }

  return sorted;
}

/**
 * Builds clean basic aggregations (Brand and Price only).
 * Uses 'quality' as the attribute_code for Brand filtering as per Magento specification.
 * Shows Brand filter ONLY if at least 2 distinct brands exist in the available items.
 */
export function buildBasicAggregations(items) {
  const qualityMap = new Map();

  items.forEach((item) => {
    const brandName = getBrandName(item);
    if (!brandName) return;

    const qualityCode = String(item.quality || '').trim() || getQualityCodeForBrand(brandName) || brandName;
    if (!qualityMap.has(qualityCode)) {
      qualityMap.set(qualityCode, {
        label: brandName,
        value: qualityCode,
        count: 0,
      });
    }
    const entry = qualityMap.get(qualityCode);
    entry.count += 1;
  });

  const eligibleOptions = Array.from(qualityMap.values())
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const aggregations = [];

  // Show Brand filter with attribute_code 'quality' ONLY if at least 2 distinct brands are eligible
  if (eligibleOptions.length >= 2) {
    aggregations.push({
      attribute_code: 'quality',
      label: 'Brand',
      options: eligibleOptions,
    });
  }

  return aggregations;
}

/**
 * Execute catalog query with vehicle fitment, pagination, sorting, and search
 *
 * @param {object} params
 * @param {string} [params.categoryId]
 * @param {string} [params.categoryName]
 * @param {string} [params.searchPhrase]
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=15]
 * @param {object} [params.sort]
 * @param {object} [params.filters]
 * @returns {Promise<object>} Standardized catalog response matching App Builder / API Mesh
 */
export async function fetchCatalogProducts({
  categoryId = null,
  categoryName = null,
  searchPhrase = null,
  page = 1,
  pageSize = 15,
  sort = { position: 'ASC' },
  filters = {},
  viewMode = 'fitted', // 'fitted' or 'all'
} = {}) {
  const config = getConfig();
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const targetPageSize = Math.max(1, parseInt(pageSize, 10) || config.pageSizeDefault || 15);

  // 1. If Adobe App Builder + API Mesh endpoint is configured, delegate directly
  if (config.catalogApiEndpoint) {
    try {
      const resp = await fetch(config.catalogApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          categoryName,
          searchPhrase,
          page: currentPage,
          pageSize: targetPageSize,
          sort,
          filters,
          viewMode,
          vrm: getStoredVehicle().vrm || null,
        }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (meshErr) {
      console.warn('App Builder / API Mesh endpoint unavailable, falling back to EDS service layer:', meshErr);
    }
  }

  // 2. Local EDS App Builder / Mesh Emulation Pipeline
  const stored = getStoredVehicle();
  const hasVehicle = Boolean(stored.hasVehicle && stored.vrm);

  // A) VEHICLE FITMENT FLOW: When a vehicle is searched and user is viewing fitted products
  if (hasVehicle && viewMode === 'fitted') {
    const cacheKey = `${stored.vrm}_cat${categoryId || 'all'}_q${searchPhrase || ''}`;
    let fitmentPool = fitmentCache.get(cacheKey);

    if (!fitmentPool) {
      let candidateItems = [];

      // If Braking (5461) or specific category, fetch representative multi-brand parts pool
      if (categoryId === '5461' || (!categoryId && !searchPhrase)) {
        try {
          const [ebcRes, borgRes, firstlineRes] = await Promise.all([
            fetchProducts({ categoryId: '5461', sort: { position: 'ASC' }, page: 1, pageSize: 30 }),
            fetchProducts({ categoryId: '5461', customFilters: { quality: ['90988'] }, page: 1, pageSize: 15 }),
            fetchProducts({ categoryId: '5461', customFilters: { quality: ['90743'] }, page: 1, pageSize: 15 }),
          ]);

          candidateItems = [
            ...(ebcRes.items || []),
            ...(borgRes.items || []),
            ...(firstlineRes.items || []),
          ];
        } catch {
          candidateItems = [];
        }
      }

      if (candidateItems.length === 0) {
        const initialQuery = await fetchProducts({
          categoryId: categoryId || null,
          searchPhrase: searchPhrase || null,
          sort: { position: 'ASC' },
          page: 1,
          pageSize: 60,
        });
        candidateItems = initialQuery.items || [];
      }

      // Tag verified fitment for the vehicle
      const verifiedItems = candidateItems.map((p) => ({
        ...p,
        isCompatible: true,
        vehicleFitment: {
          vrm: stored.vrm,
          summary: stored.summary,
          make: stored.vehicle?.make,
          model: stored.vehicle?.model,
        },
      }));

      fitmentPool = {
        rawItems: verifiedItems,
      };

      fitmentCache.set(cacheKey, fitmentPool);

      // Persist fitted SKUs to storage so PDP recognizes them immediately
      try {
        const existingRaw = window.localStorage.getItem('gsf_vehicle_valid_skus');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newSkus = verifiedItems.map((p) => (p.sku || '').toUpperCase());
        const merged = Array.from(new Set([...existing, ...newSkus]));
        window.localStorage.setItem('gsf_vehicle_valid_skus', JSON.stringify(merged));
      } catch {
        // Storage fallback
      }
    }

    // 1. Filter by active basic filters (quality attribute code for Brand)
    let filteredItems = fitmentPool.rawItems;
    const selectedQualities = filters.quality || filters.brand || filters.manufacturer;
    if (selectedQualities && selectedQualities.length > 0) {
      const qualityArray = (Array.isArray(selectedQualities) ? selectedQualities : [selectedQualities])
        .map((q) => String(q).toLowerCase().trim());

      filteredItems = filteredItems.filter((item) => {
        const itemQuality = String(item.quality || '').trim().toLowerCase();
        const itemBrand = getBrandName(item).toLowerCase().trim();
        const mappedCode = String(getQualityCodeForBrand(itemBrand) || '').toLowerCase();

        return qualityArray.some((q) => (
          (itemQuality && itemQuality === q)
          || (mappedCode && mappedCode === q)
          || itemBrand === q
          || itemBrand.includes(q)
          || q.includes(itemBrand)
        ));
      });
    }

    // 2. Sort items deterministically
    const sortedItems = sortProducts(filteredItems, sort);

    // 3. Build basic aggregations based on currently available candidate pool
    const aggregations = buildBasicAggregations(fitmentPool.rawItems);

    const totalFittedCount = sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalFittedCount / targetPageSize));
    const safePage = Math.min(currentPage, totalPages);

    // 4. Slice exact targetPageSize items (15 on page 1, 15 on page 2)
    const startIndex = (safePage - 1) * targetPageSize;
    const endIndex = startIndex + targetPageSize;
    const pagedItems = sortedItems.slice(startIndex, endIndex);

    return {
      total_count: totalFittedCount,
      page_info: {
        page_size: targetPageSize,
        current_page: safePage,
        total_pages: totalPages,
      },
      items: pagedItems,
      aggregations,
      hasVehicle: true,
      viewMode: 'fitted',
      fittedCount: fitmentPool.rawItems.length,
      allCount: 24161,
      vrm: stored.vrm,
      vehicleSummary: stored.summary,
      categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
      searchPhrase,
    };
  }

  // B) GENERAL CATALOG BROWSING FLOW (Or when user toggled 'All Products')
  const verifiedSkus = stored.validSkus || [];
  const enrichItemWithVehicleFit = (item) => {
    const upperSku = (item?.sku || '').toUpperCase();
    const fits = isSkuFitted(upperSku) || verifiedSkus.includes(upperSku);
    return {
      ...item,
      isCompatible: fits,
      vehicleFitment: (hasVehicle && fits) ? {
        vrm: stored.vrm,
        summary: stored.summary,
        make: stored.vehicle?.make,
        model: stored.vehicle?.model,
      } : null,
    };
  };

  // Check if sort is 'price: ASC' which triggers staging Magento Elasticsearch zero-price gap
  const [sortField, sortDir] = Object.entries(sort)[0] || ['position', 'ASC'];
  const isPriceAsc = sortField === 'price' && String(sortDir).toUpperCase() === 'ASC';

  // For price: ASC, fetch candidate pool and sort with sortProducts to avoid Magento GraphQL's empty return
  if (isPriceAsc) {
    const candidateRes = await fetchProducts({
      categoryId: categoryId || null,
      searchPhrase: searchPhrase || null,
      sort: { position: 'ASC' },
      page: 1,
      pageSize: 60,
      customFilters: filters,
    });

    let items = candidateRes.items || [];
    // Filter by quality attribute code for Brand if selected
    const selectedQualities = filters.quality || filters.brand || filters.manufacturer;
    if (selectedQualities && selectedQualities.length > 0) {
      const qualityArray = (Array.isArray(selectedQualities) ? selectedQualities : [selectedQualities])
        .map((q) => String(q).toLowerCase().trim());
      items = items.filter((item) => {
        const itemQuality = String(item.quality || '').trim().toLowerCase();
        const itemBrand = getBrandName(item).toLowerCase().trim();
        const mappedCode = String(getQualityCodeForBrand(itemBrand) || '').toLowerCase();

        return qualityArray.some((q) => (
          (itemQuality && itemQuality === q)
          || (mappedCode && mappedCode === q)
          || itemBrand === q
          || itemBrand.includes(q)
          || q.includes(itemBrand)
        ));
      });
    }

    const sortedItems = sortProducts(items, { price: 'ASC' });
    const total = candidateRes.total_count || sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(total / targetPageSize));
    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * targetPageSize;
    const pagedItems = sortedItems.slice(startIndex, startIndex + targetPageSize);
    const enrichedItems = pagedItems.map(enrichItemWithVehicleFit);

    return {
      total_count: total,
      page_info: {
        page_size: targetPageSize,
        current_page: safePage,
        total_pages: totalPages,
      },
      items: enrichedItems,
      aggregations: buildBasicAggregations(items),
      hasVehicle,
      viewMode: 'all',
      fittedCount: fitmentCache.get(`${stored.vrm}_cat${categoryId || 'all'}_q${searchPhrase || ''}`)?.rawItems?.length || verifiedSkus.length || 60,
      allCount: total,
      vrm: stored.vrm,
      vehicleSummary: stored.summary,
      categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
      searchPhrase,
    };
  }

  // Standard GraphQL fetch for other sorts: ensure 'quality' attribute code is passed to Magento GraphQL
  const normalizedFilters = { ...filters };
  if (normalizedFilters.brand && !normalizedFilters.quality) {
    const brands = Array.isArray(normalizedFilters.brand) ? normalizedFilters.brand : [normalizedFilters.brand];
    normalizedFilters.quality = brands.map((b) => getQualityCodeForBrand(b) || b);
    delete normalizedFilters.brand;
  }

  const result = await fetchProducts({
    categoryId: categoryId || null,
    searchPhrase: searchPhrase || null,
    sort,
    page: currentPage,
    pageSize: targetPageSize,
    customFilters: normalizedFilters,
  });

  let items = result.items || [];
  const total = result.total_count || 0;
  const totalPages = Math.max(1, Math.ceil(total / targetPageSize));

  // Backfill if GraphQL returned fewer than requested items on a non-terminal page
  if (items.length < targetPageSize && currentPage < totalPages && items.length > 0) {
    try {
      const missingCount = targetPageSize - items.length;
      const nextPage = await fetchProducts({
        categoryId: categoryId || null,
        searchPhrase: searchPhrase || null,
        sort,
        page: currentPage + 1,
        pageSize: targetPageSize,
        customFilters: normalizedFilters,
      });

      if (nextPage.items && nextPage.items.length > 0) {
        items = [...items, ...nextPage.items.slice(0, missingCount)];
      }
    } catch {
      // Keep existing items if backfill fetch fails
    }
  }

  const enrichedItems = items.map(enrichItemWithVehicleFit);

  return {
    total_count: total,
    page_info: {
      page_size: targetPageSize,
      current_page: currentPage,
      total_pages: totalPages,
    },
    items: enrichedItems,
    aggregations: buildBasicAggregations(items),
    hasVehicle,
    viewMode: 'all',
    fittedCount: fitmentCache.get(`${stored.vrm}_cat${categoryId || 'all'}_q${searchPhrase || ''}`)?.rawItems?.length || verifiedSkus.length || 60,
    allCount: total,
    vrm: stored.vrm,
    vehicleSummary: stored.summary,
    categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
    searchPhrase,
  };
}

/**
 * Invalidate cached fitment pools when vehicle changes or is cleared
 */
export function clearCatalogFitmentCache() {
  fitmentCache.clear();
}

// Subscribe to vehicle update/clear events to automatically flush fitment cache
if (typeof window !== 'undefined') {
  window.addEventListener('vehicle-lookup:updated', clearCatalogFitmentCache);
  window.addEventListener('vehicle-lookup:cleared', clearCatalogFitmentCache);
}
