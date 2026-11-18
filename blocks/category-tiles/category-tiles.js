export default async function decorate(block) {
  const categories = [
    {
      name: 'Brake Pads & Discs',
      icon: '🛑',
      url: '/plp.html?category_id=5461&category_name=Braking',
      tag: 'Guaranteed Fit',
    },
    {
      name: 'Engine Oil & Fluids',
      icon: '🛢️',
      url: '/plp.html?category_id=5278&category_name=Engine%20Oil',
      tag: '5W-30 & 0W-20',
    },
    {
      name: 'Car Batteries',
      icon: '🔋',
      url: '/plp.html?category_id=5986&category_name=Car%20Batteries',
      tag: 'Stop/Start Ready',
    },
    {
      name: 'Oil & Air Filters',
      icon: '🔧',
      url: '/plp.html?category_id=5278&category_name=Service%20Parts',
      tag: 'OEM Quality',
    },
    {
      name: 'Steering & Suspension',
      icon: '⚙️',
      url: '/plp.html?category_id=5590&category_name=Steering%20%26%20Suspension',
      tag: 'Shocks & Arms',
    },
    {
      name: 'Wipers & Bulbs',
      icon: '💡',
      url: '/plp.html?category_id=5278&category_name=Wiper%20Blades',
      tag: 'Clear Vision',
    },
    {
      name: 'Spark & Glow Plugs',
      icon: '🔩',
      url: '/plp.html?category_id=5707&category_name=Engine%20Parts',
      tag: 'NGK & Bosch',
    },
    {
      name: 'Tools & Workshop',
      icon: '🧰',
      url: '/plp.html?q=tools',
      tag: 'Trade Grade',
    },
  ];

  block.innerHTML = `
    <div class="category-tiles-container">
      <div class="category-tiles-header">
        <div class="cat-header-title">
          <span class="cat-tag">SHOP BY PART TYPE</span>
          <h3>Popular Car Parts & Spares</h3>
        </div>
        <a href="/categories.html" class="cat-view-all">View All 100+ Categories ➔</a>
      </div>
      <div class="category-tiles-grid">
        ${categories.map((c) => `
          <a href="${c.url}" class="category-tile" title="Shop ${c.name}">
            <span class="cat-pill">${c.tag}</span>
            <span class="cat-icon">${c.icon}</span>
            <span class="cat-title">${c.name}</span>
            <span class="cat-arrow">Shop ➔</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}
