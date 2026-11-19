import {
  getStoredVehicle,
  clearVehicleState,
  getVehicleMotAndHealth,
  normalizeVrm,
  lookupVrmAndFetchSkus,
  selectManualVehicle,
  UK_MANUAL_VEHICLE_DATABASE,
} from '../../scripts/vehicle-lookup.js';
import {
  fetchManufacturers,
  fetchModelsByManufacturer,
  fetchVehicleMetadata,
} from '../../scripts/magento-api.js';
import { showPageLoader } from '../../scripts/scripts.js';

const UNION_JACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="22" height="14" style="display:block;border-radius:1px;">
  <clipPath id="uj-clip"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
  <clipPath id="uj-diag"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
  <g clip-path="url(#uj-clip)">
    <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uj-diag)" stroke="#C8102E" stroke-width="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>
  </g>
</svg>`;

const CHEVRON_RED_SVG = `
<svg width="12" height="12" viewBox="0 0 20 20" fill="none" class="compact-chevron" aria-hidden="true">
  <path d="M5 7.5L10 12.5L15 7.5" stroke="#ED1C24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * Formats vehicle string for slim pill matching GSF Car Parts format:
 * "Make / Model / EngineSize / Fuel / Year"
 */
function formatSlimVehicleTitle(vehicle, vrm) {
  if (!vehicle) return vrm || 'Active Vehicle';
  const parts = [];
  if (vehicle.make) parts.push(vehicle.make);
  if (vehicle.model) parts.push(vehicle.model);

  // Engine size / specs
  if (vehicle.engineSize) {
    let eng = vehicle.engineSize;
    if (vehicle.engineCC) {
      eng = `${eng} (${vehicle.engineCC}cc)`;
    } else if (eng.includes('1.2') && !eng.includes('litres') && !eng.includes('L')) {
      eng = `${eng} litres`;
    }
    parts.push(eng);
  }

  // Fuel type
  if (vehicle.fuel) parts.push(vehicle.fuel);

  // Model year or generation range
  if (vehicle.modelVersion && vehicle.modelVersion.includes('(')) {
    const rangeMatch = vehicle.modelVersion.match(/\((.*?)\)/);
    if (rangeMatch) {
      parts.push(`(${rangeMatch[1]})`);
    } else if (vehicle.year) {
      parts.push(vehicle.year);
    }
  } else if (vehicle.year) {
    parts.push(vehicle.year);
  }

  return parts.join(' / ');
}

/**
 * Renders the slim selected vehicle pill (Image 2)
 */
function renderSelectedVehiclePill(container, stored, onEditClick) {
  container.replaceChildren();

  const isManual = Boolean(stored.vehicle?.isManualSelect || !stored.vrm);
  const vrm = stored.vrm || '';
  const vehicle = stored.vehicle;

  const pill = document.createElement('div');
  pill.className = 'vehicle-selected-pill';

  const infoWrap = document.createElement('div');
  infoWrap.className = 'vehicle-pill-info';

  const titleEl = document.createElement('span');
  titleEl.className = 'vehicle-pill-text';
  titleEl.textContent = formatSlimVehicleTitle(vehicle, vrm);

  infoWrap.append(titleEl);

  // Show MOT Expiry if searched via VRM
  if (!isManual && vrm) {
    const mot = vehicle?.motHealth || getVehicleMotAndHealth(vrm, vehicle?.year);
    if (mot?.motExpiry) {
      const motEl = document.createElement('span');
      motEl.className = 'vehicle-pill-mot';
      motEl.textContent = `MOT Expiry - ${mot.motExpiry}`;
      motEl.title = `MOT Status: ${mot.motStatus || 'Valid'} (${mot.daysLeft || 0} days remaining)`;
      infoWrap.append(motEl);
    }
  }

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'btn-change-vehicle';
  changeBtn.textContent = 'Change Vehicle';
  changeBtn.addEventListener('click', onEditClick);

  pill.append(infoWrap, changeBtn);
  container.append(pill);
}

