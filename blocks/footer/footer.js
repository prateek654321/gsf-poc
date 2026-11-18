export default async function decorate(block) {
  block.innerHTML = `
    <div class="footer-inner-container">
      <!-- POC Architecture Banner in Footer -->
      <div class="footer-poc-banner">
        <div class="footer-poc-header">
          <span class="poc-live-badge">● LIVE DEMO</span>
          <h3>Adobe Experience Manager (AEM) Edge Delivery Services POC</h3>
        </div>
        <p class="footer-poc-desc">
          This site is an enterprise headless automotive commerce Proof of Concept demonstrating 
          sub-second page delivery with <strong>AEM Edge Delivery Services (EDS)</strong>, 
          real-time <strong>DVLA VRM lookup</strong>, and dynamic <strong>Adobe Commerce (Magento) GraphQL</strong> product fitment.
        </p>
        <div class="footer-poc-pills">
          <span class="poc-pill">⚡ 100 PageSpeed Score</span>
          <span class="poc-pill">⏱️ &lt;100ms Server TTFB</span>
          <span class="poc-pill">🧩 Pure ES6+ Zero-Bundle</span>
          <span class="poc-pill">🚗 Dynamic Vehicle Fitment</span>
          <span class="poc-pill">🛒 Adobe Commerce Headless</span>
        </div>
      </div>

      <!-- Main Footer Columns -->
      <div class="footer-columns">
        <div class="footer-col brand-col">
          <div class="footer-brand">
            <span class="footer-logo-block">GSF</span>
            <div class="footer-brand-text">
              <span class="footer-brand-title">CAR PARTS</span>
              <span class="footer-brand-sub">DO YOURSELF PROUD</span>
            </div>
          </div>
          <p class="footer-tagline">
            Over 100,000 quality car parts and workshop essentials delivered fast across the UK or ready to collect in 30 minutes from 180+ branches.
          </p>
          <div class="footer-branch-card">
            <span class="branch-icon">📍</span>
            <div>
              <strong>180+ UK Branches</strong>
              <p>Click & Collect ready in 30 minutes</p>
            </div>
          </div>
        </div>

        <div class="footer-col">
          <h4>Popular Car Parts</h4>
          <ul>
            <li><a href="/plp.html?category_id=5461&category_name=Braking">Brake Pads & Discs</a></li>
            <li><a href="/plp.html?category_id=5278&category_name=Engine%20Oil">Engine Oil & Lubricants</a></li>
            <li><a href="/plp.html?category_id=5986&category_name=Car%20Batteries">Car Batteries (096, 027, AGM)</a></li>
            <li><a href="/plp.html?category_id=5278&category_name=Service%20Parts">Oil, Air & Fuel Filters</a></li>
            <li><a href="/plp.html?category_id=5590&category_name=Steering%20%26%20Suspension">Steering & Suspension</a></li>
            <li><a href="/plp.html?category_id=5707&category_name=Engine%20Parts">Spark Plugs & Glow Plugs</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="/plp.html?q=click-collect">Branch Locator (180+ Stores)</a></li>
            <li><a href="/plp.html?q=delivery">Free Delivery Over £25*</a></li>
            <li><a href="/plp.html?q=returns">60 Day Hassle-Free Returns</a></li>
            <li><a href="/plp.html?q=fitment">100% Fitment Guarantee</a></li>
            <li><a href="/plp.html?q=trade">Trade Accounts & Workshops</a></li>
            <li><a href="/plp.html?q=support">Contact Customer Support</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Enterprise Tech Stack</h4>
          <ul class="tech-stack-list">
            <li><strong>Frontend:</strong> AEM Edge Delivery Services</li>
            <li><strong>Commerce:</strong> Adobe Commerce (Magento 2)</li>
            <li><strong>Fitment:</strong> Live DVLA VRM REST API</li>
            <li><strong>Styling:</strong> Vanilla CSS3 &amp; Mobile-First</li>
            <li><strong>Hosting:</strong> Cloudflare Edge CDN &amp; Fastly</li>
          </ul>
          <div class="trust-badge">
            <span class="trust-badge-stars">★★★★★</span>
            <span>Rated 4.5/5 on Trustpilot</span>
          </div>
        </div>
      </div>

      <!-- Payment & Security Strip -->
      <div class="footer-payments-bar">
        <div class="payment-methods">
          <span class="pay-chip">VISA</span>
          <span class="pay-chip">Mastercard</span>
          <span class="pay-chip">Maestro</span>
          <span class="pay-chip">PayPal</span>
          <span class="pay-chip">Apple Pay</span>
          <span class="pay-chip">Google Pay</span>
          <span class="pay-chip">Klarna</span>
        </div>
        <div class="security-note">
          <span>🔒 256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      <!-- Bottom Copyright & POC Notice -->
      <div class="footer-bottom">
        <div class="footer-bottom-inner">
          <p class="copyright-text">
            &copy; ${new Date().getFullYear()} GSF Car Parts Ltd. <strong>Proof of Concept</strong> running on Adobe Experience Manager Edge Delivery Services.
          </p>
          <div class="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <span>•</span>
            <a href="#">Terms &amp; Conditions</a>
            <span>•</span>
            <a href="#">Cookie Preferences</a>
            <span>•</span>
            <a href="#">POC Architecture Docs</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
