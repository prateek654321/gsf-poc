import { fetchProductBySku } from '../../scripts/magento-api.js';
import { getConfig } from '../../scripts/config.js';
import {
  getStoredVehicle,
  checkCurrentVehicleFitment,
  lookupVrmAndFetchSkus,
} from '../../scripts/vehicle-lookup.js';
import { isUniversalProduct } from '../../scripts/catalog-service.js';

function renderPdpSkeleton() {
  return `
    <div class="pdp-container pdp-skeleton-container" aria-busy="true" aria-label="Loading product details">
      <!-- Breadcrumb Skeleton -->
      <nav class="pdp-breadcrumbs">
        <span class="skeleton-shimmer skeleton-bc-item" style="width: 50px;"></span>
        <span class="bc-sep">/</span>
        <span class="skeleton-shimmer skeleton-bc-item" style="width: 70px;"></span>
        <span class="bc-sep">/</span>
        <span class="skeleton-shimmer skeleton-bc-item active" style="width: 160px;"></span>
      </nav>

      <div class="pdp-grid">
        <!-- Gallery Skeleton -->
        <div class="pdp-gallery pdp-gallery-skeleton">
          <div class="skeleton-shimmer pdp-skeleton-main-img"></div>
          <div class="pdp-skeleton-thumbs">
            <div class="skeleton-shimmer pdp-skeleton-thumb"></div>
            <div class="skeleton-shimmer pdp-skeleton-thumb"></div>
            <div class="skeleton-shimmer pdp-skeleton-thumb"></div>
          </div>
        </div>

        <!-- Details Skeleton -->
        <div class="pdp-details pdp-details-skeleton">
          <div class="skeleton-shimmer pdp-skeleton-brand"></div>
          <div class="skeleton-shimmer pdp-skeleton-title pdp-skeleton-title-1"></div>
          <div class="skeleton-shimmer pdp-skeleton-title pdp-skeleton-title-2"></div>
          <div class="skeleton-shimmer pdp-skeleton-meta"></div>

          <!-- Fitment Box Skeleton -->
          <div class="skeleton-shimmer pdp-skeleton-fitment-box"></div>

          <!-- Price & VAT Skeleton -->
          <div class="pdp-skeleton-pricing">
            <div class="skeleton-shimmer pdp-skeleton-price"></div>
            <div class="skeleton-shimmer pdp-skeleton-vat"></div>
          </div>

          <!-- Action Button Skeleton -->
          <div class="pdp-skeleton-actions">
            <div class="skeleton-shimmer pdp-skeleton-qty"></div>
            <div class="skeleton-shimmer pdp-skeleton-btn"></div>
          </div>

          <!-- Feature Lines Skeleton -->
          <div class="pdp-skeleton-features">
            <div class="skeleton-shimmer pdp-skeleton-feature-line" style="width: 60%;"></div>
            <div class="skeleton-shimmer pdp-skeleton-feature-line" style="width: 45%;"></div>
            <div class="skeleton-shimmer pdp-skeleton-feature-line" style="width: 70%;"></div>
          </div>
        </div>
      </div>

      <!-- Additional Specs Skeleton -->
      <div class="pdp-skeleton-specs">
        <div class="pdp-skeleton-tabs">
          <div class="skeleton-shimmer pdp-skeleton-tab active"></div>
          <div class="skeleton-shimmer pdp-skeleton-tab"></div>
          <div class="skeleton-shimmer pdp-skeleton-tab"></div>
        </div>
        <div class="pdp-skeleton-table">
          <div class="skeleton-shimmer pdp-skeleton-row"></div>
          <div class="skeleton-shimmer pdp-skeleton-row"></div>
          <div class="skeleton-shimmer pdp-skeleton-row"></div>
          <div class="skeleton-shimmer pdp-skeleton-row"></div>
        </div>
      </div>
    </div>
  `;
}