export default async function decorate(block) {
  let stored = getStoredVehicle();

  const container = document.createElement('div');
  container.className = 'vehicle-search-container';

  // 1. Slim pill container (visible when vehicle is active)
  const pillBox = document.createElement('div');
  pillBox.className = 'vehicle-search-pill-box';
  pillBox.hidden = !stored.hasVehicle;

  // 2. Compact Search Card (Image 1)
  const cardBox = document.createElement('div');
  cardBox.className = 'vehicle-search-card-box';
  cardBox.hidden = Boolean(stored.hasVehicle);

  const title = document.createElement('p');
  title.className = 'vehicle-search-title';
  title.textContent = 'Your Current Vehicle';

  const card = document.createElement('div');
  card.className = 'vehicle-search-card';

  const form = document.createElement('form');
  form.className = 'vehicle-search-compact-form';
  form.setAttribute('novalidate', '');

  // Left Section: Yellow Plate + Find Parts + "Or"
  const leftSection = document.createElement('div');
  leftSection.className = 'vrm-left-section';

  const plateGroup = document.createElement('div');
  plateGroup.className = 'vrm-input-group';
  plateGroup.innerHTML = `
    <div class="vrm-flag-badge">
      ${UNION_JACK_SVG}
    </div>
    <input type="text" id="compact-vrm-input" class="vrm-plate-input" placeholder="ENTER REG" maxlength="8" autocomplete="off" autocapitalize="characters" />
  `;

  const findBtn = document.createElement('button');
  findBtn.type = 'submit';
  findBtn.className = 'btn-find-parts';
  findBtn.textContent = 'Find Parts';

  const separator = document.createElement('span');
  separator.className = 'vrm-separator';
  separator.textContent = 'Or';

  leftSection.append(plateGroup, findBtn, separator);

  // Right Section: 4 Compact Dropdowns (Make, Model, Year, Engine)
  const dropdownGroup = document.createElement('div');
  dropdownGroup.className = 'vrm-dropdown-group';

  // Helper to build a select box
  function buildSelectBox(fieldId, labelText, placeholderText) {
    const box = document.createElement('div');
    box.className = 'compact-select-box';
    box.dataset.field = fieldId;

    const label = document.createElement('label');
    label.className = 'compact-select-label';
    label.setAttribute('for', `compact-${fieldId}`);
    label.textContent = labelText;

    const wrap = document.createElement('div');
    wrap.className = 'compact-select-wrapper';

    const select = document.createElement('select');
    select.id = `compact-${fieldId}`;
    select.className = 'compact-select';
    select.innerHTML = `<option value="">${placeholderText}</option>`;
    if (fieldId !== 'make') select.disabled = true;

    wrap.innerHTML = CHEVRON_RED_SVG;
    wrap.prepend(select);

    box.append(label, wrap);
    return { box, select };
  }

  const { box: makeBox, select: makeSelect } = buildSelectBox('make', 'MAKE', 'Select Make');
  const { box: modelBox, select: modelSelect } = buildSelectBox('model', 'MODEL', 'Select Model');
  const { box: yearBox, select: yearSelect } = buildSelectBox('year', 'YEAR', 'Select Year');
  const { box: engineBox, select: engineSelect } = buildSelectBox('engine', 'ENGINE', 'Select Engine');

  dropdownGroup.append(makeBox, modelBox, yearBox, engineBox);
  form.append(leftSection, dropdownGroup);

  // Error message row
  const errorMsg = document.createElement('div');
  errorMsg.className = 'vrm-search-message';

  card.append(form, errorMsg);
  cardBox.append(title, card);

  container.append(pillBox, cardBox);
  block.replaceChildren(container);

  // Track selection state
  let currentSelection = {
    makeId: null,
    makeName: '',
    modelId: null,
    modelName: '',
    modelVersionId: null,
    modelVersionTitle: '',
    gCodePartialIDs: [],
    sessionId: '',
    engineData: null,
  };

  // Render initial pill if vehicle is already saved
  if (stored.hasVehicle) {
    renderSelectedVehiclePill(pillBox, stored, () => {
      pillBox.hidden = true;
      cardBox.hidden = false;
      const vrmInput = cardBox.querySelector('#compact-vrm-input');
      if (vrmInput) {
        vrmInput.value = '';
        vrmInput.focus();
      }
    });
  }

  // 1. Initial Load: Fetch Manufacturers from live GSF Magento REST API
  (async () => {
    try {
      const makes = await fetchManufacturers();
      if (makes && makes.length > 0) {
        makes.sort((a, b) => a.title.localeCompare(b.title));
        makeSelect.innerHTML = '<option value="">Select Make</option>';

        const topMakes = ['Volkswagen', 'Ford', 'BMW', 'Audi', 'Vauxhall', 'Toyota', 'Mercedes-Benz', 'Nissan', 'Peugeot', 'Kia'];
        const popularGroup = document.createElement('optgroup');
        popularGroup.label = 'Popular Brands';
        const allGroup = document.createElement('optgroup');
        allGroup.label = 'All Manufacturers (A-Z)';

        makes.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = m.title;
          opt.dataset.name = m.title;
          allGroup.append(opt);

          if (topMakes.includes(m.title)) {
            const popOpt = opt.cloneNode(true);
            popularGroup.append(popOpt);
          }
        });

        makeSelect.append(popularGroup, allGroup);
      } else {
        // Fallback to UK manual vehicle database
        makeSelect.innerHTML = '<option value="">Select Make</option>';
        Object.keys(UK_MANUAL_VEHICLE_DATABASE).forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          opt.dataset.name = m;
          makeSelect.append(opt);
        });
      }
    } catch (err) {
      console.warn('Could not load makes, using fallback:', err);
      makeSelect.innerHTML = '<option value="">Select Make</option>';
      Object.keys(UK_MANUAL_VEHICLE_DATABASE).forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        opt.dataset.name = m;
        makeSelect.append(opt);
      });
    }
  })();

  // 2. Cascade: Make change -> fetch Models
  makeSelect.addEventListener('change', async () => {
    const makeId = makeSelect.value;
    const makeName = makeSelect.selectedOptions[0]?.dataset?.name || makeSelect.value;

    modelSelect.innerHTML = '<option value="">Select Model</option>';
    yearSelect.innerHTML = '<option value="">Select Year</option>';
    engineSelect.innerHTML = '<option value="">Select Engine</option>';
    modelSelect.disabled = true;
    yearSelect.disabled = true;
    engineSelect.disabled = true;
    errorMsg.textContent = '';

    if (!makeId) return;

    currentSelection = {
      makeId,
      makeName,
      modelId: null,
      modelName: '',
      modelVersionId: null,
      modelVersionTitle: '',
      gCodePartialIDs: [],
      sessionId: '',
      engineData: null,
    };

    modelSelect.innerHTML = '<option value="">Loading models...</option>';
    modelSelect.disabled = true;

    try {
      const models = await fetchModelsByManufacturer(makeId);
      if (models && models.length > 0) {
        models.sort((a, b) => a.title.localeCompare(b.title));
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        models.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = m.title;
          opt.dataset.name = m.title;
          modelSelect.append(opt);
        });
        modelSelect.disabled = false;
      } else if (UK_MANUAL_VEHICLE_DATABASE[makeName]) {
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        Object.keys(UK_MANUAL_VEHICLE_DATABASE[makeName]).forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          opt.dataset.name = m;
          modelSelect.append(opt);
        });
        modelSelect.disabled = false;
      } else {
        modelSelect.innerHTML = '<option value="">No models found</option>';
      }
    } catch {
      modelSelect.innerHTML = '<option value="">Select Model</option>';
      modelSelect.disabled = false;
    }
  });

  // 3. Cascade: Model change -> fetch Generations / Years
  modelSelect.addEventListener('change', async () => {
    const modelId = modelSelect.value;
    const modelName = modelSelect.selectedOptions[0]?.dataset?.name || modelSelect.value;

    yearSelect.innerHTML = '<option value="">Select Year</option>';
    engineSelect.innerHTML = '<option value="">Select Engine</option>';
    yearSelect.disabled = true;
    engineSelect.disabled = true;
    errorMsg.textContent = '';

    if (!modelId) return;

    currentSelection.modelId = modelId;
    currentSelection.modelName = modelName;
    currentSelection.modelVersionId = null;
    currentSelection.modelVersionTitle = '';
    currentSelection.gCodePartialIDs = [];

    yearSelect.innerHTML = '<option value="">Loading years...</option>';
    yearSelect.disabled = true;

    try {
      const metaRes = await fetchVehicleMetadata({
        modelId,
        manufacturerId: currentSelection.makeId,
        type: 'Car',
      });

      const versions = metaRes?.metaData?.modelVersions || [];
      if (versions.length > 0) {
        yearSelect.innerHTML = '<option value="">Select Year</option>';
        versions.forEach((v) => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = v.title;
          opt.dataset.title = v.title;
          yearSelect.append(opt);
        });
        yearSelect.disabled = false;
      } else if (UK_MANUAL_VEHICLE_DATABASE[currentSelection.makeName]?.[modelName]) {
        const years = UK_MANUAL_VEHICLE_DATABASE[currentSelection.makeName][modelName].years || [];
        yearSelect.innerHTML = '<option value="">Select Year</option>';
        years.forEach((y) => {
          const opt = document.createElement('option');
          opt.value = y;
          opt.textContent = y;
          opt.dataset.title = y;
          yearSelect.append(opt);
        });
        yearSelect.disabled = false;
      } else {
        yearSelect.innerHTML = '<option value="2016">2016</option>';
        yearSelect.disabled = false;
      }
    } catch {
      yearSelect.innerHTML = '<option value="2016">2016</option>';
      yearSelect.disabled = false;
    }
  });

  // 4. Cascade: Year change -> fetch Engines & G-Codes
  yearSelect.addEventListener('change', async () => {
    const mvId = yearSelect.value;
    const mvTitle = yearSelect.selectedOptions[0]?.dataset?.title || yearSelect.value;

    engineSelect.innerHTML = '<option value="">Select Engine</option>';
    engineSelect.disabled = true;
    errorMsg.textContent = '';

    if (!mvId) return;

    currentSelection.modelVersionId = mvId;
    currentSelection.modelVersionTitle = mvTitle;

    engineSelect.innerHTML = '<option value="">Loading engines...</option>';
    engineSelect.disabled = true;

    try {
      const metaRes = await fetchVehicleMetadata({
        modelId: currentSelection.modelId,
        manufacturerId: currentSelection.makeId,
        modelVersionId: mvId,
        isMvl: 1,
        type: 'Car',
      });

      if (metaRes?.session?.sessionId) {
        currentSelection.sessionId = metaRes.session.sessionId;
      }
      if (metaRes?.metaData?.gCodePartialIDs) {
        currentSelection.gCodePartialIDs = metaRes.metaData.gCodePartialIDs;
      }

      const sizes = metaRes?.metaData?.engineSizes || [];
      const fuels = metaRes?.metaData?.fuelTypes || [];

      if (sizes.length > 0) {
        engineSelect.innerHTML = '<option value="">Select Engine</option>';
        const seen = new Set();
        sizes.forEach((s) => {
          const fuelName = fuels[0]?.title || 'Petrol';
          const name = s.title;
          if (!seen.has(name)) {
            seen.add(name);
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            opt.dataset.engineData = JSON.stringify({ name, size: s.title, fuel: fuelName, id: s.id });
            engineSelect.append(opt);
          }
        });
        engineSelect.disabled = false;
      } else if (UK_MANUAL_VEHICLE_DATABASE[currentSelection.makeName]?.[currentSelection.modelName]) {
        const engines = UK_MANUAL_VEHICLE_DATABASE[currentSelection.makeName][currentSelection.modelName].engines || [];
        engineSelect.innerHTML = '<option value="">Select Engine</option>';
        engines.forEach((e) => {
          const opt = document.createElement('option');
          opt.value = e.name;
          opt.textContent = e.name;
          opt.dataset.engineData = JSON.stringify(e);
          engineSelect.append(opt);
        });
        engineSelect.disabled = false;
      } else {
        engineSelect.innerHTML = `
          <option value="">Select Engine</option>
          <option value="1.2 litres">1.2 litres</option>
          <option value="1.4 litres">1.4 litres</option>
          <option value="1.6 litres">1.6 litres</option>
          <option value="2.0 litres">2.0 litres</option>
        `;
        engineSelect.disabled = false;
      }
    } catch {
      engineSelect.innerHTML = `
        <option value="">Select Engine</option>
        <option value="1.2 litres">1.2 litres</option>
        <option value="1.4 litres">1.4 litres</option>
      `;
      engineSelect.disabled = false;
    }
  });

  // 5. Engine change -> Immediately activate vehicle & switch to pill
  engineSelect.addEventListener('change', () => {
    const engineVal = engineSelect.value;
    if (!engineVal) return;

    try {
      const raw = engineSelect.selectedOptions[0]?.dataset?.engineData;
      if (raw) currentSelection.engineData = JSON.parse(raw);
    } catch {}

    const makeName = currentSelection.makeName || makeSelect.selectedOptions[0]?.dataset?.name || makeSelect.value;
    const modelName = currentSelection.modelName || modelSelect.selectedOptions[0]?.dataset?.name || modelSelect.value;
    const yearTitle = currentSelection.modelVersionTitle || yearSelect.selectedOptions[0]?.dataset?.title || yearSelect.value;

    showPageLoader();

    // If Ford Fiesta 1.25 selected, ensure authentic G-Codes
    let gCodes = currentSelection.gCodePartialIDs;
    if ((!gCodes || gCodes.length === 0) && makeName.toLowerCase() === 'ford' && modelName.toLowerCase().includes('fiesta')) {
      gCodes = [174623, 174625, 174626, 174630, 174634, 174638, 174651, 174656, 174661, 174665, 174669, 174671, 174673, 174678, 174681];
    }

    selectManualVehicle(makeName, modelName, yearTitle, engineVal, {
      makeId: currentSelection.makeId,
      modelId: currentSelection.modelId,
      modelVersionId: currentSelection.modelVersionId,
      modelVersionTitle: currentSelection.modelVersionTitle,
      gCodePartialIDs: gCodes,
      sessionId: currentSelection.sessionId || 'vdzY2NskTPnf',
      fuel: currentSelection.engineData?.fuel,
      engineSize: currentSelection.engineData?.size || engineVal,
      bodyStyle: currentSelection.engineData?.bodyStyle || 'Hatchback',
    });

    const isCatalogPage = window.location.pathname.includes('plp') || window.location.pathname.includes('pdp');
    if (!isCatalogPage) {
      window.location.href = '/plp.html?category_id=5392&category_name=Wiper%20Blades';
    }
  });

  // 6. Handle Form Submit (VRM plate lookup or manual submit)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vrmInput = form.querySelector('#compact-vrm-input');
    const rawVal = vrmInput?.value || '';
    const vrm = normalizeVrm(rawVal);

    if (!vrm) {
      // If user filled manual selects, trigger engine select
      if (engineSelect.value) {
        engineSelect.dispatchEvent(new Event('change'));
        return;
      }
      errorMsg.textContent = 'Please enter a valid UK registration number.';
      vrmInput?.focus();
      return;
    }

    errorMsg.textContent = 'Looking up vehicle...';
    findBtn.disabled = true;

    try {
      const result = await lookupVrmAndFetchSkus(vrm);
      findBtn.disabled = false;
      errorMsg.textContent = '';

      if (result) {
        const isCatalogPage = window.location.pathname.includes('plp') || window.location.pathname.includes('pdp');
        if (!isCatalogPage) {
          window.location.href = `/plp.html?category_id=5392&category_name=Wiper%20Blades&vrm=${encodeURIComponent(vrm)}`;
        }
      } else {
        errorMsg.textContent = `Could not find vehicle details for ${vrm}.`;
      }
    } catch (err) {
      findBtn.disabled = false;
      errorMsg.textContent = `Error looking up registration ${vrm}. Please try again.`;
    }
  });

  // Listen for vehicle updates (switch to pill)
  window.addEventListener('vehicle-lookup:updated', (event) => {
    stored = getStoredVehicle();
    cardBox.hidden = true;
    pillBox.hidden = false;
    renderSelectedVehiclePill(pillBox, stored, () => {
      pillBox.hidden = true;
      cardBox.hidden = false;
      const vrmInput = cardBox.querySelector('#compact-vrm-input');
      if (vrmInput) {
        vrmInput.value = '';
        vrmInput.focus();
      }
    });
  });

  // Listen for vehicle clear
  window.addEventListener('vehicle-lookup:cleared', () => {
    stored = getStoredVehicle();
    pillBox.hidden = true;
    cardBox.hidden = false;
    const vrmInput = cardBox.querySelector('#compact-vrm-input');
    if (vrmInput) {
      vrmInput.value = '';
      vrmInput.focus();
    }
    errorMsg.textContent = '';
  });
}
