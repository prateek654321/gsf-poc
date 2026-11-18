import {
  fetchVrmDetails,
  fetchFitmentSkus,
  checkProductCompatibility,
} from './magento-api.js';
import { resolveCategoryComponentIds } from './category-component-map.js';

export const STORAGE_KEYS = {
  VRM: 'gsf_vehicle_vrm',
  SESSION_ID: 'gsf_vehicle_session_id',
  COMPONENT_IDS: 'gsf_vehicle_component_ids',
  COMPONENT_ID: 'gsf_component_id',
  VEHICLE_DATA: 'gsf_vehicle_data',
  VALID_SKUS: 'gsf_vehicle_valid_skus',
  VEHICLE_SUMMARY: 'gsf_vehicle_summary',
  GARAGE_VEHICLES: 'gsf_garage_vehicles',
};

const DEMO_GARAGE_SEEDS = [
  {
    vrm: 'AK18WEX',
    summary: 'BMW • 3 Series • 2.0L • Diesel • 2018',
    vehicle: {
      make: 'BMW',
      model: '3 Series',
      description: 'BMW 320d M Sport Saloon',
      fuel: 'Diesel',
      engineSize: '2.0L',
      year: '2018',
      colour: 'Blue',
      bodyStyle: 'Saloon',
    },
    sessionId: 'demo-session-ak18wex',
    componentIds: ['814', '816', '817', '871', '872', '902', '927'],
    validSkus: ['EBCP2DK045RP1', 'EBCP2DK036RP1', 'BABBKB6027'],
  },
  {
    vrm: 'GV57KCE',
    summary: 'Ford • Fiesta • 1.2L • Petrol • 2007',
    vehicle: {
      make: 'Ford',
      model: 'Fiesta',
      description: 'Ford Fiesta Zetec Climate 1.25 Hatchback',
      fuel: 'Petrol',
      engineSize: '1.2L',
      year: '2007',
      colour: 'Silver',
      bodyStyle: 'Hatchback',
    },
    sessionId: 'demo-session-gv57kce',
    componentIds: ['814', '816', '871'],
    validSkus: [],
  },
];

export const COOKIE_NAMES = {
  REG_NO: 'gsf_reg_no',
  SESSION_ID: 'gsf_session_id',
  VEHICLE_SUMMARY: 'gsf_vehicle_summary',
};

const COOKIE_DAYS = 30;

function setCookie(name, value, days = COOKIE_DAYS) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function normalizeVrm(value) {
  return (value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function formatVehicleSummary(vehicle) {
  if (!vehicle) return '';
  let engineDisplay = null;
  if (vehicle.engineSize) {
    const raw = String(vehicle.engineSize).trim();
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) {
      engineDisplay = num > 50 ? `${(num / 1000).toFixed(1)}L` : `${num.toFixed(1)}L`;
    } else {
      engineDisplay = raw;
    }
  }

  return [
    vehicle.make,
    vehicle.model,
    engineDisplay,
    vehicle.fuel,
    vehicle.year,
  ].filter(Boolean).join(' • ');
}

export function getStoredVehicle() {
  let vehicle = null;
  let validSkus = [];
  let componentIds = [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.VEHICLE_DATA);
    vehicle = raw ? JSON.parse(raw) : null;
  } catch {
    vehicle = null;
  }

  try {
    const rawSkus = window.localStorage.getItem(STORAGE_KEYS.VALID_SKUS);
    validSkus = rawSkus ? JSON.parse(rawSkus) : [];
  } catch {
    validSkus = [];
  }

  try {
    const rawComp = window.localStorage.getItem(STORAGE_KEYS.COMPONENT_IDS);
    componentIds = rawComp ? JSON.parse(rawComp) : [];
  } catch {
    componentIds = [];
  }

  const vrm = getCookie(COOKIE_NAMES.REG_NO) || window.localStorage.getItem(STORAGE_KEYS.VRM);
  const sessionId = getCookie(COOKIE_NAMES.SESSION_ID) || window.localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  const summary = getCookie(COOKIE_NAMES.VEHICLE_SUMMARY)
    || window.localStorage.getItem(STORAGE_KEYS.VEHICLE_SUMMARY)
    || formatVehicleSummary(vehicle);

  return {
    vrm,
    sessionId,
    summary,
    vehicle,
    componentIds,
    componentId: window.localStorage.getItem(STORAGE_KEYS.COMPONENT_ID) || componentIds[0] || '',
    validSkus,
    hasVehicle: Boolean(vrm && sessionId),
  };
}

