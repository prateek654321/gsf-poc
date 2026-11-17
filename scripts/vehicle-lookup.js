import {
  fetchVrmDetails,
  fetchFitmentSkus,
  checkProductCompatibility,
} from './magento-api.js';

export const STORAGE_KEYS = {
  VRM: 'gsf_vehicle_vrm',
  SESSION_ID: 'gsf_vehicle_session_id',
  COMPONENT_IDS: 'gsf_vehicle_component_ids',
  COMPONENT_ID: 'gsf_component_id',
  VEHICLE_DATA: 'gsf_vehicle_data',
  VALID_SKUS: 'gsf_vehicle_valid_skus',
  VEHICLE_SUMMARY: 'gsf_vehicle_summary',
};

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
  return [
    vehicle.make,
    vehicle.model,
    vehicle.engineSize ? `${(Number(vehicle.engineSize) / 1000).toFixed(1)}L` : null,
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
 */
export async function lookupVrmAndFetchSkus(vrmInput, categoryId = '') {
  const vrm = normalizeVrm(vrmInput);
  if (!vrm || vrm.length < 2 || vrm.length > 8) {
    throw new Error('Please enter a valid UK registration number.');
  }

  // 1. Fetch VRM Details
  const details = await fetchVrmDetails(vrm);

  // 2. Fetch Fitment SKUs
  let validSkus = [];
  try {
    if (details.sessionId && details.componentIds.length > 0) {
      validSkus = await fetchFitmentSkus({
        sessionId: details.sessionId,
        componentIds: details.componentIds,
        vrm: details.vrm,
        categoryId,
      });
    }
  } catch (err) {
    console.warn('Could not fetch fitment SKUs:', err);
    validSkus = [];
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
 * Check whether a product SKU fits the currently active vehicle
 */
export async function checkCurrentVehicleFitment(sku, categoryId = '') {
  const stored = getStoredVehicle();
  if (!stored.hasVehicle) {
    return { hasVehicle: false, isCompatible: null };
  }

  // Check in cached valid SKUs first
  if (stored.validSkus && stored.validSkus.length > 0) {
    const isFitted = stored.validSkus.some((s) => s.toUpperCase() === sku.toUpperCase());
    return {
      hasVehicle: true,
      vehicle: stored.vehicle,
      summary: stored.summary,
      vrm: stored.vrm,
      isCompatible: isFitted,
    };
  }

  // Fallback to single-sku API check
  try {
    const res = await checkProductCompatibility({
      sku,
      sessionId: stored.sessionId,
      componentId: stored.componentId,
      categoryId,
    });
    return {
      hasVehicle: true,
      vehicle: stored.vehicle,
      summary: stored.summary,
      vrm: stored.vrm,
      isCompatible: res.isCompatible,
      recommendedSku: res.recommendedSku,
    };
  } catch {
    return {
      hasVehicle: true,
      vehicle: stored.vehicle,
      summary: stored.summary,
      vrm: stored.vrm,
      isCompatible: false,
    };
  }
}
