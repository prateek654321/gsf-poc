import {
  fetchCatalogProducts,
  getBrandName,
  isSkuFitted,
  getBrandNameFromQuality,
  isUniversalProduct,
} from '../../scripts/catalog-service.js';
import { getStoredVehicle, lookupVrmAndFetchSkus } from '../../scripts/vehicle-lookup.js';
import { getCategoryNavInfo } from '../../scripts/category-component-map.js?v=4';
import { getConfig } from '../../scripts/config.js';
import { showPageLoader, hidePageLoader } from '../../scripts/scripts.js';

function getSidebarSkeletonsHtml() {
  return `
    <div class="skeleton-facets" aria-busy="true" aria-label="Loading filters">
      ${[1, 2, 3].map(() => `
        <div class="skeleton-facet-group">
          <div class="skeleton-shimmer skeleton-facet-header"></div>
          <div class="skeleton-facet-items">
            <div class="skeleton-facet-item">
              <span class="skeleton-shimmer skeleton-checkbox-box"></span>
              <span class="skeleton-shimmer skeleton-facet-name" style="width: 65%;"></span>
              <span class="skeleton-shimmer skeleton-facet-count-badge"></span>
            </div>
            <div class="skeleton-facet-item">
              <span class="skeleton-shimmer skeleton-checkbox-box"></span>
              <span class="skeleton-shimmer skeleton-facet-name" style="width: 50%;"></span>
              <span class="skeleton-shimmer skeleton-facet-count-badge"></span>
            </div>
            <div class="skeleton-facet-item">
              <span class="skeleton-shimmer skeleton-checkbox-box"></span>
              <span class="skeleton-shimmer skeleton-facet-name" style="width: 75%;"></span>
              <span class="skeleton-shimmer skeleton-facet-count-badge"></span>
            </div>
            <div class="skeleton-facet-item">
              <span class="skeleton-shimmer skeleton-checkbox-box"></span>
              <span class="skeleton-shimmer skeleton-facet-name" style="width: 40%;"></span>
              <span class="skeleton-shimmer skeleton-facet-count-badge"></span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getProductGridSkeletonsHtml(count = 12) {
  return Array.from({ length: Math.min(count, 12) }).map(() => `
    <div class="skeleton-product-card" aria-busy="true" aria-label="Loading product card">
      <div class="skeleton-shimmer skeleton-media"></div>
      <div class="skeleton-info">
        <div class="skeleton-shimmer skeleton-brand-pill"></div>
        <div class="skeleton-shimmer skeleton-line skeleton-title-line-1"></div>
        <div class="skeleton-shimmer skeleton-line skeleton-title-line-2"></div>
        <div class="skeleton-shimmer skeleton-fitment-badge"></div>
        <div class="skeleton-shimmer skeleton-stock-line"></div>
        <div class="skeleton-bottom">
          <div class="skeleton-shimmer skeleton-price-pill"></div>
          <div class="skeleton-shimmer skeleton-button-pill"></div>
        </div>
      </div>
    </div>
  `).join('');
}

function getSubcategorySkeletonsHtml(count = 6) {
  return `
    <div class="subcat-cards-grid skeleton-grid" aria-busy="true" aria-label="Loading subcategories">
      ${Array.from({ length: count }).map(() => `
        <div class="subcat-card skeleton-subcat-card">
          <div class="subcat-card-header">
            <div class="skeleton-shimmer skeleton-subcat-icon"></div>
            <div class="skeleton-shimmer skeleton-subcat-tag"></div>
          </div>
          <div class="subcat-card-body">
            <div class="skeleton-shimmer skeleton-subcat-title"></div>
            <div class="skeleton-shimmer skeleton-subcat-desc-1"></div>
            <div class="skeleton-shimmer skeleton-subcat-desc-2"></div>
          </div>
          <div class="subcat-card-footer">
            <div class="skeleton-shimmer skeleton-subcat-btn"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export default async function decorate(block) {
  // Dynamic Configuration & URL state management
  const appConfig = getConfig();
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category_id') || '';
  const categoryName = urlParams.get('category_name') || '';
  const searchPhrase = urlParams.get('q') || urlParams.get('search') || '';
  let currentPage = parseInt(urlParams.get('page'), 10) || 1;
  let pageSize = parseInt(urlParams.get('pagesize'), 10) || appConfig.pageSizeDefault || 15;
  let sortField = 'position';
  let sortDir = 'ASC';
  let activeFilters = {};

  const initialNavInfo = getCategoryNavInfo(categoryId, categoryName);
  const isInitialParent = !initialNavInfo.isLeaf && !searchPhrase;
  const isInitialLeaf = !isInitialParent;

  block.innerHTML = `
    <div class="plp-layout ${isInitialParent ? 'is-subcategory-view' : ''}">
      <!-- Sidebar Filters (Only for Leaf Categories & Searches) -->
      <aside class="plp-sidebar" aria-label="Product Filters" ${isInitialParent ? 'style="display:none;"' : ''}>
        <div class="sidebar-header">
          <div class="sidebar-title-box">
            <span class="sidebar-icon">⚙️</span>
            <h3>Filter Parts</h3>
          </div>
          <button type="button" class="btn-clear-filters" style="display:none;" title="Clear all active filters">
            Clear All
          </button>
        </div>
        <div class="plp-facets-container">
          ${getSidebarSkeletonsHtml()}
        </div>
      </aside>

      <!-- Main Column -->
      <main class="plp-main">
        <!-- 3-Level Category Breadcrumbs -->
        <nav class="plp-category-breadcrumbs" aria-label="Category Breadcrumbs"></nav>

        <!-- Subcategory Quick Pills Bar (Visible on Leaf Categories) -->
        <div class="plp-subcategories-bar" style="display:none;"></div>

        <!-- Fitment Banner -->
        <div class="plp-fitment-alert" style="display:none;"></div>

        <!-- View Mode Segmented Controls (Vehicle Fit Products vs All Products) -->
        <div class="plp-view-mode-bar" ${!isInitialLeaf ? 'style="display:none;"' : ''}>
          <div class="view-mode-tabs" role="tablist" aria-label="Catalog View Mode">
            <button type="button" class="view-mode-tab tab-fitted" data-mode="fitted" role="tab" aria-selected="false">
              <span class="tab-icon">✓</span>
              <span class="tab-title">Vehicle Fit Products</span>
              <span class="tab-badge" id="tab-fitted-count">...</span>
            </button>
            <button type="button" class="view-mode-tab tab-all" data-mode="all" role="tab" aria-selected="false">
              <span class="tab-icon">📦</span>
              <span class="tab-title">All Products</span>
              <span class="tab-badge" id="tab-all-count">...</span>
            </button>
          </div>
        </div>

        <!-- Active Filter Pills -->
        <div class="plp-active-filters" style="display:none;"></div>

        <!-- Toolbar: Count, Search & Sort (Only for Leaf Categories) -->
        <div class="plp-toolbar" ${!isInitialLeaf ? 'style="display:none;"' : ''}>
          <div class="plp-results-count">
            <span class="skeleton-shimmer skeleton-line skeleton-count-shimmer" style="width: 220px; height: 18px; display: inline-block;"></span>
          </div>
          <div class="plp-toolbar-controls">
            <div class="plp-control-group">
              <label for="plp-sort-select">Sort By:</label>
              <select id="plp-sort-select" class="plp-select">
                <option value="position:ASC">Relevance</option>
                <option value="price:ASC">Price: Low to High</option>
                <option value="price:DESC">Price: High to Low</option>
                <option value="name:ASC">Name: A to Z</option>
              </select>
            </div>
            <div class="plp-control-group">
              <label for="plp-pagesize-select">Show:</label>
              <select id="plp-pagesize-select" class="plp-select">
                <option value="15">15 per page</option>
                <option value="30">30 per page</option>
                <option value="60">60 per page</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Content Grid: Holds either Subcategory Tiles or Product Cards -->
        <div class="plp-grid">
          ${!isInitialLeaf ? getSubcategorySkeletonsHtml(6) : getProductGridSkeletonsHtml(pageSize)}
        </div>

        <!-- Pagination -->
        <nav class="plp-pagination" aria-label="Catalog Pagination" style="display:none;"></nav>
      </main>
    </div>
  `;

  const plpLayout = block.querySelector('.plp-layout');
  const sidebar = block.querySelector('.plp-sidebar');
  const toolbar = block.querySelector('.plp-toolbar');
  const viewModeBar = block.querySelector('.plp-view-mode-bar');
  const fitmentAlert = block.querySelector('.plp-fitment-alert');
  const tabFitted = block.querySelector('.view-mode-tab.tab-fitted');
  const tabAll = block.querySelector('.view-mode-tab.tab-all');
  const countFittedEl = block.querySelector('#tab-fitted-count');
  const countAllEl = block.querySelector('#tab-all-count');
  const activeFiltersBar = block.querySelector('.plp-active-filters');
  const countEl = block.querySelector('.plp-results-count');
  const sortSelect = block.querySelector('#plp-sort-select');
  const pageSizeSelect = block.querySelector('#plp-pagesize-select');
  const grid = block.querySelector('.plp-grid');
  const pagination = block.querySelector('.plp-pagination');
  const facetsContainer = block.querySelector('.plp-facets-container');
  const clearFiltersBtn = block.querySelector('.btn-clear-filters');

  // View Mode: 'fitted' (default when vehicle is active) vs 'all' (all products)
  let initialStored = getStoredVehicle();
  const urlVrm = (urlParams.get('vrm') || '').trim();
  if (urlVrm && (!initialStored.hasVehicle || initialStored.vrm !== urlVrm)) {
    try {
      await lookupVrmAndFetchSkus(urlVrm, categoryId, categoryName);
      initialStored = getStoredVehicle();
    } catch (err) {
      console.warn('Auto VRM from URL failed:', err);
    }
  }
  let viewMode = initialStored.hasVehicle ? 'fitted' : 'all';

  pageSizeSelect.value = String(pageSize);

  function getSortObject() {
    return { [sortField]: sortDir };
  }

  function renderSkeletons(count = pageSize) {
    grid.innerHTML = getProductGridSkeletonsHtml(count);
  }

  function updateViewModeTabs(result) {
    const stored = getStoredVehicle();
    if (viewMode === 'fitted') {
      tabFitted.classList.add('active');
      tabFitted.setAttribute('aria-selected', 'true');
      tabAll.classList.remove('active');
      tabAll.setAttribute('aria-selected', 'false');
    } else {
      tabAll.classList.add('active');
      tabAll.setAttribute('aria-selected', 'true');
      tabFitted.classList.remove('active');
      tabFitted.setAttribute('aria-selected', 'false');
    }

    if (stored.hasVehicle) {
      countFittedEl.textContent = (result?.fittedCount ?? 0).toLocaleString();
      countAllEl.textContent = (result?.allCount || result?.total_count || 0).toLocaleString();
      tabFitted.title = `Showing parts guaranteed to fit ${stored.summary || stored.vrm}`;
      tabAll.title = 'Browse all products without vehicle filter';
    } else {
      countFittedEl.textContent = 'Enter Reg';
      countAllEl.textContent = (result?.total_count || 0).toLocaleString();
      tabFitted.title = 'Enter your UK registration to filter parts';
      tabAll.title = 'Showing all products in catalog';
    }
  }

  function renderCategoryNavigation(navInfo) {
    const breadcrumbsEl = block.querySelector('.plp-category-breadcrumbs');
    const subcatsEl = block.querySelector('.plp-subcategories-bar');
    const stored = getStoredVehicle();
    const vrmQuery = stored.vrm ? `&vrm=${encodeURIComponent(stored.vrm)}` : '';

    if (breadcrumbsEl && navInfo?.breadcrumbs?.length > 0) {
      breadcrumbsEl.innerHTML = navInfo.breadcrumbs.map((b, idx) => {
        const isLast = idx === navInfo.breadcrumbs.length - 1;
        if (isLast) {
          return `<span class="bc-current" aria-current="page">${b.name}</span>`;
        }
        return `<a href="${b.href}${vrmQuery}" class="bc-link">${b.name}</a><span class="bc-sep">/</span>`;
      }).join(' ');
    }

    // Quick pills bar is shown only on Leaf category pages for quick hopping between siblings
    const siblings = navInfo?.siblings || [];
    if (subcatsEl && navInfo.isLeaf && siblings.length > 1) {
      subcatsEl.style.display = 'flex';
      subcatsEl.innerHTML = `
        <span class="subcat-pills-label">Related Categories:</span>
        <div class="subcat-pills-list">
          ${siblings.map((sub) => {
            const isActive = String(sub.id) === String(categoryId) || sub.active;
            return `
              <a href="${sub.href}${vrmQuery}" class="subcat-pill ${isActive ? 'active' : ''}">
                <span>${sub.name}</span>
              </a>
            `;
          }).join('')}
        </div>
      `;
    } else if (subcatsEl) {
      subcatsEl.style.display = 'none';
    }
  }

  /**
   * Renders the Inner Subcategories Selection View for parent categories
   * Rule 1: If category has multi-level nested groups (e.g. Car Parts, Service Parts, Braking),
   *         render each direct subcategory as a SECTION HEADING and cards under it.
   * Rule 2: If category has only one level of child categories (e.g. Wiper Blades, Brake Pads & Discs, Filters),
   *         render cards DIRECTLY without headings, clickable to view products.
   */
  function renderSubcategorySelectionView(navInfo) {
    const stored = getStoredVehicle();
    const vrmQuery = stored.vrm ? `&vrm=${encodeURIComponent(stored.vrm)}` : '';
    const children = navInfo?.children || [];
    const isManual = Boolean(stored.vehicle?.isManualSelect || !stored.vrm);
    const vehicleLabel = isManual
      ? (stored.summary || `${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}`.trim())
      : `${stored.summary || stored.vrm} (${stored.vrm})`;

    // Hide PLP specific elements
    plpLayout.classList.add('is-subcategory-view');
    sidebar.style.display = 'none';
    toolbar.style.display = 'none';
    viewModeBar.style.display = 'none';
    pagination.style.display = 'none';
    activeFiltersBar.style.display = 'none';
    fitmentAlert.style.display = 'none';

    grid.className = 'subcat-view-container';

    // Helper to render an individual subcategory card
    function renderCard(c) {
      const cName = c.name || '';
      const cIcon = c.icon || (cName.toLowerCase().includes('disc') ? '💿' : (cName.toLowerCase().includes('caliper') ? '🗜️' : (cName.toLowerCase().includes('shoe') ? '🛞' : (cName.toLowerCase().includes('cable') ? '⛓️' : (cName.toLowerCase().includes('filter') ? '🔧' : (cName.toLowerCase().includes('oil') ? '🛢️' : (cName.toLowerCase().includes('plug') ? '⚡' : (cName.toLowerCase().includes('wiper') ? '🌧️' : (cName.toLowerCase().includes('battery') ? '🔋' : '🛑')))))))));
      const cTag = c.tag || 'Guaranteed Fit';
      const cDesc = c.desc || `Browse genuine and OEM ${cName} parts`;
      const actionText = c.hasChildren ? 'View Subcategories' : 'Shop Parts';

      return `
        <a href="${c.href || `/plp.html?category_id=${c.id}&category_name=${encodeURIComponent(cName)}`}${vrmQuery}" class="subcat-card" title="Browse ${cName}">
          <div class="subcat-card-header">
            <div class="subcat-icon-wrap">
              <span class="subcat-icon">${cIcon}</span>
            </div>
            <span class="subcat-pill">${cTag}</span>
          </div>
          <div class="subcat-card-body">
            <h3 class="subcat-card-title">${cName}</h3>
            <p class="subcat-card-desc">${cDesc}</p>
          </div>
          <div class="subcat-card-footer">
            <span class="subcat-action-text">${actionText}</span>
            <span class="subcat-arrow-icon">➔</span>
          </div>
        </a>
      `;
    }

    // Determine content: Grouped sections (Rule 1) or Direct Cards (Rule 2)
    let contentHtml = '';
    if (navInfo.hasNestedGroups && navInfo.groups && navInfo.groups.length > 0) {
      // RULE 1: Multi-level category -> Direct subcategories as SECTION HEADINGS with cards inside
      contentHtml = `
        <div class="subcat-groups-wrapper">
          ${navInfo.groups.map((group) => `
            <section class="subcat-group-section" aria-labelledby="subcat-group-${group.id}">
              <div class="subcat-group-header">
                <div class="subcat-group-title-wrap">
                  <span class="subcat-group-icon">${group.icon}</span>
                  <h2 id="subcat-group-${group.id}" class="subcat-group-title">${group.name}</h2>
                  <span class="subcat-group-count">(${group.items.length})</span>
                </div>
                <a href="${group.href}${vrmQuery}" class="subcat-group-viewall" title="View all ${group.name} subcategories">
                  <span>View all ${group.name}</span>
                  <span class="viewall-arrow">➔</span>
                </a>
              </div>
              <div class="subcat-cards-grid">
                ${group.items.map((item) => renderCard(item)).join('')}
              </div>
            </section>
          `).join('')}
        </div>
      `;
    } else {
      // RULE 2: Single level of children -> Show cards directly without heading
      contentHtml = `
        <div class="subcat-cards-grid">
          ${children.map((c) => renderCard(c)).join('')}
        </div>
      `;
    }

    const totalSubcatCount = navInfo.hasNestedGroups && navInfo.groups
      ? navInfo.groups.reduce((sum, g) => sum + g.items.length, 0)
      : children.length;

    grid.innerHTML = `
      <!-- Subcategory Hero Banner -->
      <div class="subcat-hero">
        <div class="subcat-hero-top">
          <span class="subcat-badge">${navInfo.level <= 1 ? 'Department' : 'Category'}</span>
          <span class="subcat-count-pill">${totalSubcatCount} Subcategories</span>
        </div>
        <h1 class="subcat-hero-title">${navInfo.current.name}</h1>
        <p class="subcat-hero-desc">${navInfo.current.desc || 'Select a subcategory below to view parts guaranteed to fit your vehicle.'}</p>
      </div>

      <!-- Vehicle Fitment Strip -->
      ${stored.hasVehicle ? `
        <div class="subcat-vehicle-banner">
          <div class="subcat-vehicle-icon">✓</div>
          <div class="subcat-vehicle-text">
            <strong>Guaranteed Fitment Active:</strong> Showing ${navInfo.current.name} categories verified to fit your 
            <strong>${vehicleLabel}</strong>. Select a part type below to view compatible products.
          </div>
        </div>
      ` : `
        <div class="subcat-vehicle-banner prompt">
          <div class="subcat-vehicle-icon">🚗</div>
          <div class="subcat-vehicle-text">
            <strong>Find parts guaranteed to fit:</strong> Enter your UK registration number above to filter only parts verified for your vehicle.
          </div>
        </div>
      `}

      <!-- Subcategories Content -->
      ${contentHtml}
    `;
  }

  function renderFitmentAlert() {
    const stored = getStoredVehicle();
    const isManual = Boolean(stored.vehicle?.isManualSelect || !stored.vrm);
    const vehicleLabel = isManual
      ? (stored.summary || `${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}`.trim())
      : `${stored.summary || stored.vrm} (${stored.vrm})`;

    if (stored.hasVehicle) {
      if (viewMode === 'fitted') {
        fitmentAlert.style.display = 'flex';
        fitmentAlert.className = 'plp-fitment-alert active';
        const categoryScopeText = categoryName ? `<strong>${categoryName}</strong> ` : '';
        fitmentAlert.innerHTML = `
          <div class="fitment-alert-badge">✓</div>
          <div class="fitment-alert-text">
            <strong>Guaranteed Fitment Active:</strong> Showing only ${categoryScopeText}parts verified to fit your 
            <strong>${vehicleLabel}</strong>.
          </div>
        `;
      } else {
        fitmentAlert.style.display = 'flex';
        fitmentAlert.className = 'plp-fitment-alert prompt';
        fitmentAlert.innerHTML = `
          <div class="fitment-alert-badge">📦</div>
          <div class="fitment-alert-text">
            <strong>Showing All Products:</strong> You are browsing all catalog items. Switch to 
            <button type="button" class="btn-link-switch-mode"><strong>Vehicle Fit Products</strong></button> to see only parts verified for your <strong>${vehicleLabel}</strong>.
          </div>
        `;
        const switchBtn = fitmentAlert.querySelector('.btn-link-switch-mode');
        if (switchBtn) {
          switchBtn.addEventListener('click', () => {
            viewMode = 'fitted';
            currentPage = 1;
            loadProducts();
          });
        }
      }
    } else {
      fitmentAlert.style.display = 'flex';
      fitmentAlert.className = 'plp-fitment-alert prompt';
      fitmentAlert.innerHTML = `
        <div class="fitment-alert-badge">🚗</div>
        <div class="fitment-alert-text">
          <strong>Find parts that fit 100%:</strong> Enter your UK registration number in the box above to filter only compatible parts.
        </div>
      `;
    }
  }

  function renderActiveFilterPills() {
    const activeKeys = Object.keys(activeFilters);
    if (activeKeys.length === 0) {
      activeFiltersBar.style.display = 'none';
      activeFiltersBar.innerHTML = '';
      clearFiltersBtn.style.display = 'none';
      return;
    }

    activeFiltersBar.style.display = 'flex';
    clearFiltersBtn.style.display = 'inline-block';

    let pillsHtml = '<span class="active-filters-label">Active Filters:</span>';

    activeKeys.forEach((code) => {
      activeFilters[code].forEach((val) => {
        let displayVal = val;
        if (code === 'quality' || code === 'brand') {
          displayVal = `Brand: ${getBrandNameFromQuality(val, val)}`;
        } else if (code === 'axle') {
          displayVal = `Placement: ${val}`;
        }
        pillsHtml += `
          <button type="button" class="filter-pill" data-code="${code}" data-val="${val}">
            <span>${displayVal}</span>
            <span class="pill-remove">✕</span>
          </button>
        `;
      });
    });

    pillsHtml += `
      <button type="button" class="btn-clear-all-pills">Clear All Filters</button>
    `;

    activeFiltersBar.innerHTML = pillsHtml;

    activeFiltersBar.querySelectorAll('.filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const { code, val } = btn.dataset;
        if (activeFilters[code]) {
          activeFilters[code] = activeFilters[code].filter((v) => v !== val);
          if (activeFilters[code].length === 0) delete activeFilters[code];
          currentPage = 1;
          loadProducts();
        }
      });
    });

    const clearAll = activeFiltersBar.querySelector('.btn-clear-all-pills');
    if (clearAll) {
      clearAll.addEventListener('click', () => {
        activeFilters = {};
        currentPage = 1;
        loadProducts();
      });
    }
  }

  function renderProductCard(p) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const minPrice = p.price_range?.minimum_price?.final_price;
    const priceVal = minPrice ? Number(minPrice.value) : 0;
    const priceText = priceVal > 0 ? `£${priceVal.toFixed(2)}` : 'POA';
    const exVatText = priceVal > 0 ? `£${(priceVal / 1.2).toFixed(2)} ex. VAT` : '';
    const imgUrl = p.thumbnail?.url || appConfig.placeholderImage;
    const brandInfo = p.extraVariable?.brand_info;
    const stored = getStoredVehicle();

    const isUniversal = isUniversalProduct(p, categoryId, categoryName);
    let fitmentBadgeHtml = '';

    if (isUniversal) {
      fitmentBadgeHtml = `
        <div class="badge-fitment universal">
          <span class="badge-icon">🌐</span>
          <span>Universal Fit – Fits All Vehicles</span>
        </div>`;
    } else if (stored.hasVehicle) {
      const isFitted = p.isCompatible
        || isSkuFitted(p.sku)
        || stored.validSkus?.some((s) => s.toUpperCase() === (p.sku || '').toUpperCase());

      const isManual = Boolean(stored.vehicle?.isManualSelect || !stored.vrm);
      const vehicleModelName = `${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}`.trim();
      const fitLabel = isManual
        ? `Fits ${vehicleModelName || 'Selected Vehicle'}`
        : `Fits ${vehicleModelName} (${stored.vrm})`.trim();
      const notFitLabel = isManual
        ? `Does not fit ${vehicleModelName || 'your vehicle'}`
        : `Does not fit ${stored.vrm}`;

      if (isFitted) {
        fitmentBadgeHtml = `
          <div class="badge-fitment fits">
            <span class="badge-icon">✓</span>
            <span>${fitLabel}</span>
          </div>`;
      } else if (viewMode === 'all') {
        fitmentBadgeHtml = `
          <div class="badge-fitment not-fitted">
            <span class="badge-icon">✕</span>
            <span>${notFitLabel}</span>
          </div>`;
      }
    }

    const displayBrand = getBrandName(p) || brandInfo?.title || 'GSF QUALITY APPROVED';

    card.innerHTML = `
      <div class="card-media">
        <a href="/pdp.html?sku=${encodeURIComponent(p.sku)}">
          <img src="${imgUrl}" alt="${p.name}" loading="lazy" />
        </a>
      </div>
      <div class="card-body">
        <span class="card-brand">${displayBrand}</span>
        <h4 class="card-title">
          <a href="/pdp.html?sku=${encodeURIComponent(p.sku)}">${p.name}</a>
        </h4>
        <div class="card-meta">
          <span class="meta-item"><span class="meta-label">SKU:</span> ${p.sku}</span>
          ${p.art_nr ? `<span class="meta-item"><span class="meta-label">Part No:</span> ${p.art_nr}</span>` : ''}
          ${p.axle && p.axle !== 'All / Universal' ? `
            <span class="meta-item meta-axle ${p.axle.toLowerCase().includes('front') ? 'front' : 'rear'}">
              🎯 ${p.axle}
            </span>
          ` : ''}
        </div>
        ${fitmentBadgeHtml}
        <div class="card-stock">
          <span class="stock-dot"></span> In Stock for Home Delivery or Click & Collect
        </div>
        <div class="card-footer">
          <div class="card-price">
            <span class="price-amount">${priceText}</span>
            <span class="price-vat">inc. VAT</span>
            ${exVatText ? `<span class="price-ex-vat">${exVatText}</span>` : ''}
          </div>
          <a href="/pdp.html?sku=${encodeURIComponent(p.sku)}" class="btn btn-primary btn-sm">
            <span>View Part</span>
            <span class="btn-arrow">→</span>
          </a>
        </div>
      </div>
    `;

    return card;
  }

  function renderFacets(aggregations) {
    facetsContainer.innerHTML = '';

    // Filter to clean automotive filters: Brand (quality), Placement (axle), and Price.
    // Category filter is removed as requested (category navigation handled via subcategory pages & breadcrumbs).
    const allowedCodes = ['quality', 'brand', 'price', 'axle'];
    const validAggs = (aggregations || []).filter((agg) => {
      const code = (agg.attribute_code || '').toLowerCase();
      const label = (agg.label || '').toLowerCase();
      if (code.includes('product_group') || label.includes('product group')) return false;
      if (code.includes('category') || label.includes('category')) return false;
      if (!allowedCodes.includes(code) && !label.includes('brand') && !label.includes('quality') && !label.includes('price') && !label.includes('axle')) return false;
      return agg.options && agg.options.length >= 2;
    });

    if (validAggs.length === 0) {
      facetsContainer.innerHTML = '<p class="no-facets">No filters available for current selection.</p>';
      renderActiveFilterPills();
      return;
    }

    validAggs.forEach((agg) => {
      const group = document.createElement('div');
      group.className = 'facet-group';

      const activeInGroup = activeFilters[agg.attribute_code] || [];
      const hasActive = activeInGroup.length > 0;
      const facetLabel = (agg.attribute_code === 'quality') ? 'Brand' : (agg.label || agg.attribute_code);

      const title = document.createElement('button');
      title.type = 'button';
      title.className = 'facet-accordion-header';
      title.innerHTML = `
        <span class="facet-title-text">${facetLabel}</span>
        <div class="facet-header-actions">
          ${hasActive ? `<span class="facet-active-count">${activeInGroup.length}</span>` : ''}
          <span class="facet-chevron">▾</span>
        </div>
      `;

      const content = document.createElement('div');
      content.className = 'facet-content';

      if (agg.options.length > 7) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'facet-filter-search';
        searchInput.placeholder = `Search ${facetLabel}...`;
        searchInput.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase();
          content.querySelectorAll('.facet-item').forEach((item) => {
            const labelText = item.querySelector('.facet-text').textContent.toLowerCase();
            item.style.display = labelText.includes(q) ? 'flex' : 'none';
          });
        });
        content.append(searchInput);
      }

      const list = document.createElement('ul');
      list.className = 'facet-list';

      agg.options.forEach((opt) => {
        const item = document.createElement('li');
        item.className = 'facet-item';

        const isChecked = activeInGroup.includes(String(opt.value));
        const displayLabel = (agg.attribute_code === 'quality')
          ? getBrandNameFromQuality(opt.value, opt.label)
          : (opt.label || opt.value);

        item.innerHTML = `
          <label class="facet-label">
            <input type="checkbox" value="${opt.value}" data-code="${agg.attribute_code}" ${isChecked ? 'checked' : ''} />
            <span class="custom-checkbox"></span>
            <span class="facet-text">${displayLabel}</span>
            <span class="facet-count">${opt.count}</span>
          </label>
        `;

        item.querySelector('input').addEventListener('change', (e) => {
          const code = e.target.dataset.code;
          const val = String(e.target.value);

          if (!activeFilters[code]) activeFilters[code] = [];

          if (e.target.checked) {
            activeFilters[code].push(val);
          } else {
            activeFilters[code] = activeFilters[code].filter((v) => v !== val);
            if (activeFilters[code].length === 0) delete activeFilters[code];
          }

          currentPage = 1;
          loadProducts();
        });

        list.append(item);
      });

      content.append(list);

      title.addEventListener('click', () => {
        const isCollapsed = group.classList.toggle('is-collapsed');
        title.querySelector('.facet-chevron').textContent = isCollapsed ? '▸' : '▾';
      });

      group.append(title, content);
      facetsContainer.append(group);
    });

    renderActiveFilterPills();
  }

  function renderPagination(totalCount) {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';

    // First page button
    if (currentPage > 2) {
      const firstBtn = document.createElement('button');
      firstBtn.className = 'page-btn nav-btn';
      firstBtn.innerHTML = '«';
      firstBtn.title = 'First Page';
      firstBtn.addEventListener('click', () => {
        currentPage = 1;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      });
      pagination.append(firstBtn);
    }

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev nav-btn';
    prevBtn.innerHTML = '‹ Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      }
    });
    pagination.append(prevBtn);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      const p1 = document.createElement('button');
      p1.className = 'page-btn';
      p1.textContent = '1';
      p1.addEventListener('click', () => {
        currentPage = 1;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      });
      pagination.append(p1);

      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'page-ellipsis';
        ellipsis.textContent = '...';
        pagination.append(ellipsis);
      }
    }

    for (let i = startPage; i <= endPage; i += 1) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = String(i);
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      });
      pagination.append(pageBtn);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'page-ellipsis';
        ellipsis.textContent = '...';
        pagination.append(ellipsis);
      }

      const pLast = document.createElement('button');
      pLast.className = 'page-btn';
      pLast.textContent = String(totalPages);
      pLast.addEventListener('click', () => {
        currentPage = totalPages;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      });
      pagination.append(pLast);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn next nav-btn';
    nextBtn.innerHTML = 'Next ›';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      }
    });
    pagination.append(nextBtn);

    // Last page button
    if (currentPage < totalPages - 1) {
      const lastBtn = document.createElement('button');
      lastBtn.className = 'page-btn nav-btn';
      lastBtn.innerHTML = '»';
      lastBtn.title = 'Last Page';
      lastBtn.addEventListener('click', () => {
        currentPage = totalPages;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      });
      pagination.append(lastBtn);
    }
  }

  async function loadProducts() {
    const navInfo = getCategoryNavInfo(categoryId, categoryName);
    const isParent = !navInfo.isLeaf && !searchPhrase;

    renderCategoryNavigation(navInfo);

    // If this is a parent category (has subcategories), render Inner Subcategory Grid
    if (isParent) {
      renderSubcategorySelectionView(navInfo);
      return;
    }

    // Leaf category: Render Product Cards & Filters
    plpLayout.classList.remove('is-subcategory-view');
    sidebar.style.display = '';
    toolbar.style.display = '';
    viewModeBar.style.display = '';
    grid.className = 'plp-grid';

    showPageLoader();
    grid.classList.add('loading');
    renderSkeletons(pageSize);
    renderFitmentAlert();
    countEl.innerHTML = '<span class="skeleton-shimmer skeleton-line skeleton-count-shimmer" style="width: 240px; height: 18px; display: inline-block;"></span>';
    if (facetsContainer && !facetsContainer.querySelector('.facet-group')) {
      facetsContainer.innerHTML = getSidebarSkeletonsHtml();
    }

    try {
      const result = await fetchCatalogProducts({
        categoryId: categoryId || null,
        categoryName: categoryName || null,
        searchPhrase: searchPhrase || null,
        sort: getSortObject(),
        page: currentPage,
        pageSize,
        filters: activeFilters,
        viewMode,
      });

      const total = result.total_count || 0;
      const items = result.items || [];
      const stored = getStoredVehicle();

      updateViewModeTabs(result);

      // Update count text based on viewMode and vehicle
      const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(currentPage * pageSize, total);

      if (viewMode === 'fitted' && stored.hasVehicle) {
        const scopeText = categoryName ? `${categoryName} ` : '';
        const isManual = Boolean(stored.vehicle?.isManualSelect || !stored.vrm);
        const targetLabel = isManual
          ? (result.vehicleSummary || `${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}`.trim() || 'Selected Vehicle')
          : `${result.vehicleSummary || result.vrm} (${result.vrm})`;
        countEl.innerHTML = `Showing <strong>${startItem}–${endItem}</strong> of <strong>${total.toLocaleString()}</strong> verified ${scopeText}parts for <strong>${targetLabel}</strong>`;
      } else if (stored.hasVehicle) {
        const scopeText = categoryName ? `in ${categoryName}` : 'in catalog';
        countEl.innerHTML = `Showing <strong>${startItem}–${endItem}</strong> of <strong>${total.toLocaleString()}</strong> parts ${scopeText} (All Products)`;
      } else if (searchPhrase) {
        countEl.innerHTML = `Showing <strong>${startItem}–${endItem}</strong> of <strong>${total.toLocaleString()}</strong> parts for "<strong>${searchPhrase}</strong>"`;
      } else {
        const scopeText = categoryName ? `in ${categoryName}` : '';
        countEl.innerHTML = `Showing <strong>${startItem}–${endItem}</strong> of <strong>${total.toLocaleString()}</strong> parts ${scopeText}`;
      }

      grid.innerHTML = '';
      if (items.length === 0) {
        grid.innerHTML = `
          <div class="plp-no-results">
            <div class="no-results-icon">🔍</div>
            <h3>No compatible parts found</h3>
            <p>Try clearing active filters, or clear your vehicle selection to browse all catalog items.</p>
            <button type="button" class="btn btn-primary btn-reset-search">Reset Filters</button>
          </div>
        `;
        const resetBtn = grid.querySelector('.btn-reset-search');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            activeFilters = {};
            currentPage = 1;
            loadProducts();
          });
        }
      } else {
        items.forEach((p) => {
          grid.append(renderProductCard(p));
        });
      }

      renderFacets(result.aggregations);
      renderPagination(total);
    } catch (err) {
      console.error('Failed to load products:', err);
      grid.innerHTML = `
        <div class="plp-error">
          <div class="error-icon">⚠️</div>
          <h3>Unable to load catalog products</h3>
          <p>${err.message}</p>
          <button type="button" class="btn btn-outline btn-retry">Retry</button>
        </div>
      `;
      const retryBtn = grid.querySelector('.btn-retry');
      if (retryBtn) retryBtn.addEventListener('click', () => loadProducts());
    } finally {
      hidePageLoader();
      grid.classList.remove('loading');
    }
  }

  // View Mode Tab Listeners
  tabFitted.addEventListener('click', () => {
    const stored = getStoredVehicle();
    if (!stored.hasVehicle) {
      const regInput = document.querySelector('#compact-vrm-input') || document.querySelector('.vrm-plate-input') || document.querySelector('.vehicle-search-input') || document.querySelector('#header-vrm-input');
      if (regInput) {
        regInput.focus();
        regInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (viewMode !== 'fitted') {
      viewMode = 'fitted';
      currentPage = 1;
      loadProducts();
    }
  });

  tabAll.addEventListener('click', () => {
    if (viewMode !== 'all') {
      viewMode = 'all';
      currentPage = 1;
      loadProducts();
    }
  });

  // Event Listeners for Controls
  sortSelect.addEventListener('change', (e) => {
    const [field, dir] = e.target.value.split(':');
    sortField = field;
    sortDir = dir;
    currentPage = 1;
    loadProducts();
  });

  pageSizeSelect.addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    loadProducts();
  });

  clearFiltersBtn.addEventListener('click', () => {
    activeFilters = {};
    currentPage = 1;
    loadProducts();
  });

  // Listen to vehicle updates
  window.addEventListener('vehicle-lookup:updated', () => {
    viewMode = 'fitted';
    currentPage = 1;
    loadProducts();
  });

  window.addEventListener('vehicle-lookup:cleared', () => {
    viewMode = 'all';
    currentPage = 1;
    loadProducts();
  });

  // Trigger non-blocking initial load so footer & eager lifecycle render immediately
  loadProducts();
}
