import {
  getStoredVehicle,
  lookupVrmAndFetchSkus,
  clearVehicleState,
} from '../../scripts/vehicle-lookup.js';

function renderVehicleCard(container, data) {
  container.innerHTML = '';
  if (!data || !data.hasVehicle) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  const card = document.createElement('div');
  card.className = 'vrm-vehicle-card';

  const v = data.vehicle || {};
  const imageHtml = v.imageUrl
    ? `<img src="${v.imageUrl}" alt="${data.summary || 'Vehicle'}" class="vehicle-img" />`
    : `<div class="vehicle-img-placeholder">🚗</div>`;

  card.innerHTML = `
    <div class="vehicle-card-content">
      <div class="vehicle-card-media">
        ${imageHtml}
      </div>
      <div class="vehicle-card-details">
        <div class="uk-plate">
          <span class="uk-plate-gb">GB</span>
          <span class="uk-plate-text">${data.vrm}</span>
        </div>
        <h3 class="vehicle-title">${v.make || ''} ${v.model || ''}</h3>
        <p class="vehicle-subtitle">${data.summary || ''}</p>
        <span class="badge-fitment fits">✓ Filtering products for this vehicle</span>
      </div>
    </div>
    <div class="vehicle-card-actions">
      <button type="button" class="btn btn-outline btn-sm btn-clear-vehicle">Change Vehicle</button>
    </div>
  `;

  card.querySelector('.btn-clear-vehicle').addEventListener('click', () => {
    clearVehicleState();
  });

  container.append(card);
}

export default async function decorate(block) {
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'vrm-search-wrapper';

  const stored = getStoredVehicle();

  // Active Vehicle Display Container
  const activeVehicleContainer = document.createElement('div');
  activeVehicleContainer.className = 'vrm-active-vehicle';
  renderVehicleCard(activeVehicleContainer, stored);

  // Search Form Container
  const formContainer = document.createElement('div');
  formContainer.className = 'vrm-form-container';
  if (stored.hasVehicle) {
    formContainer.style.display = 'none';
  }

  formContainer.innerHTML = `
    <div class="vrm-form-header">
      <h2 class="vrm-heading">Find Parts That Fit Your Vehicle</h2>
      <p class="vrm-subheading">Enter your UK registration number to see 100% guaranteed compatible parts.</p>
    </div>
    <form class="vrm-form" novalidate>
      <div class="vrm-plate-input-wrapper">
        <span class="vrm-plate-prefix">GB</span>
        <input 
          type="text" 
          name="vrm" 
          class="vrm-input" 
          placeholder="ENTER REG" 
          maxlength="8" 
          autocomplete="off" 
          spellcheck="false"
          value="${stored.vrm || ''}"
        />
      </div>
      <button type="submit" class="btn btn-accent btn-find-parts">
        <span class="btn-text">FIND MY PARTS</span>
        <span class="btn-spinner spinner" style="display: none;"></span>
      </button>
    </form>
    <div class="vrm-message" role="alert" style="display: none;"></div>
  `;

  wrapper.append(activeVehicleContainer, formContainer);
  block.append(wrapper);

  const form = formContainer.querySelector('.vrm-form');
  const input = formContainer.querySelector('.vrm-input');
  const submitBtn = formContainer.querySelector('.btn-find-parts');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const messageBox = formContainer.querySelector('.vrm-message');

  // Input formatting
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vrm = input.value.trim();
    messageBox.style.display = 'none';
    messageBox.className = 'vrm-message';

    if (!vrm) {
      messageBox.textContent = 'Please enter your vehicle registration number.';
      messageBox.classList.add('error');
      messageBox.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';

    try {
      // Get categoryId from URL if on PLP
      const urlParams = new URLSearchParams(window.location.search);
      const categoryId = urlParams.get('category_id') || '';

      const result = await lookupVrmAndFetchSkus(vrm, categoryId);

      renderVehicleCard(activeVehicleContainer, { ...result, hasVehicle: true });
      formContainer.style.display = 'none';

      // If on homepage, redirect to PLP
      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        window.location.href = '/plp.html';
      }
    } catch (err) {
      messageBox.textContent = err.message || 'Vehicle not found. Please verify your registration.';
      messageBox.classList.add('error');
      messageBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  });

  // React to vehicle state events
  window.addEventListener('vehicle-lookup:updated', (e) => {
    renderVehicleCard(activeVehicleContainer, { ...e.detail, hasVehicle: true });
    formContainer.style.display = 'none';
  });

  window.addEventListener('vehicle-lookup:cleared', () => {
    activeVehicleContainer.style.display = 'none';
    formContainer.style.display = 'block';
    input.value = '';
    messageBox.style.display = 'none';
  });
}
