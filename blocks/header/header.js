import { fetchCategories } from '../../scripts/magento-api.js';
import {
  getStoredVehicle,
  getGarageVehicles,
  selectGarageVehicle,
  removeFromGarage,
  lookupVrmAndFetchSkus,
  clearVehicleState,
  formatPlateDisplay,
  normalizeVrm,
  getVehicleMotAndHealth,
} from '../../scripts/vehicle-lookup.js';

export default async function decorate(block) {
  block.innerHTML = '';

  // 1. Main Brand Row
  const brandBar = document.createElement('div');
  brandBar.className = 'header-brand-bar';

  const logo = document.createElement('a');
  logo.href = '/';
  logo.className = 'header-logo';
  logo.innerHTML = `
    <div class="logo-box">
      <span class="logo-gsf">GSF</span>
      <span class="logo-sub">CAR PARTS</span>
    </div>
  `;

  const urlParams = new URLSearchParams(window.location.search);
  const currentQ = urlParams.get('q') || urlParams.get('search') || '';

  const searchForm = document.createElement('form');
  searchForm.className = 'header-search-form';
  searchForm.innerHTML = `
    <input type="search" placeholder="Search by part name, brand or SKU..." class="header-search-input" value="${currentQ.replace(/"/g, '&quot;')}" />
    <button type="submit" class="header-search-btn">
      <span>Search</span>
    </button>
  `;
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchForm.querySelector('input').value.trim();
    if (query) {
      window.location.href = `/plp.html?q=${encodeURIComponent(query)}`;
    }
  });

  // "My Garage" Multi-Vehicle Switcher Widget
  const garageWidget = document.createElement('div');
  garageWidget.className = 'header-garage-widget';

  function renderGarageWidget(container) {
    const stored = getStoredVehicle();
    const garage = getGarageVehicles();
    const hasActive = Boolean(stored.hasVehicle && stored.vrm);

    const activeDisplay = hasActive
      ? `${formatPlateDisplay(stored.vrm)} • ${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}`.trim()
      : (garage.length > 0 ? `${garage.length} Saved Vehicles` : 'Add Vehicle');

    container.innerHTML = `
      <button type="button" class="header-garage-btn ${hasActive ? 'active-vehicle' : ''}" aria-expanded="false" title="My Garage - Manage saved vehicles">
        <span class="garage-icon">🚗</span>
        <div class="garage-text-wrap">
          <span class="garage-k">My Garage</span>
          <span class="garage-v">${activeDisplay}</span>
        </div>
        <span class="garage-chevron">▾</span>
      </button>
      <div class="header-garage-dropdown" style="display: none;">
        <div class="garage-dropdown-header">
          <div class="garage-title-row">
            <h4>🚗 My Garage</h4>
            <span class="garage-count-badge">${garage.length} Saved</span>
          </div>
          <p class="garage-subtitle">Switch active vehicle to filter guaranteed fit parts across the store.</p>
        </div>
        <div class="garage-vehicle-list">
          ${garage.length === 0 ? '<p class="garage-empty">No vehicles saved in your garage yet.</p>' : ''}
          ${garage.map((v) => {
            const isActive = hasActive && normalizeVrm(v.vrm) === normalizeVrm(stored.vrm);
            const mot = v.motHealth || getVehicleMotAndHealth(v.vrm, v.vehicle?.year);
            return `
              <div class="garage-vehicle-card ${isActive ? 'is-active' : ''}">
                <div class="garage-card-main-col">
                  <div class="garage-plate-row">
                    <div class="garage-plate-pill">
                      <span class="plate-gb">GB</span>
                      <span class="plate-text">${formatPlateDisplay(v.vrm)}</span>
                    </div>
                    ${isActive ? '<span class="garage-status-active">✓ Active</span>' : ''}
                  </div>
                  <div class="garage-vehicle-name">${v.vehicle?.make || ''} ${v.vehicle?.model || ''}</div>
                  <div class="garage-vehicle-meta">${v.summary || ''}</div>
                  <div class="garage-health-tags">
                    <span class="garage-mot-pill ${mot.isUrgent ? 'urgent' : 'valid'}">
                      ${mot.isUrgent ? '⚠️' : '🟢'} MOT: ${mot.motExpiry} (${mot.daysLeft}d)
                    </span>
                    <span class="garage-mileage-pill">🛣️ ${mot.mileage}</span>
                  </div>
                </div>
                <div class="garage-card-actions">
                  <a href="/plp.html?category_id=5461&category_name=Braking&vrm=${v.vrm}" class="btn-garage-shop" title="Shop braking and service parts">Shop Parts ➔</a>
                  ${!isActive ? `<button type="button" class="btn-select-garage-vehicle" data-vrm="${v.vrm}" title="Switch to this vehicle">Select</button>` : ''}
                  <button type="button" class="btn-remove-garage-vehicle" data-vrm="${v.vrm}" title="Remove from garage">✕</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="garage-quick-add">
          <form class="garage-add-form">
            <div class="uk-plate garage-plate-input-box">
              <span class="uk-plate-gb">GB</span>
              <input type="text" placeholder="ENTER REG" maxlength="9" class="garage-vrm-input uk-plate-text" />
            </div>
            <button type="submit" class="btn-garage-add">Add Vehicle</button>
          </form>
          <div class="garage-add-msg" style="display:none;"></div>
        </div>
        ${hasActive ? `
          <div class="garage-dropdown-footer">
            <button type="button" class="btn-clear-garage-active">Browse Without Vehicle (Clear Active)</button>
          </div>
        ` : ''}
      </div>
    `;

    const btn = container.querySelector('.header-garage-btn');
    const dropdown = container.querySelector('.header-garage-dropdown');
    const addForm = container.querySelector('.garage-add-form');
    const addInput = container.querySelector('.garage-vrm-input');
    const addMsg = container.querySelector('.garage-add-msg');
    const clearActiveBtn = container.querySelector('.btn-clear-garage-active');

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display !== 'none';
      dropdown.style.display = isOpen ? 'none' : 'block';
      btn.setAttribute('aria-expanded', String(!isOpen));
    });

    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Auto-format plate input
    if (addInput) {
      addInput.addEventListener('input', (e) => {
        const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        e.target.value = formatPlateDisplay(raw);
      });
    }

    // Switch vehicle
    container.querySelectorAll('.btn-select-garage-vehicle').forEach((selectBtn) => {
      selectBtn.addEventListener('click', () => {
        const { vrm } = selectBtn.dataset;
        selectGarageVehicle(vrm);
        dropdown.style.display = 'none';
        renderGarageWidget(container);
      });
    });

    // Remove vehicle
    container.querySelectorAll('.btn-remove-garage-vehicle').forEach((removeBtn) => {
      removeBtn.addEventListener('click', () => {
        const { vrm } = removeBtn.dataset;
        removeFromGarage(vrm);
        renderGarageWidget(container);
      });
    });

    // Quick add vehicle
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vrm = normalizeVrm(addInput.value);
        if (!vrm || vrm.length < 2) {
          addMsg.textContent = 'Please enter a valid UK registration plate.';
          addMsg.className = 'garage-add-msg error';
          addMsg.style.display = 'block';
          return;
        }

        addMsg.innerHTML = '<span class="pulsing-spinner" style="width:14px; height:14px; display:inline-block;"></span> Looking up DVLA...';
        addMsg.className = 'garage-add-msg loading';
        addMsg.style.display = 'block';

        try {
          await lookupVrmAndFetchSkus(vrm);
          addMsg.textContent = `✓ Added ${vrm} to your garage!`;
          addMsg.className = 'garage-add-msg success';
          setTimeout(() => {
            renderGarageWidget(container);
          }, 600);
        } catch (err) {
          addMsg.textContent = err.message || 'Vehicle not found.';
          addMsg.className = 'garage-add-msg error';
        }
      });
    }

    // Clear active vehicle
    if (clearActiveBtn) {
      clearActiveBtn.addEventListener('click', () => {
        clearVehicleState();
        dropdown.style.display = 'none';
        renderGarageWidget(container);
      });
    }
  }

  renderGarageWidget(garageWidget);

  window.addEventListener('vehicle-lookup:updated', () => renderGarageWidget(garageWidget));
  window.addEventListener('vehicle-lookup:cleared', () => renderGarageWidget(garageWidget));
  window.addEventListener('garage:updated', () => renderGarageWidget(garageWidget));

  document.addEventListener('click', () => {
    const dd = garageWidget.querySelector('.header-garage-dropdown');
    if (dd) dd.style.display = 'none';
  });

  const actions = document.createElement('div');
  actions.className = 'header-actions';
  actions.innerHTML = `
    <a href="/categories.html" class="header-action-item">
      <span class="action-icon">📂</span>
      <span class="action-label">All Categories</span>
    </a>
    <a href="/plp.html" class="header-action-item">
      <span class="action-icon">📦</span>
      <span class="action-label">All Parts</span>
    </a>
    <div class="header-basket header-action-item">
      <span class="action-icon">🛒</span>
      <span class="action-label">Basket</span>
    </div>
  `;

  brandBar.append(logo, searchForm, garageWidget, actions);

  // 2. Navigation Bar (Strictly no horizontal scroll, fixed clean layout)
  const navBar = document.createElement('nav');
  navBar.className = 'header-nav-bar';

  const navContainer = document.createElement('div');
  navContainer.className = 'header-nav-container';

  const navList = document.createElement('ul');
  navList.className = 'header-nav-list';

  navContainer.append(navList);
  navBar.append(navContainer);

  block.append(brandBar, navBar);

  // Fetch Categories and render limited primary items + "All Categories" link
  try {
    const rawCategories = await fetchCategories();

    // In GSF, "Car Parts" (id: 5275) has children like "Service Parts", "Braking", "Steering & Suspension", etc.
    // If the first item is "Car Parts" with many children, we can promote its main children to the top navbar!
    const carParts = rawCategories.find((c) => c.name.toLowerCase().includes('car parts')) || rawCategories[0];
    const topItems = carParts?.children && carParts.children.length > 0
      ? carParts.children.slice(0, 6)
      : rawCategories.slice(0, 6);

    navList.innerHTML = '';

    topItems.forEach((cat) => {
      const item = document.createElement('li');
      item.className = 'header-nav-item';

      const link = document.createElement('a');
      link.className = 'header-nav-link';
      link.href = `/plp.html?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}`;
      link.textContent = cat.name;

      item.append(link);

      // Subcategory dropdown
      if (cat.children && cat.children.length > 0) {
        item.classList.add('has-dropdown');
        const dropdown = document.createElement('div');
        dropdown.className = 'header-nav-dropdown';

        const subList = document.createElement('ul');
        subList.className = 'header-nav-sublist';

        cat.children.slice(0, 8).forEach((sub) => {
          const subItem = document.createElement('li');
          const subLink = document.createElement('a');
          subLink.href = `/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}`;
          subLink.textContent = sub.name;
          subItem.append(subLink);
          subList.append(subItem);
        });

        dropdown.append(subList);
        item.append(dropdown);
      }

      navList.append(item);
    });

    // Final menu item: "All Categories"
    const allCatItem = document.createElement('li');
    allCatItem.className = 'header-nav-item all-categories-item';
    allCatItem.innerHTML = `
      <a href="/categories.html" class="header-nav-link all-categories-link">
        <span>☰ All Categories</span>
      </a>
    `;
    navList.append(allCatItem);

  } catch (err) {
    console.error('Error rendering navigation categories:', err);
    navList.innerHTML = `
      <li class="header-nav-item"><a href="/plp.html?category_id=5278" class="header-nav-link">Service Parts</a></li>
      <li class="header-nav-item"><a href="/plp.html?category_id=5461" class="header-nav-link">Braking</a></li>
      <li class="header-nav-item"><a href="/plp.html?category_id=5590" class="header-nav-link">Steering & Suspension</a></li>
      <li class="header-nav-item"><a href="/plp.html?category_id=5707" class="header-nav-link">Engine Parts</a></li>
      <li class="header-nav-item all-categories-item"><a href="/categories.html" class="header-nav-link all-categories-link">☰ All Categories</a></li>
    `;
  }
}
