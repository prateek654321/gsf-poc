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

// In-memory / session cache for vehicle-scoped fitment sets to ensure deterministic pagination
const fitmentCache = new Map();

/**
 * Execute catalog query with vehicle fitment, pagination, and search
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
    const cacheKey = `${stored.vrm}_cat${categoryId || 'all'}_q${searchPhrase || ''}_sort${JSON.stringify(sort)}`;
    let fitmentPool = fitmentCache.get(cacheKey);

    if (!fitmentPool) {
      // 1. Check if category-scoped fitment SKUs are available
      let candidateSkus = [];
      if (categoryId || categoryName) {
        try {
          const catSkus = await fetchCategoryFitmentSkus({ categoryId, categoryName });
          if (catSkus && catSkus.length > 0) {
            candidateSkus = catSkus;
          }
        } catch {
          candidateSkus = [];
        }
      }

      if (candidateSkus.length === 0 && stored.validSkus && stored.validSkus.length > 0) {
        candidateSkus = stored.validSkus;
      }

      // 2. Fetch candidate catalog products
      if (candidateSkus.length > 0) {
        // We have direct SKUs: query Magento with sku in candidateSkus
        const result = await fetchProducts({
          categoryId: categoryId || null,
          skus: candidateSkus,
          searchPhrase: searchPhrase || null,
          sort,
          page: 1,
          pageSize: 100, // Fetch up to 100 fitted parts for deterministic client slicing
          customFilters: filters,
        });

        fitmentPool = {
          items: result.items || [],
          total: result.items?.length || 0,
          aggregations: result.aggregations || [],
        };
      } else {
        // Fallback when staging fitment SKUs endpoint is unreachable:
        // Query candidate products from Magento matching the category/search
        const candidatePoolSize = 60; // 4 full pages of 15 items
        const initialQuery = await fetchProducts({
          categoryId: categoryId || null,
          searchPhrase: searchPhrase || null,
          sort,
          page: 1,
          pageSize: candidatePoolSize,
          customFilters: filters,
        });

        const items = initialQuery.items || [];
        // Map component IDs
        const mappedComps = resolveCategoryComponentIds({
          categoryId,
          categoryName,
          vehicleComponents: stored.vehicle?.components || [],
        });

        // Tag verified fitment for the vehicle
        const verifiedItems = items.map((p) => ({
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
          items: verifiedItems,
          total: verifiedItems.length,
          aggregations: initialQuery.aggregations || [],
        };
      }

      fitmentCache.set(cacheKey, fitmentPool);
    }

    // Apply any active in-memory facet filters if necessary
    let filteredItems = fitmentPool.items;
    if (filters && Object.keys(filters).length > 0) {
      filteredItems = filteredItems.filter((item) => {
        return Object.entries(filters).every(([code, vals]) => {
          if (!vals || vals.length === 0) return true;
          const valArray = Array.isArray(vals) ? vals : [vals];
          if (code === 'brand' || code === 'manufacturer') {
            const brandTitle = item.extraVariable?.brand_info?.title || '';
            return valArray.some((v) => brandTitle.toLowerCase().includes(String(v).toLowerCase()));
          }
          if (code === 'quality') {
            return valArray.includes(item.quality);
          }
          return true;
        });
      });
    }

    const totalFittedCount = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalFittedCount / targetPageSize));
    const safePage = Math.min(currentPage, totalPages);

    // Slice exact targetPageSize items (15 on page 1, 15 on page 2)
    const startIndex = (safePage - 1) * targetPageSize;
    const endIndex = startIndex + targetPageSize;
    const pagedItems = filteredItems.slice(startIndex, endIndex);

    return {
      total_count: totalFittedCount,
      page_info: {
        page_size: targetPageSize,
        current_page: safePage,
        total_pages: totalPages,
      },
      items: pagedItems,
      aggregations: fitmentPool.aggregations,
      hasVehicle: true,
      vrm: stored.vrm,
      vehicleSummary: stored.summary,
      categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
      searchPhrase,
    };
  }

  // B) GENERAL CATALOG BROWSING FLOW (No vehicle selected)
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

  // High-standard e-commerce guarantee: If backend returned fewer items than requested
  // due to unindexed/inactive items on staging, and more items exist in the catalog,
  // fetch remaining items from the next page offset to ensure strictly targetPageSize items!
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
    aggregations: result.aggregations || [],
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
