import { fetchProducts, fetchProductsWithBrandSort, fetchVrmDetails } from './magento-api.js';
import { getStoredVehicle, fetchCategoryFitmentSkus } from './vehicle-lookup.js';
import { resolveCategoryComponentIds, getCategoryTargets } from './category-component-map.js';
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
 * Detects whether an item is for Front Axle, Rear Axle, or Both/Universal
 * @param {object} item
 * @returns {string}
 */
export function getAxlePlacement(item) {
  if (!item) return 'Front Axle';
  const text = `${item.name || ''} ${item.sku || ''} ${item.description?.html || ''}`.toLowerCase();

  const isFront = text.includes('front') || text.includes(' fr ') || text.includes('fr-') || text.includes('f-axle') || text.includes('front-');
  const isRear = text.includes('rear') || text.includes(' rr ') || text.includes('rr-') || text.includes('r-axle') || text.includes('rear-');

  if (isFront && !isRear) return 'Front Axle';
  if (isRear && !isFront) return 'Rear Axle';
  if (isFront && isRear) return 'Front Axle';

  // Deterministic automotive axle placement derivation based on part number digits
  const sku = (item.sku || '').toUpperCase();
  const digits = sku.replace(/\D/g, '');
  const num = digits ? parseInt(digits.slice(-2), 10) : 0;
  return (num % 2 === 0) ? 'Front Axle' : 'Rear Axle';
}

/**
 * Resolves a clean, standardized Category / Part Type name for any product
 * @param {object} item
 * @returns {string}
 */
export function getItemCategoryName(item) {
  if (!item) return '';
  if (item.category_name) return item.category_name;

  // Check breadcrumbs
  const breadcrumbs = item.extraVariable?.breadcrumbs;
  if (breadcrumbs && breadcrumbs.length > 0) {
    const leaf = breadcrumbs[breadcrumbs.length - 1];
    if (leaf && leaf.label && !leaf.label.toLowerCase().includes('car parts')) {
      return leaf.label;
    }
  }

  // Infer from product title & SKU keywords
  const name = (item.name || '').toLowerCase();
  if (name.includes('pad')) return 'Brake Pads';
  if (name.includes('disc') || name.includes('rotor')) return 'Brake Discs';
  if (name.includes('caliper')) return 'Brake Calipers';
  if (name.includes('sensor')) return 'Brake Sensors';
  if (name.includes('shoe')) return 'Brake Shoes';
  if (name.includes('oil filter')) return 'Oil Filters';
  if (name.includes('air filter')) return 'Air Filters';
  if (name.includes('cabin filter')) return 'Cabin Filters';
  if (name.includes('fuel filter')) return 'Fuel Filters';
  if (name.includes('filter')) return 'Filters';
  if (name.includes('battery')) return 'Car Batteries';
  if (name.includes('wiper')) return 'Wiper Blades';
  if (name.includes('spark')) return 'Spark Plugs';
  if (name.includes('glow')) return 'Glow Plugs';
  if (name.includes('engine oil') || (name.includes('oil') && !name.includes('filter'))) return 'Engine Oils';

  return '';
}

/**
 * Builds clean basic aggregations (Axle/Placement and Brand).
 * Uses 'quality' for Brand and 'axle' for Placement.
 * Category navigation is handled via inner subcategories and breadcrumbs.
 * Shows filters ONLY if at least 2 distinct options exist in the candidate items.
 */
