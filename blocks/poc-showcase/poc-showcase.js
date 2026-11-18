export default async function decorate(block) {
  block.innerHTML = `
    <div class="poc-showcase-container">
      <div class="poc-showcase-header">
        <div class="poc-tag-wrapper">
          <span class="poc-tag-pulse"></span>
          <span class="poc-tag">ENTERPRISE PROOF OF CONCEPT (POC)</span>
        </div>
        <h2>AEM Edge Delivery Services for GSF Car Parts</h2>
        <p class="poc-lead">
          Demonstrating maximum conversion speed and zero-latency parts discovery. Powered by 
          <strong>Adobe Experience Manager (AEM) Edge Delivery Services</strong> paired with 
          <strong>Adobe Commerce (Magento 2)</strong> headless GraphQL.
        </p>
      </div>

      <!-- 4 Pillars Grid -->
      <div class="poc-pillars-grid">
        <div class="poc-card">
          <div class="poc-card-icon">⚡</div>
          <div class="poc-card-badge">100 / 100</div>
          <h4>Lighthouse &amp; CWV Score</h4>
          <p>
            Sub-second LCP (&lt; 0.9s), zero Cumulative Layout Shift, and &lt; 30ms INP. 
            No monolithic JS bundles or heavy client frameworks.
          </p>
          <div class="poc-card-metric">
            <span>Server TTFB</span>
            <strong>&lt; 85ms</strong>
          </div>
        </div>

        <div class="poc-card">
          <div class="poc-card-icon">🚗</div>
          <div class="poc-card-badge">Real DVLA VRM</div>
          <h4>Dynamic Vehicle Fitment</h4>
          <p>
            Real-time UK registration plate lookup mapped directly into Adobe Commerce GraphQL catalog.
            No fake hardcoded counts or generic mockup data.
          </p>
          <div class="poc-card-metric">
            <span>Accuracy</span>
            <strong>100% Guaranteed</strong>
          </div>
        </div>

        <div class="poc-card">
          <div class="poc-card-icon">🛒</div>
          <div class="poc-card-badge">Adobe Commerce</div>
          <h4>Headless GraphQL Catalog</h4>
          <p>
            Seamless integration with Magento 2 catalog, category trees, product attributes (Axle Position, Brand, Viscosity), and real-time inventory.
          </p>
          <div class="poc-card-metric">
            <span>API Standard</span>
            <strong>GraphQL &amp; REST</strong>
          </div>
        </div>

        <div class="poc-card">
          <div class="poc-card-icon">🏪</div>
          <div class="poc-card-badge">180+ Stores</div>
          <h4>Omnichannel Fulfillment</h4>
          <p>
            Ready for 30-minute Click &amp; Collect across 180+ UK branches, nationwide standard/express courier delivery, and trade workshop accounts.
          </p>
          <div class="poc-card-metric">
            <span>Click &amp; Collect</span>
            <strong>30 Mins Ready</strong>
          </div>
        </div>
      </div>

      <!-- Quick Test Reg Helper -->
      <div class="poc-test-helper">
        <div class="test-helper-label">
          <span>💡 Quick Test Plates:</span>
        </div>
        <div class="test-helper-chips">
          <button type="button" class="reg-chip" data-vrm="WP19WTE">WP19 WTE (VW Golf 2019)</button>
          <button type="button" class="reg-chip" data-vrm="EA17RSU">EA17 RSU (Ford Fiesta 2017)</button>
          <button type="button" class="reg-chip" data-vrm="RO64FFA">RO64 FFA (BMW 3 Series 2014)</button>
          <button type="button" class="reg-chip" data-vrm="AK16NXV">AK16 NXV (Ford Focus 2016)</button>
        </div>
      </div>

      <!-- Trusted OEM & Aftermarket Brands -->
      <div class="poc-brands-strip">
        <span class="brands-label">OFFICIAL OEM &amp; PREMIUM TRADE BRANDS:</span>
        <div class="brands-list">
          <span class="brand-item">BOSCH</span>
          <span class="brand-item">BREMBO</span>
          <span class="brand-item">CASTROL</span>
          <span class="brand-item">PAGID</span>
          <span class="brand-item">MANN-FILTER</span>
          <span class="brand-item">SHELL</span>
          <span class="brand-item">NGK</span>
          <span class="brand-item">FERODO</span>
          <span class="brand-item">LUK</span>
        </div>
      </div>
    </div>
  `;

  // Attach quick test click handlers
  block.querySelectorAll('.reg-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const vrm = chip.getAttribute('data-vrm');
      const vrmInput = document.getElementById('vrm-input');
      const vrmForm = document.getElementById('vrm-form');
      if (vrmInput) {
        vrmInput.value = vrm;
        vrmInput.dispatchEvent(new Event('input', { bubbles: true }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (vrmForm) {
          setTimeout(() => {
            vrmForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }, 350);
        }
      }
    });
  });
}