export function getGarageVehicles() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.GARAGE_VEHICLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return DEMO_GARAGE_SEEDS;
}

export function saveGarageVehicles(vehicles) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.GARAGE_VEHICLES, JSON.stringify(vehicles || []));
  } catch {
    // Storage fallback
  }
  window.dispatchEvent(new CustomEvent('garage:updated', { detail: { vehicles } }));
}

export function addToGarage(entry) {
  if (!entry || !entry.vrm) return getGarageVehicles();
  const vehicles = [...getGarageVehicles()];
  const normVrm = normalizeVrm(entry.vrm);
  const existingIdx = vehicles.findIndex((v) => normalizeVrm(v.vrm) === normVrm);

  const cleanEntry = {
    vrm: normVrm,
    summary: entry.summary || formatVehicleSummary(entry.vehicle),
    vehicle: entry.vehicle || null,
    sessionId: entry.sessionId || '',
    componentIds: entry.componentIds || [],
    componentId: entry.componentId || entry.componentIds?.[0] || '',
    validSkus: entry.validSkus || [],
    updatedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    vehicles[existingIdx] = { ...vehicles[existingIdx], ...cleanEntry };
  } else {
    vehicles.unshift(cleanEntry);
  }

  const trimmed = vehicles.slice(0, 6);
  saveGarageVehicles(trimmed);
  return trimmed;
}

export function selectGarageVehicle(vrm) {
  const normVrm = normalizeVrm(vrm);
  const vehicles = getGarageVehicles();
  const target = vehicles.find((v) => normalizeVrm(v.vrm) === normVrm);
  if (!target) return null;

  saveVehicleState(
    target.vrm,
    target.sessionId,
    target.componentIds,
    target.vehicle,
    target.validSkus,
  );

  window.dispatchEvent(new CustomEvent('vehicle-lookup:updated', { detail: target }));
  return target;
}

export function removeFromGarage(vrm) {
  const normVrm = normalizeVrm(vrm);
  let vehicles = getGarageVehicles();
  vehicles = vehicles.filter((v) => normalizeVrm(v.vrm) !== normVrm);
  saveGarageVehicles(vehicles);

  const activeStored = getStoredVehicle();
  if (normalizeVrm(activeStored.vrm) === normVrm) {
    if (vehicles.length > 0) {
      selectGarageVehicle(vehicles[0].vrm);
    } else {
      clearVehicleState();
    }
  }
}

export function saveVehicleState(vrm, sessionId, componentIds, vehicleData, validSkus = []) {
  const summary = formatVehicleSummary(vehicleData);

  if (vrm) setCookie(COOKIE_NAMES.REG_NO, vrm);
  if (sessionId) setCookie(COOKIE_NAMES.SESSION_ID, sessionId);
  if (summary) setCookie(COOKIE_NAMES.VEHICLE_SUMMARY, summary);

  const storedVehicle = { ...vehicleData, summary };

  window.localStorage.setItem(STORAGE_KEYS.VRM, vrm);
  window.localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId || '');
  window.localStorage.setItem(STORAGE_KEYS.COMPONENT_IDS, JSON.stringify(componentIds || []));
  window.localStorage.setItem(STORAGE_KEYS.COMPONENT_ID, componentIds?.[0] || '');
  window.localStorage.setItem(STORAGE_KEYS.VEHICLE_DATA, JSON.stringify(storedVehicle));
  window.localStorage.setItem(STORAGE_KEYS.VEHICLE_SUMMARY, summary);
  window.localStorage.setItem(STORAGE_KEYS.VALID_SKUS, JSON.stringify(validSkus || []));

  // Auto-record into My Garage
  addToGarage({
    vrm,
    sessionId,
    componentIds,
    vehicle: storedVehicle,
    summary,
    validSkus,
  });
}

export function clearVehicleState() {
  setCookie(COOKIE_NAMES.REG_NO, '', -1);
  setCookie(COOKIE_NAMES.SESSION_ID, '', -1);
  setCookie(COOKIE_NAMES.VEHICLE_SUMMARY, '', -1);

  Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));

  window.dispatchEvent(new CustomEvent('vehicle-lookup:cleared'));
}

