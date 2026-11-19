export default async function decorate(block) {
  block.innerHTML = `
    <div class="trust-bar-grid">
      <div class="trust-item">
        <div class="trust-icon">🚚</div>
        <div class="trust-text">
          <strong>Free UK Delivery</strong>
          <span>On all orders over £25*</span>
        </div>
      </div>
      <div class="trust-item">
        <div class="trust-icon">⏱️</div>
        <div class="trust-text">
          <strong>30 Min Click &amp; Collect</strong>
          <span>From 180+ UK branches</span>
        </div>
      </div>
      <div class="trust-item">
        <div class="trust-icon">🔄</div>
        <div class="trust-text">
          <strong>60 Day Returns</strong>
          <span>Hassle-free refunds &amp; swaps</span>
        </div>
      </div>
      <div class="trust-item">
        <div class="trust-icon">🛡️</div>
        <div class="trust-text">
          <strong>100% Fitment Guarantee</strong>
          <span>Exact match for your reg</span>
        </div>
      </div>
    </div>
  `;
}