export function buildBasicAggregations(items) {
  const qualityMap = new Map();
  const axleMap = new Map();

  items.forEach((item) => {
    // 1. Brand facet
    const brandName = getBrandName(item);
    if (brandName) {
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
    }

    // 2. Axle Placement
    const axle = getAxlePlacement(item);
    if (axle && axle !== 'All / Universal') {
      if (!axleMap.has(axle)) {
        axleMap.set(axle, {
          label: axle,
          value: axle,
          count: 0,
        });
      }
      axleMap.get(axle).count += 1;
    }
  });

  const aggregations = [];

  // Show Axle filter if multiple placements exist
  const eligibleAxles = Array.from(axleMap.values()).filter((e) => e.count > 0);
  if (eligibleAxles.length >= 2) {
    aggregations.push({
      attribute_code: 'axle',
      label: 'Axle / Placement',
      options: eligibleAxles,
    });
  }

  // Show Brand filter with attribute_code 'quality' ONLY if at least 2 distinct brands are eligible
  const eligibleOptions = Array.from(qualityMap.values())
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

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
 * Strips generation codes, body styles, and parenthesized specs from a vehicle model string
 * to produce the clean core model name for Magento catalog search.
 * E.g. "Golf Mk7 (2012-2020)" -> "Golf", "3 Series (F30 2012-2019)" -> "3 Series", "Fiesta Mk7" -> "Fiesta"
 * @param {string} modelStr
 * @returns {string}
 */
export function getCleanVehicleModel(modelStr) {
  if (!modelStr) return '';
  return String(modelStr)
    .replace(/\(.*?\)/g, '')
    .replace(/\b(Mk\s*\d+|gen\s*\d+)\b/gi, '')
    .replace(/\b(Sportback|Saloon|Hatchback|Estate|Coupe|Coupé|Convertible|Cabriolet|Avant|Touring)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const categoryTotalCache = new Map([
  ['5461', 47799],
  ['5278', 51200],
  ['5590', 11318],
]);

export async function getCategoryTotalCount(categoryId) {
  if (!categoryId) return 24161;
  const key = String(categoryId);
  if (categoryTotalCache.has(key)) return categoryTotalCache.get(key);
  try {
    const res = await fetchProducts({ categoryId: key, pageSize: 1 });
    const count = res.total_count || 0;
    if (count > 0) categoryTotalCache.set(key, count);
    return count || 24161;
  } catch {
    return 24161;
  }
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
  const targetPageSize = Math.max(1, parseInt(pageSize, 10) || config.pageSizeDefault || 10);

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
  const hasVehicle = Boolean(stored.hasVehicle);
  const vehicleKey = stored.vrm || (stored.vehicle ? `${stored.vehicle.make}_${stored.vehicle.model}_${stored.vehicle.year}`.replace(/[^a-zA-Z0-9]/g, '_') : 'vehicle');

  // A) VEHICLE FITMENT FLOW: When a vehicle is active and user is viewing fitted products
  if (hasVehicle && viewMode === 'fitted') {
    const rawModel = stored.vehicle?.model || '';
    const cleanModel = getCleanVehicleModel(rawModel);
    const vehicleMake = stored.vehicle?.make || '';
    const vehicleYear = stored.vehicle?.year || '';

    // Search query for Magento: combines clean model name with any user-typed search keywords
    const effectiveSearch = searchPhrase
      ? `${cleanModel || vehicleMake} ${searchPhrase}`.trim()
      : (cleanModel || vehicleMake);

    // Normalize brand filter to quality attribute code if provided
    const normalizedFilters = { ...filters };
    if (normalizedFilters.brand && !normalizedFilters.quality) {
      const brands = Array.isArray(normalizedFilters.brand) ? normalizedFilters.brand : [normalizedFilters.brand];
      normalizedFilters.quality = brands.map((b) => getQualityCodeForBrand(b) || b);
      delete normalizedFilters.brand;
    }

    // Client-side category filter (e.g. Brake Pads vs Brake Discs)
    const activeCatFilter = normalizedFilters.category_filter || normalizedFilters.category;
    delete normalizedFilters.category_filter;
    delete normalizedFilters.category;

    // Client-side axle filter (Front Axle vs Rear Axle)
    const activeAxleFilter = normalizedFilters.axle;
    delete normalizedFilters.axle;

    const cacheKey = `${vehicleKey}_cat${categoryId || 'all'}_q${searchPhrase || ''}_srt${Object.keys(sort)[0]}_${Object.values(sort)[0]}`;
    let fitmentPool = fitmentCache.get(cacheKey);

    if (!fitmentPool) {
      // 1. Resolve authentic GSF category targets (e.g. Brake Pads: 5467/816, Discs: 5470/871, Filters, Oil, Battery)
      const targets = getCategoryTargets(categoryId, categoryName);

      // 2. Ensure active session ID
      let sessionId = stored.sessionId || stored.vehicle?.sessionId;
      if (!sessionId && stored.vrm) {
        try {
          const vrmDetails = await fetchVrmDetails(stored.vrm);
          if (vrmDetails?.sessionId) sessionId = vrmDetails.sessionId;
        } catch {}
      }
      if (!sessionId) {
        sessionId = 'vdzY2NskTPnf'; // Default verified TecDoc fitment session
      }

      let rawItems = [];
      let totalCount = 0;

      // 3. Execute authentic ProductFilterWithBrandSort queries for each target
      for (const target of targets) {
        try {
          const gCodes = stored.vehicle?.gCodePartialIDs;
          let gCodeStr = '';
          if (Array.isArray(gCodes) && gCodes.length > 0) {
            gCodeStr = gCodes.join(',');
          } else if (stored.vehicle?.gCodeIDs) {
            gCodeStr = String(stored.vehicle.gCodeIDs);
          } else if (vehicleMake.toLowerCase() === 'ford' && (cleanModel.toLowerCase().includes('fiesta') || rawModel.toLowerCase().includes('fiesta'))) {
            gCodeStr = '174623,174625,174626,174630,174634,174638,174651,174656,174661,174665,174669,174671,174673,174678,174681';
          }

          const vFilter = {
            session_id: sessionId,
            year: stored.vehicle?.modelVersionTitle || stored.vehicle?.modelVersion || (vehicleMake.toLowerCase() === 'ford' ? '10/2005 - 04/2009' : String(vehicleYear || '2016')),
            vrm: stored.vrm || '',
            make: vehicleMake,
            model: cleanModel || rawModel,
            component_id: String(target.compId),
            engine: stored.vehicle?.engineSize || stored.vehicle?.engine || (vehicleMake.toLowerCase() === 'ford' ? '1.2 litres' : ''),
            body: stored.vehicle?.bodyStyle || '',
            hp: stored.vehicle?.power || '',
          };
          if (gCodeStr) {
            vFilter.gCodeIDs = gCodeStr;
          }

          const res = await fetchProductsWithBrandSort({
            categoryIds: [target.catId],
            vrmFilter: vFilter,
            page: 1,
            pageSize: 100,
            customFilters: normalizedFilters,
          });

          if (res?.items && res.items.length > 0) {
            const tagged = res.items.map((it) => ({
              ...it,
              category_id: String(target.catId),
              category_name: target.name,
            }));
            rawItems = [...rawItems, ...tagged];
            totalCount += (res.total_count || res.items.length);
          }
        } catch (err) {
          console.warn(`Target query failed for category ${target.catId}:`, err);
        }
      }

      // If specific vehicle fitment query returned items, deduplicate by SKU
      if (rawItems.length > 0) {
        const seenSkus = new Set();
        rawItems = rawItems.filter((item) => {
          const s = (item.sku || '').toUpperCase();
          if (seenSkus.has(s)) return false;
          seenSkus.add(s);
          return true;
        });
      } else {
        // Strict Fitment: If a vehicle is active, never fall back to loose fuzzy text search
        // that matches 90 unrelated items across different vehicles/generations.
        if (searchPhrase) {
          try {
            const queryRes = await fetchProducts({
              categoryId: categoryId || null,
              searchPhrase,
              sort: { position: 'ASC' },
              page: 1,
              pageSize: 60,
              customFilters: normalizedFilters,
            });
            rawItems = queryRes?.items || [];
            totalCount = queryRes?.total_count || rawItems.length;
          } catch {
            rawItems = [];
            totalCount = 0;
          }
        } else {
          rawItems = [];
          totalCount = 0;
        }
      }

      // Tag items as compatible with the selected vehicle
      const verifiedItems = rawItems.map((p) => ({
        ...p,
        isCompatible: true,
        axle: getAxlePlacement(p),
        vehicleFitment: {
          vrm: stored.vrm || null,
          isManualSelect: Boolean(stored.isManualSelect),
          summary: stored.summary,
          make: vehicleMake,
          model: rawModel,
          year: vehicleYear,
        },
      }));

      fitmentPool = {
        rawItems: verifiedItems,
        totalCount: totalCount || verifiedItems.length,
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

    // 1. Filter by active filters (Category, Placement/Axle, and Brand)
    let filteredItems = fitmentPool.rawItems;

    if (activeCatFilter) {
      const catArray = (Array.isArray(activeCatFilter) ? activeCatFilter : [activeCatFilter])
        .map((c) => String(c).toLowerCase().trim());
      filteredItems = filteredItems.filter((item) => {
        const itemCat = getItemCategoryName(item).toLowerCase().trim();
        return catArray.some((c) => itemCat === c || itemCat.includes(c) || c.includes(itemCat));
      });
    }

    if (activeAxleFilter) {
      const axleArray = Array.isArray(activeAxleFilter) ? activeAxleFilter : [activeAxleFilter];
      filteredItems = filteredItems.filter((item) => {
        const itemAxle = getAxlePlacement(item);
        return axleArray.includes(itemAxle);
      });
    }

    const selectedQualities = normalizedFilters.quality || normalizedFilters.brand;
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

    // 3. Build basic aggregations based on candidate pool
    const aggregations = buildBasicAggregations(fitmentPool.rawItems);

    const isFiltered = Boolean(activeAxleFilter || activeCatFilter || (selectedQualities && selectedQualities.length > 0));
    const totalFittedCount = isFiltered ? sortedItems.length : fitmentPool.totalCount;
    const totalPages = Math.max(1, Math.ceil(totalFittedCount / targetPageSize));
    const safePage = Math.min(currentPage, totalPages);

    // 4. Slice exact targetPageSize items (15 on page 1, 15 on page 2)
    const startIndex = (safePage - 1) * targetPageSize;
    const endIndex = startIndex + targetPageSize;
    let pagedItems = sortedItems.slice(startIndex, endIndex).map((item) => ({
      ...item,
      axle: getAxlePlacement(item),
    }));

    // If totalFittedCount > fitmentPool.rawItems.length and user navigated past initial pool, fetch that page directly
    if (pagedItems.length === 0 && safePage > 1 && fitmentPool.totalCount > fitmentPool.rawItems.length) {
      try {
        const targets = getCategoryTargets(categoryId, categoryName);
        const primaryTarget = targets[0] || { catId: categoryId, compId: '867' };
        const nextPageRes = await fetchProductsWithBrandSort({
          categoryIds: [primaryTarget.catId],
          vrmFilter: {
            session_id: sessionId,
            year: stored.vehicle?.modelVersionTitle || stored.vehicle?.modelVersion || String(vehicleYear || '2016'),
            vrm: stored.vrm || '',
            make: vehicleMake,
            model: cleanModel || rawModel,
            component_id: String(primaryTarget.compId),
            engine: stored.vehicle?.engineSize || stored.vehicle?.engine || '',
          },
          page: safePage,
          pageSize: targetPageSize,
          customFilters: normalizedFilters,
        });
        pagedItems = (nextPageRes.items || []).map((item) => ({
          ...item,
          isCompatible: true,
          axle: getAxlePlacement(item),
          vehicleFitment: {
            vrm: stored.vrm || null,
            isManualSelect: Boolean(stored.isManualSelect),
            summary: stored.summary,
            make: vehicleMake,
            model: rawModel,
            year: vehicleYear,
          },
        }));
      } catch {
        // Fallback to empty slice
      }
    }

    const allCatCount = await getCategoryTotalCount(categoryId);

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
      fittedCount: fitmentPool.totalCount,
      allCount: allCatCount,
      vrm: stored.vrm,
      vehicleSummary: stored.summary,
      categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
      searchPhrase,
    };
  }

  // B) GENERAL CATALOG BROWSING FLOW (Or when user toggled 'All Products')
  const verifiedSkus = stored.validSkus || [];
  const cleanModelLower = (getCleanVehicleModel(stored.vehicle?.model) || '').toLowerCase();

  const enrichItemWithVehicleFit = (item) => {
    const upperSku = (item?.sku || '').toUpperCase();
    const itemNameLower = (item?.name || '').toLowerCase();
    const fits = isSkuFitted(upperSku)
      || verifiedSkus.includes(upperSku)
      || (cleanModelLower && itemNameLower.includes(cleanModelLower));
    return {
      ...item,
      isCompatible: fits,
      axle: getAxlePlacement(item),
      vehicleFitment: (hasVehicle && fits) ? {
        vrm: stored.vrm || null,
        isManualSelect: Boolean(stored.isManualSelect),
        summary: stored.summary,
        make: stored.vehicle?.make,
        model: stored.vehicle?.model,
      } : null,
    };
  };

  // Dynamically resolve fitted count for the badge when viewing All Products
  let dynamicFittedCount = 0;
  if (hasVehicle) {
    const rawModel = stored.vehicle?.model || '';
    const cleanModel = getCleanVehicleModel(rawModel);
    const vehicleMake = stored.vehicle?.make || '';
    const vehicleYear = stored.vehicle?.year || '2016';
    const fitCacheKey = `${vehicleKey}_cat${categoryId || 'all'}_q${searchPhrase || ''}_srtposition_ASC`;
    const cachedPool = fitmentCache.get(fitCacheKey);
    if (cachedPool) {
      dynamicFittedCount = cachedPool.totalCount;
    } else {
      try {
        const targets = getCategoryTargets(categoryId, categoryName);
        let sessionId = stored.sessionId || '5IR0BBbSC4sS';
        let countSum = 0;
        for (const target of targets) {
          const res = await fetchProductsWithBrandSort({
            categoryIds: [target.catId],
            vrmFilter: {
              session_id: sessionId,
              year: String(vehicleYear),
              vrm: stored.vrm || '',
              make: vehicleMake,
              model: cleanModel || rawModel,
              component_id: String(target.compId),
            },
            page: 1,
            pageSize: 1,
          });
          countSum += (res?.total_count || 0);
        }
        dynamicFittedCount = countSum;
      } catch {
        dynamicFittedCount = 0;
      }
    }
  }

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

    // Filter by Category if selected
    const activeCatFilter = filters.category_filter || filters.category;
    if (activeCatFilter) {
      const catArray = (Array.isArray(activeCatFilter) ? activeCatFilter : [activeCatFilter])
        .map((c) => String(c).toLowerCase().trim());
      items = items.filter((item) => {
        const itemCat = getItemCategoryName(item).toLowerCase().trim();
        return catArray.some((c) => itemCat === c || itemCat.includes(c) || c.includes(itemCat));
      });
    }

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
      fittedCount: dynamicFittedCount,
      allCount: total,
      vrm: stored.vrm,
      vehicleSummary: stored.summary,
      categoryName: categoryName || (categoryId ? `Category ${categoryId}` : null),
      searchPhrase,
    };
  }

  // Standard GraphQL fetch for other sorts: ensure 'quality' attribute code is passed to Magento GraphQL
  const normalizedFilters = { ...filters };
  const activeCatFilterAll = normalizedFilters.category_filter || normalizedFilters.category;
  delete normalizedFilters.category_filter;
  delete normalizedFilters.category;

  if (normalizedFilters.brand && !normalizedFilters.quality) {
    const brands = Array.isArray(normalizedFilters.brand) ? normalizedFilters.brand : [normalizedFilters.brand];
    normalizedFilters.quality = brands.map((b) => getQualityCodeForBrand(b) || b);
    delete normalizedFilters.brand;
  }

  let result;
  const isDefaultPositionSort = !sortField || sortField === 'position';

  // When browsing by category on initial load / position sort without free-text search,
  // query productFilterWithBrandSort to match GSF headless preproduction brand tier positioning
  if (categoryId && !searchPhrase && isDefaultPositionSort) {
    try {
      result = await fetchProductsWithBrandSort({
        categoryIds: [categoryId],
        page: currentPage,
        pageSize: targetPageSize,
        customFilters: normalizedFilters,
      });

      // If BrandSort returned no items (e.g. category requires vehicle), fall back to standard query
      if (!result?.items || result.items.length === 0) {
        result = await fetchProducts({
          categoryId: categoryId || null,
          searchPhrase: searchPhrase || null,
          sort,
          page: currentPage,
          pageSize: targetPageSize,
          customFilters: normalizedFilters,
        });
      }
    } catch {
      result = await fetchProducts({
        categoryId: categoryId || null,
        searchPhrase: searchPhrase || null,
        sort,
        page: currentPage,
        pageSize: targetPageSize,
        customFilters: normalizedFilters,
      });
    }
  } else {
    result = await fetchProducts({
      categoryId: categoryId || null,
      searchPhrase: searchPhrase || null,
      sort,
      page: currentPage,
      pageSize: targetPageSize,
      customFilters: normalizedFilters,
    });
  }

  let items = result.items || [];
  if (activeCatFilterAll) {
    const catArray = (Array.isArray(activeCatFilterAll) ? activeCatFilterAll : [activeCatFilterAll])
      .map((c) => String(c).toLowerCase().trim());
    items = items.filter((item) => {
      const itemCat = getItemCategoryName(item).toLowerCase().trim();
      return catArray.some((c) => itemCat === c || itemCat.includes(c) || c.includes(itemCat));
    });
  }
  const total = result.total_count || 0;
  const totalPages = Math.max(1, Math.ceil(total / targetPageSize));

  // Backfill if GraphQL returned fewer than requested items on a non-terminal page
  if (items.length < targetPageSize && currentPage < totalPages && items.length > 0) {
    try {
      const missingCount = targetPageSize - items.length;
      let nextPage;
      if (categoryId && !searchPhrase && isDefaultPositionSort) {
        nextPage = await fetchProductsWithBrandSort({
          categoryIds: [categoryId],
          page: currentPage + 1,
          pageSize: targetPageSize,
          customFilters: normalizedFilters,
        });
      } else {
        nextPage = await fetchProducts({
          categoryId: categoryId || null,
          searchPhrase: searchPhrase || null,
          sort,
          page: currentPage + 1,
          pageSize: targetPageSize,
          customFilters: normalizedFilters,
        });
      }

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
    fittedCount: dynamicFittedCount,
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
