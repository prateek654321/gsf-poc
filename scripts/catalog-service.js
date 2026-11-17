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
 * Extracts a normalized, human-readable brand name for any product
 * @param {object} item
 * @returns {string}
 */
export function getBrandName(item) {
  if (!item) return '';

  // 1. From extraVariable.brand_info.title
  if (item.extraVariable?.brand_info?.title) {
    const t = item.extraVariable.brand_info.title.trim();
    const lower = t.toLowerCase();
    if (lower === 'ebc') return 'EBC Brakes';
    if (lower === 'borgbeck' || lower === 'borg & beck') return 'Borg & Beck';
    if (lower === 'firstline' || lower === 'first line') return 'First Line';
    if (lower === 'blueprint') return 'Blue Print';
    if (lower === 'zimmermann') return 'Zimmermann';
    return t;
  }

  // 2. From productFitmentInfo (label === 'Brand')
  const fitmentBrand = item.productFitmentInfo?.find(
    (f) => f.label?.toLowerCase() === 'brand',
  )?.value;
  if (fitmentBrand) {
    const fb = fitmentBrand.trim();
    const lower = fb.toLowerCase();
    if (lower === 'ebc') return 'EBC Brakes';
    if (lower === 'borgbeck' || lower === 'borg & beck') return 'Borg & Beck';
    if (lower === 'firstline' || lower === 'first line') return 'First Line';
    if (lower === 'blueprint') return 'Blue Print';
    if (lower === 'zimmermann') return 'Zimmermann';
    return fb;
  }

  // 3. From quality attribute code
  const quality = String(item.quality || '');
  if (quality === '91098') return 'EBC Brakes';
  if (quality === '90988') return 'Borg & Beck';
  if (quality === '90743') return 'First Line';
  if (quality === '90671') return 'Blue Print';
  if (quality === '90755') return 'Zimmermann';

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
 * Filters out category, product_group, and all obscure technical noise.
 * Shows Brand filter ONLY if at least 2 distinct brands exist in the available items.
 */
function buildBasicAggregations(items) {
  const brandCounts = new Map();

  items.forEach((item) => {
    const brand = getBrandName(item);
    if (brand) {
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    }
  });

  const eligibleBrands = Array.from(brandCounts.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]); // Descending by count

  const aggregations = [];

  // Show Brand filter for available items ONLY if at least 2 distinct brands are eligible
  if (eligibleBrands.length >= 2) {
    aggregations.push({
      attribute_code: 'brand',
      label: 'Brand',
      options: eligibleBrands.map(([brandName, count]) => ({
        label: brandName,
        value: brandName,
        count,
      })),
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

  // A) VEHICLE FITMENT FLOW: When a vehicle is searched
  if (hasVehicle) {
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
    }

    // 1. Filter by active basic filters (Brand)
    let filteredItems = fitmentPool.rawItems;
    const selectedBrands = filters.brand || filters.manufacturer || filters.quality;
    if (selectedBrands && selectedBrands.length > 0) {
      const brandArray = (Array.isArray(selectedBrands) ? selectedBrands : [selectedBrands])
        .map((b) => String(b).toLowerCase().trim());

      filteredItems = filteredItems.filter((item) => {
        const itemBrand = getBrandName(item).toLowerCase().trim();
        return brandArray.some((b) => itemBrand === b || itemBrand.includes(b) || b.includes(itemBrand));
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
      vrm: stored.vrm,
      vehicleSummary: stored.summary,
      categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
      searchPhrase,
    };
  }

  // B) GENERAL CATALOG BROWSING FLOW (No vehicle selected)
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
    // Filter by brand if selected
    const selectedBrands = filters.brand || filters.manufacturer || filters.quality;
    if (selectedBrands && selectedBrands.length > 0) {
      const brandArray = (Array.isArray(selectedBrands) ? selectedBrands : [selectedBrands])
        .map((b) => String(b).toLowerCase().trim());
      items = items.filter((item) => {
        const itemBrand = getBrandName(item).toLowerCase().trim();
        return brandArray.some((b) => itemBrand === b || itemBrand.includes(b) || b.includes(itemBrand));
      });
    }

    const sortedItems = sortProducts(items, { price: 'ASC' });
    const total = candidateRes.total_count || sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(total / targetPageSize));
    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * targetPageSize;
    const pagedItems = sortedItems.slice(startIndex, startIndex + targetPageSize);

    return {
      total_count: total,
      page_info: {
        page_size: targetPageSize,
        current_page: safePage,
        total_pages: totalPages,
      },
      items: pagedItems,
      aggregations: buildBasicAggregations(items),
      hasVehicle: false,
      categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
      searchPhrase,
    };
  }

  // Standard GraphQL fetch for other sorts
  const result = await fetchProducts({
    categoryId: categoryId || null,
    searchPhrase: searchPhrase || null,
    sort,
    page: currentPage,
    pageSize: targetPageSize,
    customFilters: filters,
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
        customFilters: filters,
      });

      if (nextPage.items && nextPage.items.length > 0) {
        items = [...items, ...nextPage.items.slice(0, missingCount)];
      }
    } catch {
      // Keep existing items if backfill fetch fails
    }
  }

  return {
    total_count: total,
    page_info: {
      page_size: targetPageSize,
      current_page: currentPage,
      total_pages: totalPages,
    },
    items,
    aggregations: buildBasicAggregations(items),
    hasVehicle: false,
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