/**
 * Execute full VRM lookup + Fitment SKUs retrieval
 * Dynamically maps category to component IDs if categoryId or categoryName is provided
 */
export async function lookupVrmAndFetchSkus(vrmInput, categoryId = '', categoryName = '') {
  const vrm = normalizeVrm(vrmInput);
  if (!vrm || vrm.length < 2 || vrm.length > 8) {
    throw new Error('Please enter a valid UK registration number.');
  }

  // 1. Fetch VRM Details
  const details = await fetchVrmDetails(vrm);

  // 2. Resolve mapped component IDs for the category
  let validSkus = [];
  try {
    if (details.sessionId && details.componentIds.length > 0) {
      let targetComponentIds = details.componentIds;
      if (categoryId || categoryName) {
        const mapped = resolveCategoryComponentIds({
          categoryId,
          categoryName,
          vehicleComponents: details.components || [],
        });
        if (mapped.length > 0) {
          targetComponentIds = mapped;
        }
      }

      validSkus = await fetchFitmentSkus({
        sessionId: details.sessionId,
        componentIds: targetComponentIds,
        vrm: details.vrm,
        categoryId,
      });
    }
  } catch (err) {
    console.warn('Could not fetch fitment SKUs:', err);
    validSkus = [];
  }

  // If validSkus is empty due to staging REST endpoint failure, retain cached valid SKUs if existing
  if (validSkus.length === 0) {
    try {
      const existingRaw = window.localStorage.getItem(STORAGE_KEYS.VALID_SKUS);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      if (existing.length > 0) {
        validSkus = existing;
      }
    } catch {
      // Storage fallback
    }
  }

  // 3. Save to storage
  saveVehicleState(details.vrm, details.sessionId, details.componentIds, details.vehicle, validSkus);

  const result = {
    ...details,
    summary: formatVehicleSummary(details.vehicle),
    validSkus,
  };

  // 4. Notify app
  window.dispatchEvent(new CustomEvent('vehicle-lookup:updated', { detail: result }));
  return result;
}

/**
 * Fetches fitment SKUs specifically scoped to the active category based on component IDs
 */
export async function fetchCategoryFitmentSkus({ categoryId = '', categoryName = '' } = {}) {
  const stored = getStoredVehicle();
  if (!stored.hasVehicle || !stored.sessionId) return [];

  const vehicleComps = stored.vehicle?.components || [];
  const mappedComponentIds = resolveCategoryComponentIds({
    categoryId,
    categoryName,
    vehicleComponents: vehicleComps,
  });

  const componentIdsToUse = mappedComponentIds.length > 0
    ? mappedComponentIds
    : stored.componentIds;

  try {
    const skus = await fetchFitmentSkus({
      sessionId: stored.sessionId,
      componentIds: componentIdsToUse,
      vrm: stored.vrm,
      categoryId,
    });
    return skus || [];
  } catch (err) {
    console.warn(`Could not fetch fitment SKUs for category ${categoryId}:`, err);
    return [];
  }
}

/**
 * Check whether a product SKU fits the currently active vehicle
 */
export async function checkCurrentVehicleFitment(sku, categoryId = '') {
  const stored = getStoredVehicle();
  if (!stored.hasVehicle) {
    return { hasVehicle: false, isCompatible: null };
  }

  const cleanSku = (sku || '').trim().toUpperCase();

  // 1. Check in cached valid SKUs first
  if (stored.validSkus && stored.validSkus.length > 0) {
    const isFitted = stored.validSkus.some((s) => s.toUpperCase() === cleanSku);
    if (isFitted) {
      return {
        hasVehicle: true,
        vehicle: stored.vehicle,
        summary: stored.summary,
        vrm: stored.vrm,
        isCompatible: true,
      };
    }
  }

  // 2. If validSkus is empty or not found, try fetching category fitment SKUs if categoryId provided
  if ((!stored.validSkus || stored.validSkus.length === 0) && categoryId) {
    try {
      const skus = await fetchCategoryFitmentSkus({ categoryId });
      if (skus && skus.length > 0) {
        const upperSkus = skus.map((s) => s.toUpperCase());
        const merged = Array.from(new Set([...(stored.validSkus || []), ...upperSkus]));
        window.localStorage.setItem(STORAGE_KEYS.VALID_SKUS, JSON.stringify(merged));
        stored.validSkus = merged;
        if (merged.includes(cleanSku)) {
          return {
            hasVehicle: true,
            vehicle: stored.vehicle,
            summary: stored.summary,
            vrm: stored.vrm,
            isCompatible: true,
          };
        }
      }
    } catch {
      // Ignore
    }
  }

  // 3. Fallback to single-sku API check
  try {
    const res = await checkProductCompatibility({
      sku: cleanSku,
      sessionId: stored.sessionId,
      componentId: stored.componentId,
      categoryId,
    });
    if (res && res.isCompatible !== undefined) {
      return {
        hasVehicle: true,
        vehicle: stored.vehicle,
        summary: stored.summary,
        vrm: stored.vrm,
        isCompatible: res.isCompatible,
        recommendedSku: res.recommendedSku,
      };
    }
  } catch {
    // API failure
  }

  return {
    hasVehicle: true,
    vehicle: stored.vehicle,
    summary: stored.summary,
    vrm: stored.vrm,
    isCompatible: false,
  };
}


