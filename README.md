# GSF Car Parts — Edge Delivery Services (EDS) POC

A lightweight, high-performance storefront built on Adobe Experience Manager (AEM) Edge Delivery Services, connecting directly to Magento GraphQL and GSF VRM REST APIs **without requiring Adobe Commerce as a Cloud Service (ACCS) or SaaS connector modules**.

---

## Key Features

1. **Direct Magento GraphQL Integration**:
   - Uses `https://gsf-carparts-staging.agilecollab.com/graphql`.
   - Fetches live categories dynamically for the top navigation menu.
   - Executes the custom `ProductFilterEngineOil` query with `specialCoupon: "GSF22"`, fragments, filtering, sorting, and pagination.

2. **Full Vehicle Registration (VRM) Fitment Flow**:
   - Present at the top of Homepage, Product List Page (PLP), and Product Details Page (PDP).
   - Validates UK registration plates.
   - Calls `/rest/V1/gsf-vrm/vrmdetails` to resolve vehicle details (`make`, `model`, `engine`, `fuel`, `year`, `image`) and `sessionId`.
   - Calls `/rest/V1/gsf-vrm/skus` to fetch compatible parts filtered against active Magento SKUs.
   - Saves vehicle state across sessions in `localStorage` and cookies.
   - Automatically filters PLP products to show only parts guaranteed to fit the active vehicle.

3. **Product Listing Page (PLP)**:
   - Sidebar with facet filters (Brand, Quality, Price) populated from GraphQL aggregations.
   - Sorting options (Position/Relevance, Price Low-High, Price High-Low, Name A-Z).
   - Page size selector (12, 24, 48) and full sliding-window pagination.
   - Guaranteed Fitment badges on product cards.

4. **Product Details Page (PDP)**:
   - Real-time fitment checker:
     - If a vehicle is selected: Prominent green banner *"✓ Guaranteed to fit your [Vehicle]"* or red warning *"✕ Does not fit"*.
     - If no vehicle is selected: Inline plate input allowing immediate fitment check on the product page.
   - Product gallery, specifications, price in GBP, quantity selector, and basket action.

---

## Project Structure

```
d:\accs\gsf-eds-store/
├── blocks/
│   ├── header/            # Dynamic navigation menu from categoryList + active vehicle banner
│   ├── footer/            # Store footer, category links, trust badges
│   ├── vrm-search/        # UK yellow plate search box & active vehicle card
│   ├── product-list/      # Full PLP: facets, sort, pagination, fitment filter
│   └── product-details/   # Full PDP: gallery, pricing, specs, fitment banner
├── scripts/
│   ├── aem.js             # Core Edge Delivery Services decoration library
│   ├── scripts.js         # Global page loader and block decorator
│   ├── magento-api.js     # GraphQL and REST client for GSF Magento
│   └── vehicle-lookup.js  # VRM lookup, SKU fetcher, storage, event bus
├── styles/
│   └── styles.css         # Modern automotive e-commerce design system
├── index.html             # Homepage
├── plp.html               # Product Listing Page
├── pdp.html               # Product Details Page
├── head.html              # Shared head tags
├── 404.html               # Custom 404 error page
└── package.json           # Dependencies and scripts
```

---

## How to Run Locally

Navigate to the project directory:

```bash
cd d:\accs\gsf-eds-store
```

Start the Edge Delivery Services development server:

```bash
npm start
```
*(or run `npx @adobe/aem-cli up --no-open --forward-browser-logs`)*

Then open your browser at:
* **Homepage**: `http://localhost:3000/`
* **Product Listing Page (PLP)**: `http://localhost:3000/plp.html`
* **Category PLP**: `http://localhost:3000/plp.html?category_id=5278`
* **Product Details Page (PDP)**: `http://localhost:3000/pdp.html?sku=A2AAMS100`
