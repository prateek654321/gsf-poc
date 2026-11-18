import {
  formatVehicleSummary,
  getStoredVehicle,
  initVehicleLookup,
  clearVehicleState,
  getVehicleMotAndHealth,
  UK_MANUAL_VEHICLE_DATABASE,
  selectManualVehicle,
} from '../../scripts/vehicle-lookup.js';
import {
  fetchManufacturers,
  fetchModelsByManufacturer,
  fetchVehicleMetadata,
} from '../../scripts/magento-api.js';
import { showPageLoader } from '../../scripts/scripts.js';

function renderVehicleSummary(container, vrm, summary, vehicle) {
  container.replaceChildren();

  if (!summary && !vehicle) {
    if (!vrm) return;
    const status = document.createElement('p');
    status.className = 'vehicle-search-status';
    status.textContent = vrm;
    container.append(status);
    return;
  }

  const displaySummary = summary || formatVehicleSummary(vehicle);
  const mot = vehicle?.motHealth || getVehicleMotAndHealth(vrm, vehicle?.year);

  const summaryEl = document.createElement('div');
  summaryEl.className = 'vehicle-search-summary';

  // Left: Car photo / icon
  const mediaCol = document.createElement('div');
  mediaCol.className = 'vehicle-summary-media';
  if (vehicle?.imageUrl) {
    const image = document.createElement('img');
    image.className = 'vehicle-search-image';
    image.src = vehicle.imageUrl;
    image.alt = displaySummary;
    image.loading = 'lazy';
    mediaCol.append(image);
  } else {
    mediaCol.innerHTML = `
      <div class="vehicle-icon-avatar">
        <span>🚗</span>
      </div>
    `;
  }

  // Middle: Info & MOT/Health Card
  const details = document.createElement('div');
  details.className = 'vehicle-search-details';

  const isManual = Boolean(vehicle?.isManualSelect || !vrm);

  const topRow = document.createElement('div');
  topRow.className = 'vehicle-summary-top-row';

  // Only display UK registration plate design when searched via VRM
  if (!isManual && vrm) {
    const regBadge = document.createElement('div');
    regBadge.className = 'uk-plate mini';
    regBadge.innerHTML = `
      <span class="uk-plate-gb">GB</span>
      <span class="uk-plate-text">${vrm}</span>
    `;
    topRow.append(regBadge);
  } else {
    const manualBadge = document.createElement('span');
    manualBadge.className = 'badge-manual-vehicle';
    manualBadge.innerHTML = `🚗 Selected Vehicle`;
    topRow.append(manualBadge);
  }

  const fitBadge = document.createElement('span');
  fitBadge.className = 'badge-fitment fits';
  fitBadge.innerHTML = `✓ Active Vehicle: Guaranteed Fit Parts Active`;

  topRow.append(fitBadge);

  const title = document.createElement('h3');
  title.className = 'vehicle-search-summary-text';
  title.textContent = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || displaySummary;

  const specs = document.createElement('p');
  specs.className = 'vehicle-search-specs';
  specs.textContent = displaySummary;

  // MOT & Road Tax Expiry Alert: only for VRM lookups with real registration
  const motBox = document.createElement('div');
  if (!isManual && vrm) {
    motBox.className = `vehicle-mot-badge ${mot.isUrgent ? 'mot-urgent' : 'mot-valid'}`;
    motBox.innerHTML = `
      <div class="mot-main-row">
        <span class="mot-indicator-dot"></span>
        <strong class="mot-label">MOT ${mot.motStatus}:</strong>
        <span class="mot-date">${mot.motExpiry} (${mot.daysLeft} days remaining)</span>
        <span class="mot-tax">Tax: ${mot.taxStatus}</span>
        <span class="mot-mileage">Mileage: ${mot.mileage}</span>
      </div>
      <div class="mot-advice-row">
        <span class="mot-advice-text">${mot.serviceRecommendation}</span>
        <a href="/plp.html?category_id=5461&category_name=Braking" class="mot-parts-link">Shop Fitted Brake & Service Parts →</a>
      </div>
    `;
  } else {
    motBox.className = 'vehicle-mot-badge mot-valid';
    motBox.innerHTML = `
      <div class="mot-main-row">
        <span class="mot-indicator-dot" style="background: #16a34a;"></span>
        <strong class="mot-label">Active Vehicle Match:</strong>
        <span class="mot-date">${vehicle?.year ? `Model Year ${vehicle.year}` : 'Active Model'}</span>
        <span class="mot-tax">Fuel: ${vehicle?.fuel || 'Standard'}</span>
        <span class="mot-mileage">Engine: ${vehicle?.engineSize || '2.0L'}</span>
      </div>
      <div class="mot-advice-row">
        <span class="mot-advice-text">🟢 Guaranteed Fitment Active: Showing parts precision-matched for ${vehicle?.make || ''} ${vehicle?.model || ''}.</span>
        <a href="/plp.html?category_id=5461&category_name=Braking" class="mot-parts-link">Shop Fitted Brake & Service Parts →</a>
      </div>
    `;
  }

  details.append(topRow, title, specs, motBox);

  // Right: Action button
  const actions = document.createElement('div');
  actions.className = 'vehicle-search-actions';

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'btn btn-outline btn-change-vehicle';
  changeBtn.innerHTML = `🔄 Change Vehicle`;
  changeBtn.addEventListener('click', () => {
    clearVehicleState();
  });

  actions.append(changeBtn);

  summaryEl.append(mediaCol, details, actions);
  container.append(summaryEl);
}

