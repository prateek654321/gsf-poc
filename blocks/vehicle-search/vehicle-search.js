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

  if (vehicle?.imageUrl) {
    const image = document.createElement('img');
    image.className = 'vehicle-search-image';
    image.src = vehicle.imageUrl;
    image.alt = displaySummary;
    image.loading = 'lazy';
    summaryEl.append(image);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'vehicle-search-image-placeholder';
    placeholder.textContent = '🚗';
    summaryEl.append(placeholder);
  }

  const details = document.createElement('div');
  details.className = 'vehicle-search-details';

  const title = document.createElement('p');
  title.className = 'vehicle-search-summary-text';
  title.textContent = displaySummary;

  const regBadge = document.createElement('div');
  regBadge.className = 'uk-plate';
  regBadge.innerHTML = `
    <span class="uk-plate-gb">GB</span>
    <span class="uk-plate-text">${vrm}</span>
  `;

  const fitBadge = document.createElement('span');
  fitBadge.className = 'badge-fitment fits';
  fitBadge.textContent = '✓ Guaranteed Fitment Active';

  details.append(regBadge, title, fitBadge);

  const actions = document.createElement('div');
  actions.className = 'vehicle-search-actions';

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'btn btn-outline btn-sm';
  changeBtn.textContent = 'Change Vehicle';
  changeBtn.addEventListener('click', () => {
    clearVehicleState();
  });

  actions.append(changeBtn);

  summaryEl.append(details, actions);
  container.append(summaryEl);
}

export default async function decorate(block) {
  const stored = getStoredVehicle();

  const inner = document.createElement('div');
  inner.className = 'vehicle-search-inner';

  const heading = document.createElement('h2');
  heading.className = 'vehicle-search-heading';
  heading.textContent = 'Find Parts for Your Vehicle';

  const description = document.createElement('p');
  description.className = 'vehicle-search-description';
  description.textContent = 'Enter your UK registration number to filter parts 100% guaranteed to fit.';

  const formContainer = document.createElement('div');
  formContainer.className = 'vehicle-search-form-wrapper';
  formContainer.hidden = Boolean(stored.hasVehicle);

  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'vehicle-search-summary-container';
  summaryContainer.hidden = !stored.hasVehicle;

  inner.append(heading, description, formContainer, summaryContainer);
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
    formContainer.hidden = true;
    renderVehicleSummary(summaryContainer, vrm, summary, vehicle);
  });

  window.addEventListener('vehicle-lookup:cleared', () => {
    summaryContainer.hidden = true;
    formContainer.hidden = false;
    const input = formContainer.querySelector('input');
    if (input) input.value = '';
    const msg = formContainer.querySelector('.vehicle-search-message');
    if (msg) msg.textContent = '';
  });
}