export default async function decorate(block) {
  // Immediately render complete PDP skeleton layout
  block.innerHTML = renderPdpSkeleton();

  const urlParams = new URLSearchParams(window.location.search);
  const sku = urlParams.get('sku') || 'MPRMBP2285';

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

  const config = getConfig();
  const minPrice = product.price_range?.minimum_price?.final_price;
  const priceFormatted = minPrice ? `£${Number(minPrice.value).toFixed(2)}` : '';
  const imgUrl = product.thumbnail?.url || config.placeholderImage;
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
    fitmentBox.innerHTML = '<div class="skeleton-shimmer pdp-skeleton-fitment-inner"></div>';
    const categoryId = product.extraVariable?.breadcrumbs?.[0]?.id || '';
    const categoryName = product.extraVariable?.breadcrumbs?.[0]?.label || '';

    // Check if universal product
    const isUniversal = isUniversalProduct(product, categoryId, categoryName);
    if (isUniversal) {
      fitmentBox.className = 'pdp-fitment-box universal';
      fitmentBox.innerHTML = `
        <div class="fitment-header">
          <span class="fitment-icon">🌐</span>
          <div>
            <strong>Universal Part – Fits All Vehicles</strong>
            <p>This item is universal and suitable for all standard vehicles and workshop applications. No vehicle registration check required.</p>
          </div>
        </div>
      `;
      return;
    }

    const status = await checkCurrentVehicleFitment(product.sku, categoryId);

    if (status.hasVehicle) {
      const isManual = Boolean(status.vehicle?.isManualSelect || !status.vrm);
      const targetLabel = isManual
        ? (status.summary || `${status.vehicle?.make || ''} ${status.vehicle?.model || ''}`.trim())
        : `${status.summary || status.vrm} (${status.vrm})`;

      if (status.isCompatible) {
        fitmentBox.className = 'pdp-fitment-box fits';
        fitmentBox.innerHTML = `
          <div class="fitment-header">
            <span class="fitment-icon">✓</span>
            <div>
              <strong>Guaranteed to Fit Your Vehicle</strong>
              <p>Confirmed compatible with <strong>${targetLabel}</strong></p>
            </div>
          </div>
          <button type="button" class="btn-fitment-details-toggle" aria-expanded="false">
            <span class="details-toggle-icon">ℹ</span>
            <span class="details-toggle-text">Why does this fit? View Technical Specifications</span>
            <span class="details-toggle-chevron">▾</span>
          </button>
          <div class="fitment-specs-drawer" style="display: none;">
            <div class="specs-grid">
              <div class="spec-col">
                <h5 class="specs-col-heading">Verified Vehicle Match</h5>
                <ul class="specs-list">
                  ${!isManual && status.vrm ? `<li><span class="spec-lbl">Registration:</span> <span class="spec-val">${status.vrm}</span></li>` : ''}
                  <li><span class="spec-lbl">Vehicle:</span> <span class="spec-val">${status.vehicle?.make || ''} ${status.vehicle?.model || ''}</span></li>
                  <li><span class="spec-lbl">Engine / Fuel:</span> <span class="spec-val">${status.vehicle?.engineSize || ''} ${status.vehicle?.fuel || ''}</span></li>
                  <li><span class="spec-lbl">Year of Reg:</span> <span class="spec-val">${status.vehicle?.year || ''}</span></li>
                </ul>
              </div>
              <div class="spec-col">
                <h5 class="specs-col-heading">Technical Part Specifications</h5>
                <ul class="specs-list">
                  <li><span class="spec-lbl">SKU / MPN:</span> <span class="spec-val">${product.sku}</span></li>
                  ${product.art_nr ? `<li><span class="spec-lbl">Part Number:</span> <span class="spec-val">${product.art_nr}</span></li>` : ''}
                  <li><span class="spec-lbl">Component Group:</span> <span class="spec-val">${categoryName || 'Braking / Chassis'}</span></li>
                  <li><span class="spec-lbl">Certification:</span> <span class="spec-val">ECE R90 / OE Equivalent</span></li>
                </ul>
              </div>
            </div>
            <div class="specs-guarantee-note">
              <span class="guarantee-icon">🛡️</span>
              <span><strong>100% GSF Fitment Guarantee:</strong> If this part does not fit your vehicle, return it free within 30 days under our Fitment Guarantee.</span>
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
              <p>This part is not compatible with <strong>${targetLabel}</strong>.</p>
            </div>
          </div>
          <button type="button" class="btn-fitment-details-toggle" aria-expanded="false">
            <span class="details-toggle-icon">ℹ</span>
            <span class="details-toggle-text">Why doesn't it fit? View Details & Find Compatible Parts</span>
            <span class="details-toggle-chevron">▾</span>
          </button>
          <div class="fitment-specs-drawer" style="display: none;">
            <div class="not-fits-note">
              <p>The mounting specifications or component dimensions of this part do not match the chassis and engine code of your <strong>${targetLabel}</strong>.</p>
            </div>
            <a href="/plp.html?category_id=${categoryId}&category_name=${encodeURIComponent(categoryName)}" class="btn-find-compatible">
              <span>Browse Verified Parts for ${isManual ? `${status.vehicle?.make || ''} ${status.vehicle?.model || ''}`.trim() : status.vrm}</span>
              <span>→</span>
            </a>
          </div>
        `;
      }

      // Hook up toggle drawer
      const toggleBtn = fitmentBox.querySelector('.btn-fitment-details-toggle');
      const drawer = fitmentBox.querySelector('.fitment-specs-drawer');
      if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', () => {
          const isExpanded = drawer.style.display !== 'none';
          drawer.style.display = isExpanded ? 'none' : 'block';
          toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
          toggleBtn.querySelector('.details-toggle-chevron').textContent = isExpanded ? '▾' : '▴';
        });
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
          const catId = product.extraVariable?.breadcrumbs?.[0]?.id || '';
          const catName = product.extraVariable?.breadcrumbs?.[0]?.label || '';
          await lookupVrmAndFetchSkus(vrm, catId, catName);
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
  block.querySelector('.btn-add-to-cart')?.addEventListener('click', () => {
    const qty = block.querySelector('#pdp-qty')?.value || 1;
    alert(`Added ${qty} × ${product.name} (${product.sku}) to your basket!`);
  });
}
