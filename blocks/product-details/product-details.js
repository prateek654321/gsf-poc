import { fetchProductBySku } from '../../scripts/magento-api.js';
import {
  getStoredVehicle,
  checkCurrentVehicleFitment,
  lookupVrmAndFetchSkus,
} from '../../scripts/vehicle-lookup.js';

export default async function decorate(block) {
  block.innerHTML = `
    <div class="pdp-loading">
      <div class="pulsing-spinner"></div>
      <p class="loader-text">Loading product details...</p>
    </div>
  `;

  const urlParams = new URLSearchParams(window.location.search);
  const sku = urlParams.get('sku');

  if (!sku) {
    block.innerHTML = `
      <div class="pdp-error">
        <h2>Product Not Found</h2>
        <p>No SKU provided. Please select a product from our <a href="/plp.html">catalog</a>.</p>
      </div>
    `;
    return;
  }

  let product = null;
  try {
    product = await fetchProductBySku(sku);
  } catch (err) {
    console.error('Error fetching PDP product:', err);
  }

  if (!product) {
    block.innerHTML = `
      <div class="pdp-error">
        <h2>Product Unavailable</h2>
        <p>Unable to load product with SKU: <strong>${sku}</strong>.</p>
        <a href="/plp.html" class="btn btn-primary">Browse All Parts</a>
      </div>
    `;
    return;
  }

  const minPrice = product.price_range?.minimum_price?.final_price;
  const priceFormatted = minPrice ? `£${Number(minPrice.value).toFixed(2)}` : '';
  const imgUrl = product.thumbnail?.url || 'https://gsf-carparts-staging.agilecollab.com/media/catalog/product/placeholder/default/product_placeholder_2.png';
  const brand = product.extraVariable?.brand_info;

  block.innerHTML = `
    <div class="pdp-container">
      <!-- Breadcrumb -->
      <nav class="pdp-breadcrumbs">
        <a href="/">Home</a> <span>/</span>
        <a href="/plp.html">Parts</a> <span>/</span>
        <span class="breadcrumb-current">${product.name}</span>
      </nav>

      <div class="pdp-grid">
        <!-- Gallery -->
        <div class="pdp-gallery">
          <div class="pdp-main-image-wrapper">
            <img src="${imgUrl}" alt="${product.name}" class="pdp-main-image" />
          </div>
        </div>

        <!-- Buy Box & Fitment Section -->
        <div class="pdp-details">
          ${brand?.title ? `<div class="pdp-brand">${brand.title}</div>` : ''}
          <h1 class="pdp-title">${product.name}</h1>
          <div class="pdp-meta-bar">
            <span><strong>SKU:</strong> ${product.sku}</span>
            ${product.art_nr ? `<span><strong>Part No:</strong> ${product.art_nr}</span>` : ''}
          </div>

          <!-- Dynamic Vehicle Fitment Check Banner -->
          <div class="pdp-fitment-box"></div>

          <!-- Price & Purchase -->
          <div class="pdp-pricing">
            <div class="pdp-price">${priceFormatted}</div>
            <div class="pdp-vat">Including VAT</div>
          </div>

          <div class="pdp-purchase-actions">
            <div class="pdp-qty-wrapper">
              <label for="pdp-qty">Qty:</label>
              <select id="pdp-qty" class="pdp-qty-select">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <button type="button" class="btn btn-accent btn-add-to-cart">
              🛒 Add to Basket
            </button>
          </div>

          <div class="pdp-features">
            <div class="feature-item">✓ Fast UK Dispatch Available</div>
            <div class="feature-item">✓ 30-Day Easy Returns</div>
            <div class="feature-item">✓ 100% Genuine Quality Guaranteed</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const fitmentBox = block.querySelector('.pdp-fitment-box');

  async function updateFitmentStatus() {
    fitmentBox.innerHTML = '<div class="spinner"></div>';
    const status = await checkCurrentVehicleFitment(product.sku);

    if (status.hasVehicle) {
      if (status.isCompatible) {
        fitmentBox.className = 'pdp-fitment-box fits';
        fitmentBox.innerHTML = `
          <div class="fitment-header">
            <span class="fitment-icon">✓</span>
            <div>
              <strong>Guaranteed to Fit Your Vehicle</strong>
              <p>Confirmed compatible with <strong>${status.summary || status.vrm}</strong> (${status.vrm})</p>
            </div>
          </div>
        `;
      } else {
        fitmentBox.className = 'pdp-fitment-box not-fits';
        fitmentBox.innerHTML = `
          <div class="fitment-header">
            <span class="fitment-icon">✕</span>
            <div>
              <strong>Does Not Fit Your Vehicle</strong>
              <p>This part is not compatible with <strong>${status.summary || status.vrm}</strong>.</p>
            </div>
          </div>
        `;
      }
    } else {
      fitmentBox.className = 'pdp-fitment-box unverified';
      fitmentBox.innerHTML = `
        <div class="fitment-header">
          <span class="fitment-icon">ℹ</span>
          <div>
            <strong>Check If This Part Fits Your Vehicle</strong>
            <p>Enter your registration number below to verify compatibility before ordering.</p>
          </div>
        </div>
        <form class="pdp-vrm-inline-form">
          <div class="uk-plate" style="height: 42px;">
            <span class="uk-plate-gb">GB</span>
            <input type="text" placeholder="REG" class="pdp-inline-vrm-input" maxlength="8" />
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Check Fitment</button>
        </form>
        <div class="pdp-inline-vrm-error" style="display:none; color: var(--color-danger); font-size: 0.8125rem; margin-top: 0.5rem;"></div>
      `;

      const inlineForm = fitmentBox.querySelector('.pdp-vrm-inline-form');
      const inlineInput = fitmentBox.querySelector('.pdp-inline-vrm-input');
      const inlineError = fitmentBox.querySelector('.pdp-inline-vrm-error');

      inlineInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });

      inlineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vrm = inlineInput.value.trim();
        inlineError.style.display = 'none';

        if (!vrm) {
          inlineError.textContent = 'Please enter a registration number.';
          inlineError.style.display = 'block';
          return;
        }

        try {
          await lookupVrmAndFetchSkus(vrm);
          await updateFitmentStatus();
        } catch (err) {
          inlineError.textContent = err.message || 'Vehicle not found.';
          inlineError.style.display = 'block';
        }
      });
    }
  }

  // Initial fitment verification
  await updateFitmentStatus();

  // Listen to global vehicle events
  window.addEventListener('vehicle-lookup:updated', updateFitmentStatus);
  window.addEventListener('vehicle-lookup:cleared', updateFitmentStatus);

  // Add to basket alert demo
  block.querySelector('.btn-add-to-cart').addEventListener('click', () => {
    const qty = block.querySelector('#pdp-qty').value;
    alert(`Added ${qty} × ${product.name} (${product.sku}) to your basket!`);
  });
}
