import { fetchCategories } from '../../scripts/magento-api.js';
import { getStoredVehicle, clearVehicleState } from '../../scripts/vehicle-lookup.js';

export default async function decorate(block) {
  block.innerHTML = '';

  // 2. Main Brand Row
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

  const searchForm = document.createElement('form');
  searchForm.className = 'header-search-form';
  searchForm.innerHTML = `
    <input type="search" placeholder="Search by part name, brand or SKU..." class="header-search-input" />
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

  brandBar.append(logo, searchForm, actions);

  // 3. Navigation Bar (Strictly no horizontal scroll, fixed clean layout)
  const navBar = document.createElement('nav');
  navBar.className = 'header-nav-bar';

  const navContainer = document.createElement('div');
  navContainer.className = 'header-nav-container';

  const navList = document.createElement('ul');
  navList.className = 'header-nav-list';

  navContainer.append(navList);
  navBar.append(navContainer);

  block.append(vehicleBanner, brandBar, navBar);

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
