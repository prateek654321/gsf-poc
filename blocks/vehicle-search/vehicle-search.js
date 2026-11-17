import {
  formatVehicleSummary,
  getStoredVehicle,
  initVehicleLookup,
  clearVehicleState,
} from '../../scripts/vehicle-lookup.js';

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

  // Middle: Info
  const details = document.createElement('div');
  details.className = 'vehicle-search-details';

  const regBadge = document.createElement('div');
  regBadge.className = 'uk-plate mini';
  regBadge.innerHTML = `
    <span class="uk-plate-gb">GB</span>
    <span class="uk-plate-text">${vrm}</span>
  `;

  const title = document.createElement('h3');
  title.className = 'vehicle-search-summary-text';
  title.textContent = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || displaySummary;

  const specs = document.createElement('p');
  specs.className = 'vehicle-search-specs';
  specs.textContent = displaySummary;

  const fitBadge = document.createElement('span');
  fitBadge.className = 'badge-fitment fits';
  fitBadge.innerHTML = `✓ Active Vehicle: Catalog Filtered for ${vrm}`;

  details.append(regBadge, title, specs, fitBadge);

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

export default async function decorate(block) {
  const stored = getStoredVehicle();

  const inner = document.createElement('div');
  inner.className = 'vehicle-search-inner';

  const headingBox = document.createElement('div');
  headingBox.className = 'vehicle-search-header';
  headingBox.innerHTML = `
    <span class="vehicle-search-tag">REGISTRATION LOOKUP</span>
    <h2 class="vehicle-search-heading">Find Parts That Fit Your Vehicle</h2>
    <p class="vehicle-search-description">Enter your UK vehicle registration to see parts 100% guaranteed to fit.</p>
  `;

  const formContainer = document.createElement('div');
  formContainer.className = 'vehicle-search-form-wrapper';

  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'vehicle-search-summary-container';
  summaryContainer.hidden = !stored.hasVehicle;

  inner.append(headingBox, formContainer, summaryContainer);
  block.replaceChildren(inner);

  if (stored.hasVehicle) {
    renderVehicleSummary(
      summaryContainer,
      stored.vrm,
      stored.summary,
      stored.vehicle,
    );
  }

  await initVehicleLookup(formContainer, {
    inputId: 'vehicle-search-vrm-input',
    classPrefix: 'vehicle-search',
  });

  window.addEventListener('vehicle-lookup:updated', (event) => {
    const { vrm, summary, vehicle } = event.detail;
    summaryContainer.hidden = false;
    renderVehicleSummary(summaryContainer, vrm, summary, vehicle);
  });

  window.addEventListener('vehicle-lookup:cleared', () => {
    summaryContainer.hidden = true;
    const input = formContainer.querySelector('input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const msg = formContainer.querySelector('.vehicle-search-message');
    if (msg) msg.textContent = '';
  });
}
