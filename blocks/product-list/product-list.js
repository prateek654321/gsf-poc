import { fetchProducts } from '../../scripts/magento-api.js';
import { getStoredVehicle } from '../../scripts/vehicle-lookup.js';

export default async function decorate(block) {
  block.innerHTML = `
    <div class="plp-layout">
      <!-- Sidebar Filters -->
      <aside class="plp-sidebar">
        <div class="sidebar-header">
          <h3>Filters</h3>
          <button type="button" class="btn-clear-filters" style="display:none;">Clear All</button>
        </div>
        <div class="plp-facets-container">
          <div class="facets-loading spinner"></div>
        </div>
      </aside>

      <!-- Main Results Column -->
      <main class="plp-main">
        <!-- Fitment Banner -->
        <div class="plp-fitment-alert" style="display:none;"></div>

        <!-- Toolbar: Count, Search & Sort -->
        <div class="plp-toolbar">
          <div class="plp-results-count">Loading products...</div>
          <div class="plp-toolbar-controls">
            <div class="plp-sort-control">
              <label for="plp-sort-select">Sort By:</label>
              <select id="plp-sort-select" class="plp-select">
                <option value="position:ASC">Relevance</option>
                <option value="price:ASC">Price: Low to High</option>
                <option value="price:DESC">Price: High to Low</option>
                <option value="name:ASC">Name: A to Z</option>
              </select>
            </div>
            <div class="plp-pagesize-control">
              <label for="plp-pagesize-select">Show:</label>
              <select id="plp-pagesize-select" class="plp-select">
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="plp-grid">
          <div class="plp-loading-spinner">
            <div class="spinner"></div>
            <p>Loading compatible products...</p>
          </div>
        </div>

        <!-- Pagination -->
        <nav class="plp-pagination" aria-label="Pagination" style="display:none;"></nav>
      </main>
    </div>
  `;

  const fitmentAlert = block.querySelector('.plp-fitment-alert');
  const countEl = block.querySelector('.plp-results-count');
  const sortSelect = block.querySelector('#plp-sort-select');
  const pageSizeSelect = block.querySelector('#plp-pagesize-select');
  const grid = block.querySelector('.plp-grid');
  const pagination = block.querySelector('.plp-pagination');
  const facetsContainer = block.querySelector('.plp-facets-container');
  const clearFiltersBtn = block.querySelector('.btn-clear-filters');

  // URL state management
  const urlParams = new URLSearchParams(window.location.search);
  let categoryId = urlParams.get('category_id') || '';
  let currentPage = parseInt(urlParams.get('page'), 10) || 1;
  let pageSize = parseInt(urlParams.get('pagesize'), 10) || 12;
  let sortField = 'position';
  let sortDir = 'ASC';
  let activeFilters = {};

  pageSizeSelect.value = String(pageSize);

  function getSortObject() {
    return { [sortField]: sortDir };
  }

  function renderFitmentAlert() {
    const stored = getStoredVehicle();
    if (stored.hasVehicle) {
      fitmentAlert.style.display = 'flex';
      fitmentAlert.className = 'plp-fitment-alert active';
      fitmentAlert.innerHTML = `
        <div class="fitment-alert-badge">✓</div>
        <div class="fitment-alert-text">
          <strong>Guaranteed Fitment Active:</strong> Showing parts confirmed to fit 
          <strong>${stored.summary || stored.vrm}</strong> (${stored.vrm}).
        </div>
      `;
    } else {
      fitmentAlert.style.display = 'flex';
      fitmentAlert.className = 'plp-fitment-alert prompt';
      fitmentAlert.innerHTML = `
        <div class="fitment-alert-badge">ℹ</div>
        <div class="fitment-alert-text">
          Enter your vehicle registration in the search bar above to filter parts 100% guaranteed to fit your car.
        </div>
      `;
    }
  }

  function renderProductCard(p) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const minPrice = p.price_range?.minimum_price?.final_price;
    const priceText = minPrice ? `£${Number(minPrice.value).toFixed(2)}` : '';
    const imgUrl = p.thumbnail?.url || 'https://gsf-carparts-staging.agilecollab.com/media/catalog/product/placeholder/default/product_placeholder_2.png';
    const brandInfo = p.extraVariable?.brand_info;
    const stored = getStoredVehicle();

    const fitmentBadgeHtml = stored.hasVehicle
      ? `<div class="badge-fitment fits">✓ Fits ${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}</div>`
      : '';

    card.innerHTML = `
      <div class="card-media">
        <a href="/pdp.html?sku=${encodeURIComponent(p.sku)}">
          <img src="${imgUrl}" alt="${p.name}" loading="lazy" />
        </a>
      </div>
      <div class="card-body">
        ${brandInfo?.title ? `<span class="card-brand">${brandInfo.title}</span>` : ''}
        <h4 class="card-title">
          <a href="/pdp.html?sku=${encodeURIComponent(p.sku)}">${p.name}</a>
        </h4>
        <div class="card-meta">
          <span class="meta-item"><strong>SKU:</strong> ${p.sku}</span>
          ${p.art_nr ? `<span class="meta-item"><strong>Part No:</strong> ${p.art_nr}</span>` : ''}
        </div>
        ${fitmentBadgeHtml}
        <div class="card-footer">
          <div class="card-price">
            <span class="price-amount">${priceText}</span>
            <span class="price-vat">inc. VAT</span>
          </div>
          <a href="/pdp.html?sku=${encodeURIComponent(p.sku)}" class="btn btn-primary btn-sm">View Part</a>
        </div>
      </div>
    `;

    return card;
  }

  function renderFacets(aggregations) {
    facetsContainer.innerHTML = '';
    if (!aggregations || aggregations.length === 0) {
      facetsContainer.innerHTML = '<p class="no-facets">No filters available</p>';
      return;
    }

    aggregations.forEach((agg) => {
      // Filter out empty or category aggregations from facet list
      if (!agg.options || agg.options.length === 0 || agg.attribute_code === 'category_id') return;

      const group = document.createElement('div');
      group.className = 'facet-group';

      const title = document.createElement('h4');
      title.className = 'facet-title';
      title.textContent = agg.label || agg.attribute_code;

      const list = document.createElement('ul');
      list.className = 'facet-list';

      agg.options.slice(0, 10).forEach((opt) => {
        const item = document.createElement('li');
        item.className = 'facet-item';

        const isChecked = activeFilters[agg.attribute_code]?.includes(String(opt.value));

        item.innerHTML = `
          <label class="facet-label">
            <input type="checkbox" value="${opt.value}" data-code="${agg.attribute_code}" ${isChecked ? 'checked' : ''} />
            <span class="facet-text">${opt.label || opt.value}</span>
            <span class="facet-count">(${opt.count})</span>
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

      group.append(title, list);
      facetsContainer.append(group);
    });

    const hasFilters = Object.keys(activeFilters).length > 0;
    clearFiltersBtn.style.display = hasFilters ? 'inline-block' : 'none';
  }

  function renderPagination(totalCount) {
    pagination.innerHTML = '';
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev';
    prevBtn.innerHTML = '← Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      }
    });
    pagination.append(prevBtn);

    // Page Numbers (sliding window)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

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

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn next';
    nextBtn.innerHTML = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        loadProducts();
        window.scrollTo({ top: block.offsetTop - 50, behavior: 'smooth' });
      }
    });
    pagination.append(nextBtn);
  }

  async function loadProducts() {
    grid.innerHTML = `
      <div class="plp-loading-spinner">
        <div class="spinner"></div>
        <p>Updating products...</p>
      </div>
    `;

    renderFitmentAlert();

    const stored = getStoredVehicle();
    const fitmentSkus = stored.hasVehicle && stored.validSkus && stored.validSkus.length > 0
      ? stored.validSkus
      : null;

    try {
      const result = await fetchProducts({
        categoryId: categoryId || null,
        skus: fitmentSkus,
        sort: getSortObject(),
        page: currentPage,
        pageSize,
        customFilters: activeFilters,
      });

      const total = result.total_count || 0;
      const items = result.items || [];

      // Update count text
      const startItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(currentPage * pageSize, total);
      countEl.textContent = `Showing ${startItem}–${endItem} of ${total.toLocaleString()} products`;

      grid.innerHTML = '';
      if (items.length === 0) {
        grid.innerHTML = `
          <div class="plp-no-results">
            <h3>No compatible parts found</h3>
            <p>Try adjusting your filters, or clear your vehicle selection to browse all catalog items.</p>
          </div>
        `;
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
          <p>Failed to load products. ${err.message}</p>
        </div>
      `;
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