/**
 * Format a UK registration string for visual display with space (e.g. "WP15 VKY")
 */
export function formatPlateDisplay(val) {
  const clean = (val || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length > 4) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)}`;
  }
  return clean;
}

/**
 * Initializes a vehicle registration lookup form inside a container.
 */
export async function initVehicleLookup(container, { inputId = 'vehicle-search-vrm-input', classPrefix = 'vehicle-search' } = {}) {
  const stored = getStoredVehicle();
  const initialDisplay = stored.vrm ? formatPlateDisplay(stored.vrm) : '';

  container.innerHTML = `
    <form class="${classPrefix}-form" novalidate>
      <div class="${classPrefix}-fieldset">
        <div class="uk-plate ${classPrefix}-plate-box">
          <div class="uk-plate-gb">GB</div>
          <input id="${inputId}" name="vrm" autocomplete="off" spellcheck="false"
            placeholder="ENTER REG"
            maxlength="9"
            class="${classPrefix}-input uk-plate-text"
            value="${initialDisplay}" />
        </div>
        <button type="submit" class="${classPrefix}-button button button-accent">
          <span class="btn-icon">🔍</span>
          <span class="btn-text">FIND MY PARTS</span>
          <span class="btn-spinner pulsing-spinner" style="display:none; width: 20px; height: 20px; margin-left: 6px;"></span>
        </button>
      </div>
      <div class="${classPrefix}-message" aria-live="polite"></div>
    </form>
  `;

  const form = container.querySelector(`.${classPrefix}-form`);
  const input = container.querySelector(`#${inputId}`);
  const message = container.querySelector(`.${classPrefix}-message`);
  const button = container.querySelector('button');
  const btnText = button.querySelector('.btn-text');
  const btnSpinner = button.querySelector('.btn-spinner');

  // Input auto-formatting for UK plate
  input.addEventListener('input', (e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    e.target.value = formatPlateDisplay(raw);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const vrm = normalizeVrm(input.value);

    if (!vrm || vrm.length < 2 || vrm.length > 8) {
      message.innerHTML = '⚠️ Please enter a valid UK registration plate (e.g. <strong>WP15 VKY</strong>).';
      message.className = `${classPrefix}-message error`;
      return;
    }

    message.innerHTML = `
      <div class="inline-search-loader">
        <span class="pulsing-spinner" style="width: 18px; height: 18px;"></span>
        <span>Searching UK DVLA vehicle database & compatibility catalog for <strong>${vrm}</strong>...</span>
      </div>
    `;
    message.className = `${classPrefix}-message loading`;
    button.disabled = true;
    btnSpinner.style.display = 'inline-block';

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryId = urlParams.get('category_id') || '';

      const result = await lookupVrmAndFetchSkus(vrm, categoryId);

      message.innerHTML = `✓ Vehicle Identified: <strong>${result.summary || vrm}</strong>. Updating parts...`;
      message.className = `${classPrefix}-message success`;

      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        setTimeout(() => {
          window.location.href = '/plp.html';
        }, 500);
      }
    } catch (error) {
      message.innerHTML = `⚠️ ${error.message || 'Vehicle not found. Please verify your registration number.'}`;
      message.className = `${classPrefix}-message error`;
    } finally {
      button.disabled = false;
      btnSpinner.style.display = 'none';
    }
  });
}
