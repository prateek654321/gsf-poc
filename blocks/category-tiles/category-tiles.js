export default async function decorate(block) {
  block.innerHTML = `
    <div class="category-tiles-grid">
      <a href="/plp.html?category_id=5278" class="category-tile">
        <span class="cat-icon">🔧</span>
        <span class="cat-title">Service Parts</span>
      </a>
      <a href="/plp.html?category_id=5461" class="category-tile">
        <span class="cat-icon">🛑</span>
        <span class="cat-title">Braking & Discs</span>
      </a>
      <a href="/plp.html?category_id=5590" class="category-tile">
        <span class="cat-icon">🚗</span>
        <span class="cat-title">Steering & Suspension</span>
      </a>
      <a href="/plp.html?category_id=5707" class="category-tile">
        <span class="cat-icon">⚙️</span>
        <span class="cat-title">Engine Parts</span>
      </a>
      <a href="/plp.html?category_id=5890" class="category-tile">
        <span class="cat-icon">🔩</span>
        <span class="cat-title">Transmission</span>
      </a>
      <a href="/plp.html?category_id=5986" class="category-tile">
        <span class="cat-icon">⚡</span>
        <span class="cat-title">Electrical & Batteries</span>
      </a>
    </div>
  `;
}
