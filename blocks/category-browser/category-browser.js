import { fetchCategories } from '../../scripts/magento-api.js';
import { sanitizeSearchQuery, escapeHtml } from '../../scripts/sanitize.js';

// Comprehensive icon mapping for automotive categories
const CATEGORY_ICONS = {
  'all car parts': '🚗',
  'car parts': '🚗',
  'parts': '🚗',
  'service parts': '🔧',
  'braking': '🛑',
  'brake': '🛑',
  'pads': '🛑',
  'discs': '🛑',
  'steering & suspension': '🏎️',
  'steering': '🏎️',
  'suspension': '🏎️',
  'shocks': '🏎️',
  'springs': '🏎️',
  'engine parts': '⚙️',
  'engine': '⚙️',
  'timing belt': '⚙️',
  'transmission': '🔩',
  'clutch': '🔩',
  'gearbox': '🔩',
  'electrical': '🔋',
  'batteries': '🔋',
  'battery': '🔋',
  'alternator': '⚡',
  'starter': '⚡',
  'lighting': '💡',
  'bulbs': '💡',
  'headlight': '💡',
  'body & exhaust': '🛡️',
  'body': '🛡️',
  'exhaust': '💨',
  'cooling & heating': '❄️',
  'cooling': '❄️',
  'heating': '🔥',
  'radiator': '❄️',
  'water pump': '💧',
  'fuel system': '⛽',
  'fuel': '⛽',
  'filters': '🌪️',
  'oil filter': '🛢️',
  'air filter': '💨',
  'cabin filter': '🍃',
  'oils': '🛢️',
  'lubricants': '🛢️',
  'wiper': '🌧️',
  'spark': '🔌',
  'glow': '🔌',
  'accessories': '🧼',
  'cleaning': '🧽',
  'detailing': '✨',
  'tools': '🧰',
  'workshop': '🔨',
  'performance': '⚡',
};

function getCategoryIcon(name) {
  const lower = (name || '').toLowerCase().trim();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📦';
}

