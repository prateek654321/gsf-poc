import { fetchCategories } from '../../scripts/magento-api.js';
import { getStoredVehicle, clearVehicleState } from '../../scripts/vehicle-lookup.js';

function renderActiveVehicleBanner(container) {
  const stored = getStoredVehicle();
  container.innerHTML = '';

  if (!stored.hasVehicle) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.className = 'active-vehicle-bar';

  const info = document.createElement('div');
  info.className = 'vehicle-info';

  const plate = document.createElement('div');
  plate.className = 'uk-plate';
  plate.innerHTML = `
    <span class="uk-plate-gb">GB</span>
    <span class="uk-plate-text">${stored.vrm}</span>
  `;

  const details = document.createElement('div');
  details.className = 'vehicle-details';
  details.textContent = stored.summary || `${stored.vehicle?.make || ''} ${stored.vehicle?.model || ''}`;

  info.append(plate, details);

  const actions = document.createElement('div');
  actions.className = 'vehicle-actions';

  const changeBtn = document.createElement('button');
  changeBtn.className = 'btn-clear';
  changeBtn.textContent = 'Change / Clear Vehicle';
  changeBtn.addEventListener('click', () => {
    clearVehicleState();
  });

  actions.append(changeBtn);
  container.append(info, actions);
}

export default async function decorate(block) {
  block.innerHTML = '';

  // 1. Sticky Vehicle Banner (updates dynamically)
  const vehicleBanner = document.createElement('div');
  vehicleBanner.className = 'header-vehicle-banner';
  renderActiveVehicleBanner(vehicleBanner);

  window.addEventListener('vehicle-lookup:updated', () => {
    renderActiveVehicleBanner(vehicleBanner);
  });
  window.addEventListener('vehicle-lookup:cleared', () => {
    renderActiveVehicleBanner(vehicleBanner);
  });

  // 2. Main Brand Bar
  const brandBar = document.createElement('div');
  brandBar.className = 'header-brand-bar';

  const logo = document.createElement('a');
  logo.href = '/';
  logo.className = 'header-logo';
  logo.innerHTML = `
    <span class="logo-gsf">GSF</span>
    <span class="logo-sub">CAR PARTS</span>
  `;

  const searchForm = document.createElement('form');
  searchForm.className = 'header-search-form';
  searchForm.innerHTML = `
    <input type="search" placeholder="Search by keyword, part number or brand..." class="header-search-input" />
    <button type="submit" class="header-search-btn">Search</button>
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
    <a href="/plp.html" class="header-nav-link">Shop Parts</a>
    <div class="header-basket">
      <span class="basket-icon">🛒</span>
      <span class="basket-text">Basket</span>
    </div>
  `;

  brandBar.append(logo, searchForm, actions);

  // 3. Category Navigation Menu (Dynamic from Magento GraphQL)
  const navBar = document.createElement('nav');
  navBar.className = 'header-nav-bar';

  const navList = document.createElement('ul');
  navList.className = 'header-nav-list';

  // Loading placeholder
  const loadingItem = document.createElement('li');
  loadingItem.className = 'header-nav-item loading';
  loadingItem.textContent = 'Loading categories...';
  navList.append(loadingItem);
  navBar.append(navList);

  block.append(vehicleBanner, brandBar, navBar);

  // Async load categories
  try {
    const categories = await fetchCategories();
    navList.innerHTML = '';

    categories.forEach((cat) => {
      const item = document.createElement('li');
      item.className = 'header-nav-item';

      const link = document.createElement('a');
      link.className = 'header-nav-link';
      link.href = `/plp.html?category_id=${cat.id}&category_name=${encodeURIComponent(cat.name)}`;
      link.textContent = cat.name;

      item.append(link);

      // If category has children, create dropdown
      if (cat.children && cat.children.length > 0) {
        item.classList.add('has-dropdown');

        const dropdown = document.createElement('div');
        dropdown.className = 'header-nav-dropdown';

        const subList = document.createElement('ul');
        subList.className = 'header-nav-sublist';

        cat.children.forEach((sub) => {
          const subItem = document.createElement('li');
          subItem.className = 'header-nav-subitem';

          const subLink = document.createElement('a');
          subLink.href = `/plp.html?category_id=${sub.id}&category_name=${encodeURIComponent(sub.name)}`;
          subLink.textContent = sub.name;
          subItem.append(subLink);

          // 3rd level items if any
          if (sub.children && sub.children.length > 0) {
            const level3List = document.createElement('ul');
            level3List.className = 'header-nav-level3';
            sub.children.slice(0, 5).forEach((l3) => {
              const l3Item = document.createElement('li');
              const l3Link = document.createElement('a');
              l3Link.href = `/plp.html?category_id=${l3.id}&category_name=${encodeURIComponent(l3.name)}`;
              l3Link.textContent = l3.name;
              l3Item.append(l3Link);
              level3List.append(l3Item);
            });
            subItem.append(level3List);
          }

          subList.append(subItem);
        });

        dropdown.append(subList);
        item.append(dropdown);
      }

      navList.append(item);
    });
  } catch (error) {
    console.error('Failed to load categories for navigation:', error);
    navList.innerHTML = `
      <li class="header-nav-item"><a href="/plp.html?category_id=5275" class="header-nav-link">Car Parts</a></li>
      <li class="header-nav-item"><a href="/plp.html?category_id=5278" class="header-nav-link">Service Parts</a></li>
      <li class="header-nav-item"><a href="/plp.html?category_id=5461" class="header-nav-link">Braking</a></li>
      <li class="header-nav-item"><a href="/plp.html?category_id=5707" class="header-nav-link">Engine Parts</a></li>
    `;
  }
}