function renderManualSelector(container) {
  container.innerHTML = `
    <form class="vehicle-manual-form">
      <div class="manual-dropdown-grid">
        <div class="manual-dropdown-field">
          <label for="manual-make-select">1. Make</label>
          <select id="manual-make-select" class="manual-select" required>
            <option value="">⏳ Loading Makes from GSF Catalog...</option>
          </select>
        </div>
        <div class="manual-dropdown-field">
          <label for="manual-model-select">2. Model</label>
          <select id="manual-model-select" class="manual-select" disabled required>
            <option value="">Select Model...</option>
          </select>
        </div>
        <div class="manual-dropdown-field">
          <label for="manual-year-select">3. Year / Generation</label>
          <select id="manual-year-select" class="manual-select" disabled required>
            <option value="">Select Year...</option>
          </select>
        </div>
        <div class="manual-dropdown-field">
          <label for="manual-engine-select">4. Engine / Spec</label>
          <select id="manual-engine-select" class="manual-select" disabled required>
            <option value="">Select Engine...</option>
          </select>
        </div>
      </div>
      <div class="manual-action-row">
        <button type="submit" class="btn btn-primary manual-submit-btn" disabled>
          <span>🔍 FIND PARTS FOR THIS VEHICLE</span>
        </button>
      </div>
    </form>
  `;

  const makeSelect = container.querySelector('#manual-make-select');
  const modelSelect = container.querySelector('#manual-model-select');
  const yearSelect = container.querySelector('#manual-year-select');
  const engineSelect = container.querySelector('#manual-engine-select');
  const submitBtn = container.querySelector('.manual-submit-btn');
  const form = container.querySelector('.vehicle-manual-form');

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

  // 1. Initial Load: Fetch Manufacturers from live GSF Magento REST API
  (async () => {
    try {
      const makes = await fetchManufacturers();
      if (makes && makes.length > 0) {
        makes.sort((a, b) => a.title.localeCompare(b.title));

        makeSelect.innerHTML = `<option value="">Select Make (${makes.length} Available)...</option>`;

        const topMakes = ['Volkswagen', 'Ford', 'BMW', 'Audi', 'Vauxhall', 'Toyota', 'Mercedes-Benz', 'Nissan', 'Peugeot', 'Kia'];
        const popularGroup = document.createElement('optgroup');
        popularGroup.label = '⭐ Popular UK Brands';
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
        // Fallback to static UK_MANUAL_VEHICLE_DATABASE
        makeSelect.innerHTML = '<option value="">Select Make...</option>';
        Object.keys(UK_MANUAL_VEHICLE_DATABASE).forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = m;
          opt.dataset.name = m;
          makeSelect.append(opt);
        });
      }
    } catch (err) {
      console.warn('Could not load makes from GSF API, falling back:', err);
      makeSelect.innerHTML = '<option value="">Select Make...</option>';
      Object.keys(UK_MANUAL_VEHICLE_DATABASE).forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        opt.dataset.name = m;
        makeSelect.append(opt);
      });
    }
  })();

  // 2. Cascade: Make changed -> fetch Models
  makeSelect.addEventListener('change', async () => {
    const makeId = makeSelect.value;
    const makeName = makeSelect.selectedOptions[0]?.dataset?.name || makeSelect.value;

    modelSelect.innerHTML = '<option value="">Select Model...</option>';
    yearSelect.innerHTML = '<option value="">Select Year...</option>';
    engineSelect.innerHTML = '<option value="">Select Engine...</option>';
    modelSelect.disabled = true;
    yearSelect.disabled = true;
    engineSelect.disabled = true;
    submitBtn.disabled = true;

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

    modelSelect.innerHTML = `<option value="">⏳ Loading models for ${makeName}...</option>`;
    modelSelect.disabled = true;

    try {
      const models = await fetchModelsByManufacturer(makeId);
      if (models && models.length > 0) {
        models.sort((a, b) => a.title.localeCompare(b.title));
        modelSelect.innerHTML = `<option value="">Select Model (${models.length} Available)...</option>`;
        models.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = m.title;
          opt.dataset.name = m.title;
          modelSelect.append(opt);
        });
        modelSelect.disabled = false;
      } else if (UK_MANUAL_VEHICLE_DATABASE[makeName]) {
        modelSelect.innerHTML = '<option value="">Select Model...</option>';
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
    } catch (err) {
      console.warn('Error fetching models:', err);
      modelSelect.innerHTML = '<option value="">Error loading models</option>';
    }
  });

  // 3. Cascade: Model changed -> fetch Model Versions / Generations
  modelSelect.addEventListener('change', async () => {
    const modelId = modelSelect.value;
    const modelName = modelSelect.selectedOptions[0]?.dataset?.name || modelSelect.value;

    yearSelect.innerHTML = '<option value="">Select Year...</option>';
    engineSelect.innerHTML = '<option value="">Select Engine...</option>';
    yearSelect.disabled = true;
    engineSelect.disabled = true;
    submitBtn.disabled = true;

    if (!modelId) return;

    currentSelection.modelId = modelId;
    currentSelection.modelName = modelName;
    currentSelection.modelVersionId = null;
    currentSelection.modelVersionTitle = '';
    currentSelection.gCodePartialIDs = [];

    yearSelect.innerHTML = '<option value="">⏳ Loading generations & years...</option>';
    yearSelect.disabled = true;

    try {
      const metaRes = await fetchVehicleMetadata({
        modelId,
        manufacturerId: currentSelection.makeId,
        type: 'Car',
      });

      const versions = metaRes?.metaData?.modelVersions || [];
      if (versions.length > 0) {
        yearSelect.innerHTML = `<option value="">Select Generation / Year (${versions.length} Available)...</option>`;
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
        yearSelect.innerHTML = '<option value="">Select Year...</option>';
        years.forEach((y) => {
          const opt = document.createElement('option');
          opt.value = y;
          opt.textContent = y;
          opt.dataset.title = y;
          yearSelect.append(opt);
        });
        yearSelect.disabled = false;
      } else {
        yearSelect.innerHTML = '<option value="2019">Standard Generation (2015-2023)</option>';
        yearSelect.disabled = false;
      }
    } catch (err) {
      console.warn('Error fetching vehicle metadata:', err);
      yearSelect.innerHTML = '<option value="">Error loading years</option>';
    }
  });

  // 4. Cascade: Year / Generation changed -> fetch Engine Specifications & GCodePartialIDs
  yearSelect.addEventListener('change', async () => {
    const mvId = yearSelect.value;
    const mvTitle = yearSelect.selectedOptions[0]?.dataset?.title || yearSelect.value;

    engineSelect.innerHTML = '<option value="">Select Engine...</option>';
    engineSelect.disabled = true;
    submitBtn.disabled = true;

    if (!mvId) return;

    currentSelection.modelVersionId = mvId;
    currentSelection.modelVersionTitle = mvTitle;

    engineSelect.innerHTML = '<option value="">⏳ Loading engine variants...</option>';
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
        engineSelect.innerHTML = '<option value="">Select Engine Specification...</option>';
        const seen = new Set();

        sizes.forEach((s) => {
          if (fuels.length > 0) {
            fuels.forEach((f) => {
              const name = `${s.title} • ${f.title}`;
              if (!seen.has(name)) {
                seen.add(name);
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                opt.dataset.engineData = JSON.stringify({ name, size: s.title, fuel: f.title, id: s.id });
                engineSelect.append(opt);
              }
            });
          } else {
            const name = `${s.title} Engine`;
            if (!seen.has(name)) {
              seen.add(name);
              const opt = document.createElement('option');
              opt.value = name;
              opt.textContent = name;
              opt.dataset.engineData = JSON.stringify({ name, size: s.title, fuel: 'Petrol/Diesel', id: s.id });
              engineSelect.append(opt);
            }
          }
        });

        engineSelect.disabled = false;
      } else if (UK_MANUAL_VEHICLE_DATABASE[currentSelection.makeName]?.[currentSelection.modelName]) {
        const engines = UK_MANUAL_VEHICLE_DATABASE[currentSelection.makeName][currentSelection.modelName].engines || [];
        engineSelect.innerHTML = '<option value="">Select Engine...</option>';
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
          <option value="">Select Engine...</option>
          <option value="2.0L Diesel (150 bhp)">2.0L Diesel (150 bhp)</option>
          <option value="1.5L Petrol (130 bhp)">1.5L Petrol (130 bhp)</option>
          <option value="2.0L Petrol (190 bhp)">2.0L Petrol (190 bhp)</option>
        `;
        engineSelect.disabled = false;
      }
    } catch (err) {
      console.warn('Error fetching engine metadata:', err);
      engineSelect.innerHTML = '<option value="2.0L Diesel (150 bhp)">2.0L Diesel (150 bhp)</option>';
      engineSelect.disabled = false;
    }
  });

  // 5. Engine selected -> enable submit button
  engineSelect.addEventListener('change', () => {
    submitBtn.disabled = !engineSelect.value;
    try {
      const raw = engineSelect.selectedOptions[0]?.dataset?.engineData;
      if (raw) currentSelection.engineData = JSON.parse(raw);
    } catch {
      // Ignore
    }
  });

  // 6. Submit -> activate vehicle and navigate to PLP
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const makeName = currentSelection.makeName || makeSelect.selectedOptions[0]?.dataset?.name || makeSelect.value;
    const modelName = currentSelection.modelName || modelSelect.selectedOptions[0]?.dataset?.name || modelSelect.value;
    const yearTitle = currentSelection.modelVersionTitle || yearSelect.selectedOptions[0]?.dataset?.title || yearSelect.value;
    const engineName = engineSelect.value;

    if (!makeName || !modelName || !yearTitle || !engineName) return;

    showPageLoader();

    selectManualVehicle(makeName, modelName, yearTitle, engineName, {
      makeId: currentSelection.makeId,
      modelId: currentSelection.modelId,
      modelVersionId: currentSelection.modelVersionId,
      modelVersionTitle: currentSelection.modelVersionTitle,
      gCodePartialIDs: currentSelection.gCodePartialIDs,
      sessionId: currentSelection.sessionId,
      fuel: currentSelection.engineData?.fuel,
      engineSize: currentSelection.engineData?.size,
    });

    const isCatalogPage = window.location.pathname.includes('plp') || window.location.pathname.includes('pdp');
    if (!isCatalogPage) {
      window.location.href = '/plp.html?category_id=5461&category_name=Braking';
    }
  });
}

export default async function decorate(block) {
  const stored = getStoredVehicle();

  const inner = document.createElement('div');
  inner.className = 'vehicle-search-inner';

  const headingBox = document.createElement('div');
  headingBox.className = 'vehicle-search-header';
  headingBox.innerHTML = `
    <div class="hero-strapline-row">
      <span class="vehicle-search-tag">🇬🇧 UK'S LEADING CAR PARTS SPECIALIST</span>
      <span class="hero-poc-flag">AEM EDS POC</span>
    </div>
    <h1 class="vehicle-search-heading">DO YOURSELF PROUD</h1>
    <p class="vehicle-search-description">Over 100,000 quality car parts at unbeatable trade prices. Enter your registration for 100% guaranteed vehicle fitment.</p>
    <div class="hero-badges-row">
      <div class="hero-badge-trustpilot">
        <span class="stars">★★★★★</span>
        <strong>4.5/5</strong> Rated Excellent (80k+ Reviews)
      </div>
      <div class="hero-badge-promo">
        <span>🏷️ Promo Code: <strong>GSF22</strong></span>
      </div>
    </div>
  `;

  // Dual-tab switcher: VRM vs Manual Select
  const tabNav = document.createElement('div');
  tabNav.className = 'vehicle-search-tabs';
  tabNav.setAttribute('role', 'tablist');
  tabNav.innerHTML = `
    <button type="button" class="vehicle-tab-btn active" role="tab" aria-selected="true" data-tab="vrm">
      <span class="tab-flag">🇬🇧</span> By Registration (VRM)
    </button>
    <button type="button" class="vehicle-tab-btn" role="tab" aria-selected="false" data-tab="manual">
      <span class="tab-icon">🚗</span> By Make & Model
    </button>
  `;

  const tabsContent = document.createElement('div');
  tabsContent.className = 'vehicle-search-tabs-content';

  const vrmPane = document.createElement('div');
  vrmPane.className = 'vehicle-tab-pane active';
  vrmPane.id = 'tab-pane-vrm';

  const manualPane = document.createElement('div');
  manualPane.className = 'vehicle-tab-pane';
  manualPane.id = 'tab-pane-manual';
  manualPane.style.display = 'none';

  tabsContent.append(vrmPane, manualPane);

  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'vehicle-search-summary-container';
  summaryContainer.hidden = !stored.hasVehicle;

  inner.append(headingBox, tabNav, tabsContent, summaryContainer);
  block.replaceChildren(inner);

  // Tab switching logic
  const tabButtons = tabNav.querySelectorAll('.vehicle-tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const target = btn.dataset.tab;
      if (target === 'vrm') {
        vrmPane.style.display = 'block';
        manualPane.style.display = 'none';
      } else {
        vrmPane.style.display = 'none';
        manualPane.style.display = 'block';
      }
    });
  });

  // Render VRM lookup form into vrmPane
  await initVehicleLookup(vrmPane, {
    inputId: 'vehicle-search-vrm-input',
    classPrefix: 'vehicle-search',
  });

  // Render Manual Select cascading form into manualPane
  renderManualSelector(manualPane);

  if (stored.hasVehicle) {
    renderVehicleSummary(
      summaryContainer,
      stored.vrm,
      stored.summary,
      stored.vehicle,
    );
  }

  window.addEventListener('vehicle-lookup:updated', (event) => {
    const { vrm, summary, vehicle } = event.detail;
    summaryContainer.hidden = false;
    renderVehicleSummary(summaryContainer, vrm, summary, vehicle);
  });

  window.addEventListener('vehicle-lookup:cleared', () => {
    summaryContainer.hidden = true;
    const input = vrmPane.querySelector('input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const msg = vrmPane.querySelector('.vehicle-search-message');
    if (msg) msg.textContent = '';
  });
}
