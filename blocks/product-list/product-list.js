import { fetchCatalogProducts, getBrandName } from '../../scripts/catalog-service.js';
import { getStoredVehicle } from '../../scripts/vehicle-lookup.js';
import { getConfig } from '../../scripts/config.js';

export default async function decorate(block) {
  block.innerHTML = `
    <div class="plp-layout">
      <!-- Sidebar Filters -->
      <aside class="plp-sidebar" aria-label="Product Filters">
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
          <div class="facets-loading">
            <div class="pulsing-spinner" style="width:32px; height:32px;"></div>
            <p>Loading filters...</p>
          </div>
        </div>
      </aside>

      <!-- Main Results Column -->
      <main class="plp-main">
        <!-- Fitment Banner -->
        <div class="plp-fitment-alert" style="display:none;"></div>

        <!-- Active Filter Pills -->
        <div class="plp-active-filters" style="display:none;"></div>

        <!-- Toolbar: Count, Search & Sort -->
        <div class="plp-toolbar">
          <div class="plp-results-count">
            <span class="count-skeleton">Loading catalog...</span>
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

        <!-- Product Grid -->
        <div class="plp-grid">
          <!-- Skeletons rendered by default -->
        </div>

        <!-- Pagination -->
        <nav class="plp-pagination" aria-label="Catalog Pagination" style="display:none;"></nav>
      </main>
    </div>
  `;

  const fitmentAlert = block.querySelector('.plp-fitment-alert');
  const activeFiltersBar = block.querySelector('.plp-active-filters');
  const countEl = block.querySelector('.plp-results-count');
  const sortSelect = block.querySelector('#plp-sort-select');
  const pageSizeSelect = block.querySelector('#plp-pagesize-select');
  const grid = block.querySelector('.plp-grid');
  const pagination = block.querySelector('.plp-pagination');
  const facetsContainer = block.querySelector('.plp-facets-container');
  const clearFiltersBtn = block.querySelector('.btn-clear-filters');

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

  pageSizeSelect.value = String(pageSize);

  function getSortObject() {
    return { [sortField]: sortDir };
  }

  function renderSkeletons(count = pageSize) {
    const cardSkeletons = Array.from({ length: Math.min(count, 15) }).map(() => `
      <div class="skeleton-product-card">
        <div class="skeleton-shimmer skeleton-media"></div>
        <div class="skeleton-info">
          <div class="skeleton-shimmer skeleton-tag"></div>
          <div class="skeleton-shimmer skeleton-line" style="width: 85%;"></div>
          <div class="skeleton-shimmer skeleton-line" style="width: 60%;"></div>
          <div class="skeleton-shimmer skeleton-line-sm" style="width: 40%; margin-top: 0.5rem;"></div>
          <div class="skeleton-bottom">
            <div class="skeleton-shimmer skeleton-price-pill"></div>
            <div class="skeleton-shimmer skeleton-button-pill"></div>
          </div>
        </div>
      </div>
    `).join('');

    grid.innerHTML = cardSkeletons;
  }

  function renderFitmentAlert() {
    const stored = getStoredVehicle();
    if (stored.hasVehicle) {
      fitmentAlert.style.display = 'flex';
      fitmentAlert.className = 'plp-fitment-alert active';
      const categoryScopeText = categoryName ? `<strong>${categoryName}</strong> ` : '';
      fitmentAlert.innerHTML = `
        <div class="fitment-alert-badge">✓</div>
        <div class="fitment-alert-text">
          <strong>Guaranteed Fitment Active:</strong> Showing ${categoryScopeText}parts verified to fit your 
          <strong>${stored.summary || stored.vrm}</strong> (${stored.vrm}).
        </div>
      `;
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
        pillsHtml += `
          <button type="button" class="filter-pill" data-code="${code}" data-val="${val}">
            <span>${val}</span>
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

    const fitmentBadgeHtml = stored.hasVehicle
      ? `<div class="badge-fitment fits">
           <span class="badge-icon">✓</span>
           <span>Fits ${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''} (${stored.vrm})</span>
         </div>`
      : '';

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

    // Filter to ONLY basic filter types (Brand & Price).
    // Strictly removes Category, Product Group, and all obscure technical filters.
    // Shows Brand filter only if at least 2 distinct brands are eligible.
    const allowedCodes = ['brand', 'manufacturer', 'price', 'quality'];
    const validAggs = (aggregations || []).filter((agg) => {
      const code = (agg.attribute_code || '').toLowerCase();
      const label = (agg.label || '').toLowerCase();
      if (code.includes('category') || label.includes('category')) return false;
      if (code.includes('product_group') || label.includes('product group')) return false;
      if (!allowedCodes.includes(code) && !label.includes('brand') && !label.includes('price')) return false;
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

      const title = document.createElement('button');
      title.type = 'button';
      title.className = 'facet-accordion-header';
      title.innerHTML = `
        <span class="facet-title-text">${agg.label || agg.attribute_code}</span>
        <div class="facet-header-actions">
          ${hasActive ? `<span class="facet-active-count">${activeInGroup.length}</span>` : ''}
          <span class="facet-chevron">▾</span>
        </div>
      `;

      const content = document.createElement('div');
      content.className = 'facet-content';

      // For facets with many options, provide a quick search filter
      if (agg.options.length > 7) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'facet-filter-search';
        searchInput.placeholder = `Search ${agg.label || 'options'}...`;
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

        item.innerHTML = `
          <label class="facet-label">
            <input type="checkbox" value="${opt.value}" data-code="${agg.attribute_code}" ${isChecked ? 'checked' : ''} />
            <span class="custom-checkbox"></span>
            <span class="facet-text">${opt.label || opt.value}</span>
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

      // Accordion toggle
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

    // Page Numbers with sliding window
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
    renderSkeletons(pageSize);
    renderFitmentAlert();

    try {
      const result = await fetchCatalogProducts({
        categoryId: categoryId || null,
        categoryName: categoryName || null,
        searchPhrase: searchPhrase || null,
        sort: getSortObject(),
        page: currentPage,
        pageSize,
        filters: activeFilters,
      });

      const total = result.total_count || 0;
      const items = result.items || [];

      // Update count text based on available / fitted products
      const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(currentPage * pageSize, total);

      if (result.hasVehicle) {
        const scopeText = categoryName ? `${categoryName} ` : '';
        countEl.innerHTML = `Showing <strong>${startItem}–${endItem}</strong> of <strong>${total.toLocaleString()}</strong> verified ${scopeText}parts for <strong>${result.vehicleSummary || result.vrm}</strong> (${result.vrm})`;
      } else if (searchPhrase) {
        countEl.innerHTML = `Showing <strong>${startItem}–${endItem}</strong> of <strong>${total.toLocaleString()}</strong> parts for "<strong>${searchPhrase}</strong>"`;
      } else {
        countEl.innerHTML = `Showing <strong>${startItem}–${endItem}</strong> of <strong>${total.toLocaleString()}</strong> parts`;
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
    }
  }

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
    currentPage = 1;
    loadProducts();
  });

  window.addEventListener('vehicle-lookup:cleared', () => {
    currentPage = 1;
    loadProducts();
  });

  // Initial load
  await loadProducts();
}