export default async function decorate(block) {
  block.innerHTML = `
    <div class="category-browser-container">
      <div class="category-browser-header">
        <span class="cat-hero-tag">GSF CAR PARTS CATALOG</span>
        <h1>All Product Categories</h1>
        <p>Explore our complete catalog of car parts, tools, and accessories. Click any category or subcategory to browse products with guaranteed fitment.</p>
        
        <!-- Live Filter Box -->
        <div class="category-filter-box">
          <div class="category-search-wrapper">
            <span class="search-lens-icon">🔍</span>
            <input type="text" placeholder="Search across all categories (e.g. Brake Pads, Oil Filter, Battery)..." class="category-filter-input" aria-label="Search categories" />
            <button type="button" class="btn-clear-search" style="display:none;" title="Clear search">✕</button>
          </div>
        </div>
      </div>

      <!-- Parent Categories Section -->
      <div class="parent-categories-section">
        <div class="section-title-wrap">
          <h3 class="section-title">Select Department</h3>
          <span class="section-subtitle">Click a department to view subcategories or click "Shop All" to view products directly</span>
        </div>
        <div class="parent-categories-grid">
          <div class="loader-container">
            <div class="pulsing-spinner" style="width:36px; height:36px;"></div>
            <p class="loader-text">Loading catalog departments...</p>
          </div>
        </div>
      </div>

      <!-- Subcategories Drilldown Section -->
      <div class="subcategories-section">
        <div class="subcategories-header">
          <div class="subcategories-title-group">
            <span class="active-parent-icon">🚗</span>
            <div class="active-parent-text-wrap">
              <h2 class="active-parent-title">
                <a href="/plp.html" class="active-parent-link" title="Shop All in this department">Car Parts</a>
              </h2>
              <span class="active-parent-count"></span>
            </div>
          </div>
          <div class="subcategories-header-actions">
            <a href="/plp.html" class="btn-shop-department" title="Browse all products in this department">
              <span>Shop All In Department</span>
              <span class="btn-arrow">➔</span>
            </a>
          </div>
        </div>

        <div class="subcategories-grid"></div>
      </div>
    </div>
  `;

  const parentGrid = block.querySelector('.parent-categories-grid');
  const subGrid = block.querySelector('.subcategories-grid');
  const activeIcon = block.querySelector('.active-parent-icon');
  const activeTitle = block.querySelector('.active-parent-title');
  const activeLink = block.querySelector('.active-parent-link');
  const activeCount = block.querySelector('.active-parent-count');
  const shopDeptBtn = block.querySelector('.btn-shop-department');
  const filterInput = block.querySelector('.category-filter-input');
  const clearBtn = block.querySelector('.btn-clear-search');

  let allCategories = [];
  let selectedParent = null;

  function renderSubcategories(parentCat) {
    selectedParent = parentCat;
    const catName = parentCat.name || 'Products';
    const catId = parentCat.id || '';
    const icon = getCategoryIcon(catName);

    activeIcon.textContent = icon;
    activeLink.textContent = catName;
    activeLink.href = `/plp.html?category_id=${catId}&category_name=${encodeURIComponent(catName)}`;
    activeLink.title = `Browse all ${catName} products`;

    shopDeptBtn.href = `/plp.html?category_id=${catId}&category_name=${encodeURIComponent(catName)}`;
    shopDeptBtn.querySelector('span:first-child').textContent = `Shop All in ${catName}`;

    const subs = parentCat.children || [];
    activeCount.textContent = `(${subs.length} subcategories)`;

    subGrid.innerHTML = '';

    if (subs.length === 0) {
      subGrid.innerHTML = `
        <div class="no-subcategories">
          <p>No further subcategories found in <strong>${catName}</strong>.</p>
          <a href="/plp.html?category_id=${catId}&category_name=${encodeURIComponent(catName)}" class="btn-direct-shop">
            Browse All ${catName} Products ➔
          </a>
        </div>
      `;
      return;
    }

    subs.forEach((sub) => {
      const card = document.createElement('div');
      card.className = 'subcategory-card';
      card.tabIndex = 0;
      card.role = 'link';
      card.title = `Shop ${sub.name}`;

      const subIcon = getCategoryIcon(sub.name);
      const subUrl = `/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}`;

      // Card Header
      const header = document.createElement('div');
      header.className = 'sub-card-header';
      header.innerHTML = `
        <span class="sub-icon">${subIcon}</span>
        <h4 class="sub-title">
          <a href="${subUrl}" class="sub-title-link">${sub.name}</a>
        </h4>
        <span class="sub-arrow-icon" aria-hidden="true">➔</span>
      `;
      card.append(header);

      // Render 3rd-level children if present
      if (sub.children && sub.children.length > 0) {
        const childList = document.createElement('ul');
        childList.className = 'child-category-list';

        sub.children.forEach((child) => {
          const item = document.createElement('li');
          item.className = 'child-category-item';
          const childUrl = `/plp.html?category_id=${child.id}&category_name=${encodeURIComponent(child.name)}`;
          item.innerHTML = `
            <a href="${childUrl}" class="child-category-link" title="Shop ${child.name}">
              <span class="child-dot">•</span>
              <span class="child-name">${child.name}</span>
              <span class="child-arrow">➔</span>
            </a>
          `;
          childList.append(item);
        });

        card.append(childList);
      }

      // "View all" action footer
      const footer = document.createElement('div');
      footer.className = 'sub-card-footer';
      footer.innerHTML = `
        <a href="${subUrl}" class="sub-view-all" title="View all in ${sub.name}">
          <span>View All in ${sub.name}</span>
          <span class="footer-arrow">➔</span>
        </a>
      `;
      card.append(footer);

      // Make whole card clickable!
      card.addEventListener('click', (e) => {
        // If user explicitly clicked on a child link inside the card, let that specific link navigate
        const childAnchor = e.target.closest('.child-category-link');
        if (childAnchor) {
          return;
        }
        window.location.href = subUrl;
      });

      // Keyboard support
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          window.location.href = subUrl;
        }
      });

      subGrid.append(card);
    });
  }

  function renderParentCategories(categories) {
    parentGrid.innerHTML = '';

    categories.forEach((cat, index) => {
      const card = document.createElement('div');
      card.className = `parent-cat-card ${index === 0 ? 'active' : ''}`;
      card.dataset.id = cat.id;
      card.tabIndex = 0;
      card.role = 'button';
      card.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');

      const icon = getCategoryIcon(cat.name);
      const childCount = cat.children ? cat.children.length : 0;
      const catUrl = `/plp.html?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}`;

      card.innerHTML = `
        <span class="parent-cat-icon">${icon}</span>
        <div class="parent-cat-meta">
          <span class="parent-cat-name">${cat.name}</span>
          <span class="parent-cat-subcount">${childCount > 0 ? `${childCount} Subcategories` : 'Catalog Products'}</span>
        </div>
      `;

      // Clicking anywhere on the card selects this department
      card.addEventListener('click', () => {
        if (childCount === 0) {
          window.location.href = catUrl;
          return;
        }

        parentGrid.querySelectorAll('.parent-cat-card').forEach((c) => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('active');
        card.setAttribute('aria-pressed', 'true');
        renderSubcategories(cat);

        const subSection = block.querySelector('.subcategories-section');
        if (subSection && window.innerWidth < 768) {
          subSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      // Keyboard access
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });

      parentGrid.append(card);
    });

    if (categories.length > 0) {
      renderSubcategories(categories[0]);
    }
  }

  // Filter input logic with debounce and search across ALL levels
  filterInput.addEventListener('input', (e) => {
    const rawVal = e.target.value;
    const cleanTerm = sanitizeSearchQuery(rawVal);
    const term = cleanTerm.toLowerCase();
    clearBtn.style.display = rawVal.trim() ? 'block' : 'none';

    if (!term) {
      if (selectedParent) renderSubcategories(selectedParent);
      return;
    }

    // Search across ALL subcategories in the active parent and other parents
    const matchingSubs = [];
    const searchPool = selectedParent ? (selectedParent.children || []) : [];

    searchPool.forEach((sub) => {
      const matchSub = sub.name.toLowerCase().includes(term);
      const matchedChildren = (sub.children || []).filter((c) => c.name.toLowerCase().includes(term));

      if (matchSub || matchedChildren.length > 0) {
        matchingSubs.push({
          ...sub,
          matchedChildren: matchedChildren.length > 0 ? matchedChildren : sub.children,
        });
      }
    });

    subGrid.innerHTML = '';
    activeTitle.textContent = `Search results for "${cleanTerm}"`;
    activeCount.textContent = `(${matchingSubs.length} matching categories)`;
    shopDeptBtn.href = `/plp.html?q=${encodeURIComponent(cleanTerm)}`;
    shopDeptBtn.querySelector('span:first-child').textContent = `Search All Products for "${cleanTerm}"`;

    if (matchingSubs.length === 0) {
      subGrid.innerHTML = `
        <div class="no-matches">
          <p>No categories match "<strong>${escapeHtml(cleanTerm)}</strong>" in ${selectedParent?.name || 'this department'}.</p>
          <a href="/plp.html?q=${encodeURIComponent(cleanTerm)}" class="btn-direct-shop">
            Search All Products for "${escapeHtml(cleanTerm)}" ➔
          </a>
        </div>
      `;
      return;
    }

    matchingSubs.forEach((sub) => {
      const card = document.createElement('div');
      card.className = 'subcategory-card is-search-result';
      card.tabIndex = 0;
      card.role = 'link';
      card.title = `Shop ${sub.name}`;

      const icon = getCategoryIcon(sub.name);
      const subUrl = `/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}`;

      card.innerHTML = `
        <div class="sub-card-header">
          <span class="sub-icon">${icon}</span>
          <h4 class="sub-title">
            <a href="${subUrl}" class="sub-title-link">${sub.name}</a>
          </h4>
          <span class="sub-arrow-icon" aria-hidden="true">➔</span>
        </div>
      `;

      if (sub.matchedChildren && sub.matchedChildren.length > 0) {
        const childList = document.createElement('ul');
        childList.className = 'child-category-list';
        sub.matchedChildren.forEach((child) => {
          const item = document.createElement('li');
          item.className = 'child-category-item';
          const childUrl = `/plp.html?category_id=${child.id}&category_name=${encodeURIComponent(child.name)}`;
          item.innerHTML = `
            <a href="${childUrl}" class="child-category-link" title="Shop ${child.name}">
              <span class="child-dot">•</span>
              <span class="child-name">${child.name}</span>
              <span class="child-arrow">➔</span>
            </a>
          `;
          childList.append(item);
        });
        card.append(childList);
      }

      const footer = document.createElement('div');
      footer.className = 'sub-card-footer';
      footer.innerHTML = `
        <a href="${subUrl}" class="sub-view-all" title="View all in ${sub.name}">
          <span>View All in ${sub.name}</span>
          <span class="footer-arrow">➔</span>
        </a>
      `;
      card.append(footer);

      card.addEventListener('click', (e) => {
        const childAnchor = e.target.closest('.child-category-link');
        if (childAnchor) return;
        window.location.href = subUrl;
      });

      subGrid.append(card);
    });
  });

  clearBtn.addEventListener('click', () => {
    filterInput.value = '';
    clearBtn.style.display = 'none';
    if (selectedParent) renderSubcategories(selectedParent);
    filterInput.focus();
  });

  // Load and populate categories
  try {
    const raw = await fetchCategories();

    // Find main car parts umbrella category
    const carParts = raw.find((c) => c.name.toLowerCase().includes('car parts') && c.id == 5275)
      || raw.find((c) => c.name.toLowerCase().includes('car parts'));

    const departments = [];

    if (carParts && carParts.children && carParts.children.length > 0) {
      // 1. First card: All Car Parts (umbrella)
      departments.push({
        id: carParts.id,
        name: 'All Car Parts',
        children: carParts.children,
      });

      // 2. Direct automotive departments from Car Parts' children
      carParts.children.forEach((child) => {
        departments.push(child);
      });
    }

    // 3. Add other top-level departments (Tools, Accessories, Performance, Detailing)
    raw.forEach((cat) => {
      if (carParts && cat.id === carParts.id) return;
      // Filter out manufacturer specific buckets (e.g. Porsche Car Parts, Mothers Day) for clean UX
      const name = cat.name.toLowerCase();
      if (name.includes('car parts') || name.includes('mothers day') || name.includes('hot picks')) return;
      departments.push(cat);
    });

    allCategories = departments.length > 0 ? departments : raw;
    renderParentCategories(allCategories);
  } catch (err) {
    console.error('Failed to load category tree:', err);
    parentGrid.innerHTML = `
      <div class="error-container">
        <p class="error">Failed to load categories. Please check your connection or try again.</p>
        <button type="button" class="btn-retry" onclick="window.location.reload()">Retry Loading</button>
      </div>
    `;
  }
}
