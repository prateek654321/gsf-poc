import { fetchCategories } from '../../scripts/magento-api.js';
import { sanitizeSearchQuery, escapeHtml } from '../../scripts/sanitize.js';
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

  // 1. Official POC Architecture Banner
  const pocBar = document.createElement('div');
  pocBar.className = 'header-poc-bar';
  pocBar.innerHTML = `
    <div class="header-poc-inner">
      <div class="poc-badge-label">
        <span class="poc-pulse-dot"></span>
        <strong class="poc-title">AEM EDGE DELIVERY SERVICES (EDS) POC</strong>
        <span class="poc-sep">•</span>
        <span class="poc-desc">Headless Adobe Commerce & Live Vehicle Fitment Engine</span>
      </div>
      <div class="poc-metrics-strip">
        <span class="metric-pill">⚡ 100 PageSpeed</span>
        <span class="metric-pill">⏱️ &lt;100ms TTFB</span>
        <span class="metric-pill">🚗 Live DVLA / Magento Fitment</span>
      </div>
    </div>
  `;

  // 2. GSF Customer Benefits Strip (matching gsfcarparts.com)
  const promoStrip = document.createElement('div');
  promoStrip.className = 'header-promo-strip';
  promoStrip.innerHTML = `
    <div class="header-promo-inner">
      <span class="promo-item">🚚 <strong>Free UK Delivery</strong> on orders over £25*</span>
      <span class="promo-sep">•</span>
      <span class="promo-item">⏱️ <strong>Click & Collect</strong> in 30 Mins (180+ Branches)</span>
      <span class="promo-sep">•</span>
      <span class="promo-item">🔄 <strong>60 Day Returns</strong> Guarantee</span>
      <span class="promo-sep">•</span>
      <span class="promo-item">⭐ <strong>Rated 4.5/5</strong> on Trustpilot</span>
    </div>
  `;

  // 3. Main Brand Row
  const brandBar = document.createElement('div');
  brandBar.className = 'header-brand-bar';

  // Authentic GSF Red Logo Block + Rebrand Tagline + POC tag
  const logo = document.createElement('a');
  logo.href = '/';
  logo.className = 'header-logo';
  logo.title = 'GSF Car Parts — Home';
  logo.innerHTML = `
    <div class="logo-box">
      <div class="logo-badge-red">GSF</div>
      <div class="logo-text-block">
        <span class="logo-sub">CAR PARTS</span>
        <span class="logo-strapline">DO YOURSELF PROUD</span>
      </div>
      <span class="logo-poc-pill">POC</span>
    </div>
  `;

  const urlParams = new URLSearchParams(window.location.search);
  const rawQ = urlParams.get('q') || urlParams.get('search') || '';
  const currentQ = sanitizeSearchQuery(rawQ);

  const searchForm = document.createElement('form');
  searchForm.className = 'header-search-form';
  searchForm.innerHTML = `
    <input type="search" placeholder="Search by part name, brand or SKU..." class="header-search-input" value="${escapeHtml(currentQ)}" />
    <button type="submit" class="header-search-btn">
      <span>Search</span>
    </button>
  `;
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = sanitizeSearchQuery(searchForm.querySelector('input').value);
    if (query) {
      window.location.href = `/plp.html?q=${encodeURIComponent(query)}`;
    } else if (window.location.pathname.includes('plp.html')) {
      window.location.href = '/plp.html';
    }
  });

  // Store Finder / Branches Link
  const branchLink = document.createElement('a');
  branchLink.href = '#';
  branchLink.className = 'header-branch-link';
  branchLink.title = 'Find a GSF Car Parts branch near you';
  branchLink.innerHTML = `
    <span class="branch-icon">📍</span>
    <div class="branch-text-wrap">
      <span class="branch-title">Find Branch</span>
      <span class="branch-sub">180+ Stores</span>
    </div>
  `;

  // "My Garage" Multi-Vehicle Switcher Widget
  const garageWidget = document.createElement('div');
  garageWidget.className = 'header-garage-widget';

  function renderGarageWidget(container) {
    const stored = getStoredVehicle();
    const garage = getGarageVehicles();
    const hasActive = Boolean(stored.hasVehicle);
    const isManualActive = Boolean(stored.vehicle?.isManualSelect || !stored.vrm);

    const activeDisplay = hasActive
      ? (isManualActive
        ? `${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''} ${stored.vehicle?.year ? `(${stored.vehicle.year})` : ''}`.trim()
        : `${formatPlateDisplay(stored.vrm)} • ${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}`.trim())
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
            const isItemManual = Boolean(v.vehicle?.isManualSelect || !v.vrm);
            const isActive = hasActive && (
              (!isItemManual && stored.vrm && normalizeVrm(v.vrm) === normalizeVrm(stored.vrm))
              || (isItemManual && isManualActive && v.summary === stored.summary)
            );
            const mot = (!isItemManual && v.vrm) ? (v.motHealth || getVehicleMotAndHealth(v.vrm, v.vehicle?.year)) : null;
            const itemKey = v.id || v.vrm || v.summary;

            return `
              <div class="garage-vehicle-card ${isActive ? 'is-active' : ''}">
                <div class="garage-card-main-col">
                  <div class="garage-plate-row">
                    ${!isItemManual && v.vrm ? `
                      <div class="garage-plate-pill">
                        <span class="plate-gb">GB</span>
                        <span class="plate-text">${formatPlateDisplay(v.vrm)}</span>
                      </div>
                    ` : `
                      <div class="garage-manual-pill">
                        <span class="manual-icon">🚗</span>
                        <span class="manual-text">${v.vehicle?.make || ''} ${v.vehicle?.model || ''}</span>
                      </div>
                    `}
                    ${isActive ? '<span class="garage-status-active">✓ Active</span>' : ''}
                  </div>
                  <div class="garage-vehicle-name">${v.vehicle?.make || ''} ${v.vehicle?.model || ''}</div>
                  <div class="garage-vehicle-meta">${v.summary || ''}</div>
                  <div class="garage-health-tags">
                    ${mot ? `
                      <span class="garage-mot-pill ${mot.isUrgent ? 'urgent' : 'valid'}">
                        ${mot.isUrgent ? '⚠️' : '🟢'} MOT: ${mot.motExpiry} (${mot.daysLeft}d)
                      </span>
                      <span class="garage-mileage-pill">🛣️ ${mot.mileage}</span>
                    ` : `
                      <span class="garage-mot-pill valid">🟢 Guaranteed Fit Active</span>
                      ${v.vehicle?.year ? `<span class="garage-mileage-pill">📅 Year ${v.vehicle.year}</span>` : ''}
                    `}
                  </div>
                </div>
                <div class="garage-card-actions">
                  <a href="/plp.html?category_id=5461&category_name=Braking${v.vrm ? `&vrm=${v.vrm}` : ''}" class="btn-garage-shop" title="Shop braking and service parts">Shop Parts ➔</a>
                  ${!isActive ? `<button type="button" class="btn-select-garage-vehicle" data-id="${itemKey}" title="Switch to this vehicle">Select</button>` : ''}
                  <button type="button" class="btn-remove-garage-vehicle" data-id="${itemKey}" title="Remove from garage">✕</button>
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
        const targetId = selectBtn.dataset.id || selectBtn.dataset.vrm;
        selectGarageVehicle(targetId);
        dropdown.style.display = 'none';
        renderGarageWidget(container);
      });
    });

    // Remove vehicle
    container.querySelectorAll('.btn-remove-garage-vehicle').forEach((removeBtn) => {
      removeBtn.addEventListener('click', () => {
        const targetId = removeBtn.dataset.id || removeBtn.dataset.vrm;
        removeFromGarage(targetId);
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

  // User Actions (Sign in, Basket)
  const actions = document.createElement('div');
  actions.className = 'header-actions';
  actions.innerHTML = `
    <a href="#" class="header-action-item header-account-link" title="My Account">
      <span class="action-icon">👤</span>
      <span class="action-label">Sign In</span>
    </a>
    <div class="header-basket header-action-item" title="View Shopping Basket">
      <span class="action-icon">🛒</span>
      <div class="basket-text-wrap">
        <span class="basket-title">Basket</span>
        <span class="basket-amount">£0.00</span>
      </div>
    </div>
  `;

  brandBar.append(logo, searchForm, branchLink, garageWidget, actions);

  // 4. Navigation Bar (GSF Corporate Navy #002F6E)
  const navBar = document.createElement('nav');
  navBar.className = 'header-nav-bar';

  const navContainer = document.createElement('div');
  navContainer.className = 'header-nav-container';

  const navList = document.createElement('ul');
  navList.className = 'header-nav-list';

  navContainer.append(navList);
  navBar.append(navContainer);

  block.append(pocBar, promoStrip, brandBar, navBar);

  // Initial instant default navigation (prevents layout shift / blank navbar while hydrating)
  navList.innerHTML = `
    <li class="header-nav-item"><a href="/plp.html?category_id=5278&category_name=Service%20Parts" class="header-nav-link">Service Parts</a></li>
    <li class="header-nav-item"><a href="/plp.html?category_id=5461&category_name=Braking" class="header-nav-link">Braking</a></li>
    <li class="header-nav-item"><a href="/plp.html?category_id=5590&category_name=Steering%20%26%20Suspension" class="header-nav-link">Steering & Suspension</a></li>
    <li class="header-nav-item"><a href="/plp.html?category_id=5707&category_name=Engine%20Parts" class="header-nav-link">Engine Parts</a></li>
    <li class="header-nav-item deals-item"><a href="/plp.html?category_id=5461&category_name=Braking" class="header-nav-link deals-link">🔥 Deals & Offers</a></li>
    <li class="header-nav-item all-categories-item"><a href="/categories.html" class="header-nav-link all-categories-link">☰ All Categories</a></li>
  `;

  // Fetch Categories from Magento API or fast sessionStorage cache
  try {
    const rawCategories = await fetchCategories();

    const carParts = rawCategories.find((c) => c.name.toLowerCase().includes('car parts')) || rawCategories[0];
    const topItems = carParts?.children && carParts.children.length > 0
      ? carParts.children.slice(0, 7)
      : rawCategories.slice(0, 7);

    navList.innerHTML = '';

    topItems.forEach((cat) => {
      const item = document.createElement('li');
      item.className = 'header-nav-item';

      const link = document.createElement('a');
      link.className = 'header-nav-link';
      link.href = `/plp.html?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}`;
      link.textContent = cat.name;

      item.append(link);

      // Multi-level Mega-Menu Dropdown (Level 2 Subcategories + Level 3 Leaf Products)
      if (cat.children && cat.children.length > 0) {
        item.classList.add('has-dropdown');
        const dropdown = document.createElement('div');
        dropdown.className = 'header-nav-dropdown header-mega-menu';

        const megaGrid = document.createElement('div');
        megaGrid.className = 'mega-menu-grid';

        cat.children.slice(0, 5).forEach((sub) => {
          const col = document.createElement('div');
          col.className = 'mega-menu-col';

          // Level 2 Title
          const colTitle = document.createElement('h4');
          colTitle.className = 'mega-col-title';
          const subLink = document.createElement('a');
          subLink.href = `/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}`;
          subLink.textContent = sub.name;
          colTitle.append(subLink);
          col.append(colTitle);

          // Level 3 Leaf Products
          const leaves = sub.children && sub.children.length > 0 ? sub.children : [];
          if (leaves.length > 0) {
            const leafList = document.createElement('ul');
            leafList.className = 'mega-leaf-list';

            leaves.slice(0, 6).forEach((leaf) => {
              const leafItem = document.createElement('li');
              leafItem.className = 'mega-leaf-item';
              const leafLink = document.createElement('a');
              leafLink.href = `/plp.html?category_id=${leaf.id}&category_name=${encodeURIComponent(leaf.name)}`;
              leafLink.textContent = leaf.name;
              leafItem.append(leafLink);
              leafList.append(leafItem);
            });

            if (leaves.length > 6) {
              const viewAllItem = document.createElement('li');
              viewAllItem.className = 'mega-leaf-item mega-view-all';
              const viewAllLink = document.createElement('a');
              viewAllLink.href = `/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}`;
              viewAllLink.textContent = `All ${sub.name} →`;
              viewAllItem.append(viewAllLink);
              leafList.append(viewAllItem);
            }

            col.append(leafList);
          }

          megaGrid.append(col);
        });

        dropdown.append(megaGrid);
        item.append(dropdown);
      }

      navList.append(item);
    });

    // Deals & Clearance Item (Gold Highlight)
    const dealsItem = document.createElement('li');
    dealsItem.className = 'header-nav-item deals-item';
    dealsItem.innerHTML = `
      <a href="/plp.html?category_id=5461&category_name=Braking" class="header-nav-link deals-link">
        <span>🔥 Deals & Offers</span>
      </a>
    `;
    navList.append(dealsItem);

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
      <li class="header-nav-item deals-item"><a href="/plp.html?category_id=5461" class="header-nav-link deals-link">🔥 Deals & Offers</a></li>
      <li class="header-nav-item all-categories-item"><a href="/categories.html" class="header-nav-link all-categories-link">☰ All Categories</a></li>
    `;
  }
}
