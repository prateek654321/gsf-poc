import {
  formatVehicleSummary,
  getStoredVehicle,
  initVehicleLookup,
  clearVehicleState,
  getVehicleMotAndHealth,
  UK_MANUAL_VEHICLE_DATABASE,
  selectManualVehicle,
} from '../../scripts/vehicle-lookup.js';
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

  const topRow = document.createElement('div');
  topRow.className = 'vehicle-summary-top-row';

  const regBadge = document.createElement('div');
  regBadge.className = 'uk-plate mini';
  regBadge.innerHTML = `
    <span class="uk-plate-gb">GB</span>
    <span class="uk-plate-text">${vrm}</span>
  `;

  const fitBadge = document.createElement('span');
  fitBadge.className = 'badge-fitment fits';
  fitBadge.innerHTML = `✓ Active Vehicle: Guaranteed Fit Parts Active`;

  topRow.append(regBadge, fitBadge);

  const title = document.createElement('h3');
  title.className = 'vehicle-search-summary-text';
  title.textContent = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || displaySummary;

  const specs = document.createElement('p');
  specs.className = 'vehicle-search-specs';
  specs.textContent = displaySummary;

  // MOT & Road Tax Expiry Alert
  const motBox = document.createElement('div');
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
            <option value="">Select Make...</option>
            ${Object.keys(UK_MANUAL_VEHICLE_DATABASE).map((m) => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="manual-dropdown-field">
          <label for="manual-model-select">2. Model</label>
          <select id="manual-model-select" class="manual-select" disabled required>
            <option value="">Select Model...</option>
          </select>
        </div>
        <div class="manual-dropdown-field">
          <label for="manual-year-select">3. Year</label>
          <select id="manual-year-select" class="manual-select" disabled required>
            <option value="">Select Year...</option>
          </select>
        </div>
        <div class="manual-dropdown-field">
          <label for="manual-engine-select">4. Engine / Fuel</label>
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

  makeSelect.addEventListener('change', () => {
    const make = makeSelect.value;
    modelSelect.innerHTML = '<option value="">Select Model...</option>';
    yearSelect.innerHTML = '<option value="">Select Year...</option>';
    engineSelect.innerHTML = '<option value="">Select Engine...</option>';
    yearSelect.disabled = true;
    engineSelect.disabled = true;
    submitBtn.disabled = true;

    if (make && UK_MANUAL_VEHICLE_DATABASE[make]) {
      const models = Object.keys(UK_MANUAL_VEHICLE_DATABASE[make]);
      models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.append(opt);
      });
      modelSelect.disabled = false;
    } else {
      modelSelect.disabled = true;
    }
  });

  modelSelect.addEventListener('change', () => {
    const make = makeSelect.value;
    const model = modelSelect.value;
    yearSelect.innerHTML = '<option value="">Select Year...</option>';
    engineSelect.innerHTML = '<option value="">Select Engine...</option>';
    engineSelect.disabled = true;
    submitBtn.disabled = true;

    if (make && model && UK_MANUAL_VEHICLE_DATABASE[make]?.[model]) {
      const years = UK_MANUAL_VEHICLE_DATABASE[make][model].years || [];
      years.forEach((y) => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.append(opt);
      });
      yearSelect.disabled = false;
    } else {
      yearSelect.disabled = true;
    }
  });

  yearSelect.addEventListener('change', () => {
    const make = makeSelect.value;
    const model = modelSelect.value;
    engineSelect.innerHTML = '<option value="">Select Engine...</option>';
    submitBtn.disabled = true;

    if (make && model && UK_MANUAL_VEHICLE_DATABASE[make]?.[model]) {
      const engines = UK_MANUAL_VEHICLE_DATABASE[make][model].engines || [];
      engines.forEach((e) => {
        const opt = document.createElement('option');
        opt.value = e.name;
        opt.textContent = e.name;
        engineSelect.append(opt);
      });
      engineSelect.disabled = false;
    } else {
      engineSelect.disabled = true;
    }
  });

  engineSelect.addEventListener('change', () => {
    submitBtn.disabled = !engineSelect.value;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const make = makeSelect.value;
    const model = modelSelect.value;
    const year = yearSelect.value;
    const engine = engineSelect.value;

    if (!make || !model || !year || !engine) return;

    showPageLoader();
    selectManualVehicle(make, model, year, engine);

    // If on homepage or categories, navigate directly to PLP with this vehicle active
    const isCatalogPage = window.location.pathname.includes('plp') || window.location.pathname.includes('pdp');
    if (!isCatalogPage) {
      window.location.href = `/plp.html?category_id=5461&category_name=Braking`;
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
    <span class="vehicle-search-tag">VEHICLE COMPATIBILITY LOOKUP</span>
    <h2 class="vehicle-search-heading">Find Guaranteed Fit Parts For Your Car</h2>
    <p class="vehicle-search-description">Search by UK registration plate or select by make and model to filter 100% compatible parts.</p>
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
