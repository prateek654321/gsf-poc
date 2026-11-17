import { fetchCategories } from '../../scripts/magento-api.js';

// Default icons mapping for prominent parent categories
const CATEGORY_ICONS = {
  'car parts': '🚗',
  'parts': '🚗',
  'service parts': '🔧',
  'braking': '🛑',
  'steering & suspension': '🏎️',
  'engine parts': '⚙️',
  'transmission': '🔩',
  'electrical': '⚡',
  'lighting': '💡',
  'body & exhaust': '🛡️',
  'cooling & heating': '❄️',
  'fuel system': '⛽',
  'accessories': '🧰',
  'tools': '🔨',
  'oils': '🛢️',
};

function getCategoryIcon(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📦';
}

export default async function decorate(block) {
  block.innerHTML = `
    <div class="category-browser-container">
      <div class="category-browser-header">
        <h1>All Product Categories</h1>
        <p>Explore our complete catalog of car parts, tools, and accessories. Select a parent category to drill down.</p>
        
        <!-- Live Filter Box -->
        <div class="category-filter-box">
          <input type="text" placeholder="Filter categories by name..." class="category-filter-input" />
        </div>
      </div>

      <!-- Parent Categories Grid -->
      <div class="parent-categories-section">
        <h3 class="section-title">Select Department</h3>
        <div class="parent-categories-grid">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Subcategories Drilldown Section -->
      <div class="subcategories-section">
        <div class="subcategories-header">
          <h2 class="active-parent-title">Car Parts</h2>
          <span class="active-parent-count"></span>
        </div>
        <div class="subcategories-grid"></div>
      </div>
    </div>
  `;

  const parentGrid = block.querySelector('.parent-categories-grid');
  const subGrid = block.querySelector('.subcategories-grid');
  const activeTitle = block.querySelector('.active-parent-title');
  const activeCount = block.querySelector('.active-parent-count');
  const filterInput = block.querySelector('.category-filter-input');

  let allCategories = [];
  let selectedParent = null;

  function renderSubcategories(parentCat) {
    selectedParent = parentCat;
    activeTitle.textContent = parentCat.name;
    const subs = parentCat.children || [];
    activeCount.textContent = `(${subs.length} subcategories)`;

    subGrid.innerHTML = '';

    if (subs.length === 0) {
      subGrid.innerHTML = `
        <div class="no-subcategories">
          <p>No subcategories found. <a href="/plp.html?category_id=${parentCat.id}&category_name=${encodeURIComponent(parentCat.name)}" class="btn btn-primary">Browse All in ${parentCat.name}</a></p>
        </div>
      `;
      return;
    }

    subs.forEach((sub) => {
      const card = document.createElement('div');
      card.className = 'subcategory-card';

      const icon = getCategoryIcon(sub.name);

      const header = document.createElement('div');
      header.className = 'sub-card-header';
      header.innerHTML = `
        <span class="sub-icon">${icon}</span>
        <h4 class="sub-title">
          <a href="/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}">${sub.name}</a>
        </h4>
      `;

      card.append(header);

      // Render 3rd-level children
      if (sub.children && sub.children.length > 0) {
        const childList = document.createElement('ul');
        childList.className = 'child-category-list';

        sub.children.forEach((child) => {
          const item = document.createElement('li');
          item.innerHTML = `
            <a href="/plp.html?category_id=${child.id}&category_name=${encodeURIComponent(child.name)}">
              ${child.name}
            </a>
          `;
          childList.append(item);
        });

        card.append(childList);
      }

      // "View all" action
      const viewAll = document.createElement('a');
      viewAll.className = 'sub-view-all';
      viewAll.href = `/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}`;
      viewAll.innerHTML = `View All in ${sub.name} →`;
      card.append(viewAll);

      subGrid.append(card);
    });
  }

  function renderParentCategories(categories) {
    parentGrid.innerHTML = '';

    categories.forEach((cat, index) => {
      const card = document.createElement('div');
      card.className = `parent-cat-card ${index === 0 ? 'active' : ''}`;
      card.dataset.id = cat.id;

      const icon = getCategoryIcon(cat.name);
      const childCount = cat.children ? cat.children.length : 0;

      card.innerHTML = `
        <span class="parent-cat-icon">${icon}</span>
        <div class="parent-cat-meta">
          <span class="parent-cat-name">${cat.name}</span>
          <span class="parent-cat-subcount">${childCount} Subcategories</span>
        </div>
      `;

      card.addEventListener('click', () => {
        parentGrid.querySelectorAll('.parent-cat-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        renderSubcategories(cat);
      });

      parentGrid.append(card);
    });

    if (categories.length > 0) {
      renderSubcategories(categories[0]);
    }
  }

  // Filter input logic
  filterInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      if (selectedParent) renderSubcategories(selectedParent);
      return;
    }

    // Search across all subcategories in the active parent
    const subs = selectedParent?.children || [];
    const filtered = subs.filter((s) => {
      const matchSub = s.name.toLowerCase().includes(term);
      const matchChild = (s.children || []).some((c) => c.name.toLowerCase().includes(term));
      return matchSub || matchChild;
    });

    subGrid.innerHTML = '';
    if (filtered.length === 0) {
      subGrid.innerHTML = `<p class="no-matches">No categories match "${term}".</p>`;
      return;
    }

    filtered.forEach((sub) => {
      const card = document.createElement('div');
      card.className = 'subcategory-card';
      const icon = getCategoryIcon(sub.name);

      card.innerHTML = `
        <div class="sub-card-header">
          <span class="sub-icon">${icon}</span>
          <h4 class="sub-title">
            <a href="/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}">${sub.name}</a>
          </h4>
        </div>
      `;

      if (sub.children && sub.children.length > 0) {
        const childList = document.createElement('ul');
        childList.className = 'child-category-list';
        sub.children.forEach((child) => {
          const item = document.createElement('li');
          item.innerHTML = `
            <a href="/plp.html?category_id=${child.id}&category_name=${encodeURIComponent(child.name)}">
              ${child.name}
            </a>
          `;
          childList.append(item);
        });
        card.append(childList);
      }

      subGrid.append(card);
    });
  });

  // Load and populate
  try {
    const raw = await fetchCategories();

    // If top category is "Default Category", take its children
    allCategories = raw;
    const carParts = raw.find((c) => c.name.toLowerCase().includes('car parts'));
    if (carParts && carParts.children && carParts.children.length > 0) {
      // Show main divisions
      allCategories = [carParts, ...raw.filter((c) => c.id !== carParts.id)];
    }

    renderParentCategories(allCategories);
  } catch (err) {
    console.error('Failed to load category tree:', err);
    parentGrid.innerHTML = '<p class="error">Failed to load categories. Please try refreshing.</p>';
  }
}
