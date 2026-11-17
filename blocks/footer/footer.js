export default async function decorate(block) {
  block.innerHTML = `
    <div class="footer-wrapper">
      <div class="footer-columns">
        <div class="footer-col">
          <div class="footer-brand">
            <span class="logo-gsf">GSF</span>
            <span class="logo-sub">CAR PARTS</span>
          </div>
          <p class="footer-tagline">
            Quality car parts, spares and accessories delivered directly to your door with 100% vehicle fitment guarantee.
          </p>
        </div>
        <div class="footer-col">
          <h4>Popular Categories</h4>
          <ul>
            <li><a href="/plp.html?category_id=5278">Service Parts</a></li>
            <li><a href="/plp.html?category_id=5461">Braking & Discs</a></li>
            <li><a href="/plp.html?category_id=5590">Suspension & Steering</a></li>
            <li><a href="/plp.html?category_id=5707">Engine Parts</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Customer Support</h4>
          <ul>
            <li><a href="#">Track My Order</a></li>
            <li><a href="#">Returns & Refunds</a></li>
            <li><a href="#">Store Finder (180+ Branches)</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Safe & Secure</h4>
          <p>We accept all major credit and debit cards, PayPal, and Apple Pay.</p>
          <div class="trust-badge">🔒 256-Bit SSL Encrypted</div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} GSF Car Parts. Edge Delivery Services POC.</p>
      </div>
    </div>
  `;
}
