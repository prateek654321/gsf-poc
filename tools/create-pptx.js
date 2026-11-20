const pptxgen = require('pptxgenjs');
const path = require('path');

async function createPresentation() {
  const pptx = new pptxgen();
  
  // Define standard widescreen layout 16:9 (13.333 x 7.5 inches)
  pptx.defineLayout({ name: 'GSF_WIDESCREEN', width: 13.333, height: 7.5 });
  pptx.layout = 'GSF_WIDESCREEN';

  pptx.author = 'GSF Car Parts & Adobe Experience Manager Team';
  pptx.company = 'GSF Car Parts Ltd';
  pptx.title = 'GSF Car Parts — AEM Edge Delivery Services POC';
  pptx.subject = 'Sub-Second Automotive E-Commerce & Real-Time Vehicle Fitment Engine';

  // ==========================================
  // GSF OFFICIAL WEBSITE BRAND PALETTE
  // ==========================================
  const GSF_NAVY_DARK  = '07162C'; // Website top bar dark navy
  const GSF_NAVY       = '002F6E'; // Official GSF Primary Brand Navy Blue
  const GSF_NAVY_LIGHT = '004B97'; // Secondary active navy
  const GSF_RED        = 'ED1C24'; // Official GSF Brand Red
  const GSF_RED_HOVER  = 'D71920';
  const GSF_YELLOW     = 'FFD100'; // UK Reg Plate Yellow
  const GSF_YELLOW_TXT = '111111'; // Dark text on plate
  const GSF_GREEN      = '059669'; // Guaranteed Fit Success Green
  const GSF_GREEN_BG   = 'ECFDF5'; // Light green badge bg
  const GSF_GREEN_BDR  = 'A7F3D0'; // Green border
  
  const SLIDE_BG       = 'F4F6F9'; // Website body light slate grey
  const CARD_BG        = 'FFFFFF'; // Pure white card surface
  const CARD_BORDER    = 'CBD5E1'; // Clean subtle card border
  const TEXT_DARK      = '0F172A'; // Deep slate heading text
  const TEXT_BODY      = '334155'; // Body text
  const TEXT_MUTED     = '64748B'; // Muted helper text
  const TEXT_WHITE     = 'FFFFFF'; // Pure white text

  // Helper function: Standard slide template matching GSF website header & footer
  function createStandardSlide(title, subtitle, category = 'AEM EDGE DELIVERY SERVICES POC') {
    const slide = pptx.addSlide();
    slide.background = { color: SLIDE_BG };

    // 1. Top GSF Navy Header Bar (Full width: 13.333 x 1.15)
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 1.15,
      fill: { color: GSF_NAVY },
      line: { color: GSF_NAVY },
    });

    // Red Accent Strip at bottom of header
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 1.15,
      w: 13.333,
      h: 0.05,
      fill: { color: GSF_RED },
      line: { color: GSF_RED },
    });

    // GSF Red Logo Box
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 0.22,
      w: 0.85,
      h: 0.7,
      fill: { color: GSF_RED },
      line: { color: GSF_RED },
      rectRadius: 0.06,
    });
    slide.addText('GSF', {
      x: 0.8,
      y: 0.22,
      w: 0.85,
      h: 0.7,
      fontSize: 16,
      fontFace: 'Arial Black',
      color: TEXT_WHITE,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Brand Tagline next to Logo
    slide.addText([
      { text: 'CAR PARTS\n', options: { fontSize: 10, bold: true, color: TEXT_WHITE } },
      { text: 'DO YOURSELF PROUD', options: { fontSize: 7, bold: true, color: GSF_YELLOW } },
    ], {
      x: 1.75,
      y: 0.25,
      w: 1.8,
      h: 0.65,
      fontFace: 'Arial',
      valign: 'middle',
    });

    // Divider line
    slide.addShape(pptx.shapes.LINE, {
      x: 3.65,
      y: 0.25,
      w: 0,
      h: 0.65,
      line: { color: '234B82', width: 1.5 },
    });

    // Slide Title & Category
    slide.addText([
      { text: `${category.toUpperCase()}\n`, options: { fontSize: 9, bold: true, color: GSF_YELLOW } },
      { text: title, options: { fontSize: 17, bold: true, color: TEXT_WHITE } },
    ], {
      x: 3.85,
      y: 0.18,
      w: 7.2,
      h: 0.8,
      fontFace: 'Arial',
      valign: 'middle',
    });

    // Right-hand Sidekick / Status Badge
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 11.2,
      y: 0.35,
      w: 1.33,
      h: 0.42,
      fill: { color: GSF_NAVY_DARK },
      line: { color: '234B82', width: 1 },
      rectRadius: 0.06,
    });
    slide.addText('⚡ 100 PAGESPEED', {
      x: 11.2,
      y: 0.35,
      w: 1.33,
      h: 0.42,
      fontSize: 8.5,
      fontFace: 'Arial',
      color: GSF_YELLOW,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Subtitle Strip below Header (y: 1.25)
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8,
        y: 1.28,
        w: 11.733,
        h: 0.32,
        fontSize: 11,
        fontFace: 'Arial',
        color: TEXT_MUTED,
        italic: true,
      });
    }

    // Bottom Footer
    slide.addShape(pptx.shapes.LINE, {
      x: 0.8,
      y: 7.0,
      w: 11.733,
      h: 0,
      line: { color: 'E2E8F0', width: 1 },
    });
    slide.addText('GSF Car Parts Storefront • Adobe Experience Manager (EDS) POC • Confidential Technical Review', {
      x: 0.8,
      y: 7.05,
      w: 8.0,
      h: 0.35,
      fontSize: 9,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
    slide.addText('mcstaging.gsfcarparts.com', {
      x: 9.5,
      y: 7.05,
      w: 3.033,
      h: 0.35,
      fontSize: 9,
      fontFace: 'Arial',
      color: GSF_NAVY,
      bold: true,
      align: 'right',
    });

    return slide;
  }

  // ==========================================
  // SLIDE 1: COVER / TITLE SLIDE (GSF Hero Theme)
  // ==========================================
  {
    const s1 = pptx.addSlide();
    s1.background = { color: SLIDE_BG };

    // Hero Top Banner: GSF Deep Navy (0 to 4.8 inches)
    s1.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 4.8,
      fill: { color: GSF_NAVY },
      line: { color: GSF_NAVY },
    });

    // Red Accent Divider Strip
    s1.addShape(pptx.shapes.RECTANGLE, {
      x: 0,
      y: 4.8,
      w: 13.333,
      h: 0.08,
      fill: { color: GSF_RED },
      line: { color: GSF_RED },
    });

    // Top POC Badge
    s1.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 0.65,
      w: 3.1,
      h: 0.38,
      fill: { color: GSF_NAVY_DARK },
      line: { color: GSF_RED, width: 1.5 },
      rectRadius: 0.06,
    });
    s1.addText('ENTERPRISE PROOF OF CONCEPT (POC)', {
      x: 0.8,
      y: 0.65,
      w: 3.1,
      h: 0.38,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: GSF_YELLOW,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Authentic GSF Brand Header
    s1.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 1.25,
      w: 1.2,
      h: 0.9,
      fill: { color: GSF_RED },
      line: { color: GSF_RED },
      rectRadius: 0.08,
    });
    s1.addText('GSF', {
      x: 0.8,
      y: 1.25,
      w: 1.2,
      h: 0.9,
      fontSize: 24,
      fontFace: 'Arial Black',
      color: TEXT_WHITE,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    s1.addText([
      { text: 'CAR PARTS\n', options: { fontSize: 16, bold: true, color: TEXT_WHITE } },
      { text: 'DO YOURSELF PROUD', options: { fontSize: 10, bold: true, color: GSF_YELLOW } },
    ], {
      x: 2.15,
      y: 1.3,
      w: 3.0,
      h: 0.8,
      fontFace: 'Arial',
      valign: 'middle',
    });

    // Main Cover Title
    s1.addText('AEM Edge Delivery Services Storefront', {
      x: 0.8,
      y: 2.3,
      w: 11.733,
      h: 0.9,
      fontSize: 34,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true,
    });

    // Subtitle
    s1.addText('Sub-Second Automotive E-Commerce Powered by AEM Edge Delivery Services (EDS) &\nHeadless Adobe Commerce with Live DVLA Vehicle Fitment Engine', {
      x: 0.8,
      y: 3.25,
      w: 11.733,
      h: 0.85,
      fontSize: 15,
      fontFace: 'Arial',
      color: 'CBD5E1',
      lineSpacing: 22,
    });

    // Yellow UK Registration Plate Mockup on Cover
    s1.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 4.15,
      w: 3.2,
      h: 0.48,
      fill: { color: GSF_YELLOW },
      line: { color: '111111', width: 1.5 },
      rectRadius: 0.06,
    });
    s1.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 4.15,
      w: 0.45,
      h: 0.48,
      fill: { color: GSF_NAVY },
      line: { color: '111111', width: 1.5 },
    });
    s1.addText('GB', {
      x: 0.8,
      y: 4.15,
      w: 0.45,
      h: 0.48,
      fontSize: 10,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true,
      align: 'center',
      valign: 'middle',
    });
    s1.addText('WP19 WTE (VW GOLF)', {
      x: 1.3,
      y: 4.15,
      w: 2.65,
      h: 0.48,
      fontSize: 12,
      fontFace: 'Arial Black',
      color: '111111',
      bold: true,
      valign: 'middle',
    });

    // Guaranteed Fit Badge Pill next to plate
    s1.addShape(pptx.shapes.RECTANGLE, {
      x: 4.15,
      y: 4.15,
      w: 2.4,
      h: 0.48,
      fill: { color: GSF_GREEN_BG },
      line: { color: GSF_GREEN_BDR, width: 1 },
      rectRadius: 0.06,
    });
    s1.addText('✓ Guaranteed Fitment', {
      x: 4.15,
      y: 4.15,
      w: 2.4,
      h: 0.48,
      fontSize: 11,
      fontFace: 'Arial',
      color: GSF_GREEN,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // BOTTOM 4 METRICS CARDS (y: 5.15, on white background with crisp borders)
    const metrics = [
      { num: '100 / 100', label: 'Lighthouse Score', sub: 'Performance, Accessibility & SEO', color: GSF_GREEN },
      { num: '< 900ms', label: 'Largest Contentful Paint', sub: '4x faster than monolithic sites', color: GSF_NAVY },
      { num: 'Zero ACCS', label: 'Direct Headless APIs', sub: 'No costly middleware license tax', color: GSF_RED },
      { num: '100% Fitment', label: 'DVLA & Component Map', sub: 'Guaranteed parts compatibility', color: 'D97706' },
    ];

    metrics.forEach((m, idx) => {
      const xPos = 0.8 + idx * 2.98;
      s1.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 5.15,
        w: 2.78,
        h: 1.7,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      // Top color accent bar on card
      s1.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 5.15,
        w: 2.78,
        h: 0.08,
        fill: { color: m.color },
        line: { color: m.color },
        rectRadius: 0.04,
      });

      s1.addText(m.num, {
        x: xPos + 0.2,
        y: 5.35,
        w: 2.38,
        h: 0.5,
        fontSize: 22,
        fontFace: 'Arial',
        color: m.color,
        bold: true,
      });

      s1.addText(m.label, {
        x: xPos + 0.2,
        y: 5.9,
        w: 2.38,
        h: 0.35,
        fontSize: 12,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
      });

      s1.addText(m.sub, {
        x: xPos + 0.2,
        y: 6.25,
        w: 2.38,
        h: 0.45,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: TEXT_MUTED,
        lineSpacing: 13,
      });
    });

    // Footer
    s1.addText('Adobe Experience Manager (EDS) • Magento 2 Headless GraphQL • GSF VRM REST Gateway', {
      x: 0.8,
      y: 7.05,
      w: 11.733,
      h: 0.35,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  }

  // ==========================================
  // SLIDE 2: THE BUSINESS PROBLEM & PURPOSE
  // ==========================================
  {
    const s2 = createStandardSlide(
      'The Automotive E-Commerce Challenge & POC Purpose',
      'Why traditional e-commerce architectures fail in automotive aftermarket, and how AEM EDS solves it.',
      'EXECUTIVE SUMMARY'
    );

    const pillars = [
      {
        num: '01',
        title: 'The Fitment Barrier',
        body: 'Over 70% of automotive customer drop-offs occur if vehicle identification is slow or inaccurate. Customers must know with 100% certainty that a brake pad or filter fits their vehicle before purchasing.',
        tag: 'CRITICAL CONVERSION FACTOR',
        color: GSF_RED,
      },
      {
        num: '02',
        title: 'Monolithic Performance Drag',
        body: 'Traditional Magento storefronts and heavy SPAs carry 1.5MB+ JS bundles, causing sluggish LCP (>3.5s) and slow TTFB (>800ms). This directly hurts Google search rankings and mobile conversions.',
        tag: 'SPEED & CWV DEFICIT',
        color: 'D97706',
      },
      {
        num: '03',
        title: 'Costly Middleware Overhead',
        body: 'Typical headless setups demand costly Adobe Commerce Cloud Service (ACCS) modules, complex middleware, and caching proxy servers, driving up cloud infrastructure and annual licensing fees.',
        tag: 'MIDDLEWARE TAX',
        color: GSF_NAVY,
      },
      {
        num: '04',
        title: 'POC Validation Objective',
        body: 'Prove that pure Vanilla ES6 on AEM Edge Delivery Services connecting directly to Magento GraphQL and GSF VRM APIs delivers 100 PageSpeed with zero intermediate server middleware.',
        tag: 'SUCCESS CRITERIA',
        color: GSF_GREEN,
      },
    ];

    pillars.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPos = 0.8 + col * 5.96;
      const yPos = 1.65 + row * 2.55;

      s2.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 5.75,
        h: 2.35,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      // Left Accent Border
      s2.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 0.1,
        h: 2.35,
        fill: { color: p.color },
        line: { color: p.color },
        rectRadius: 0.04,
      });

      // Number badge
      s2.addShape(pptx.shapes.RECTANGLE, {
        x: xPos + 0.3,
        y: yPos + 0.22,
        w: 0.5,
        h: 0.45,
        fill: { color: SLIDE_BG },
        line: { color: CARD_BORDER, width: 1 },
        rectRadius: 0.06,
      });
      s2.addText(p.num, {
        x: xPos + 0.3,
        y: yPos + 0.22,
        w: 0.5,
        h: 0.45,
        fontSize: 12,
        fontFace: 'Arial',
        color: p.color,
        bold: true,
        align: 'center',
        valign: 'middle',
      });

      s2.addText(p.title, {
        x: xPos + 0.9,
        y: yPos + 0.22,
        w: 4.5,
        h: 0.45,
        fontSize: 15,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
        valign: 'middle',
      });

      s2.addText(p.body, {
        x: xPos + 0.3,
        y: yPos + 0.8,
        w: 5.15,
        h: 1.05,
        fontSize: 11,
        fontFace: 'Arial',
        color: TEXT_BODY,
        lineSpacing: 17,
      });

      // Bottom Tag Pill
      s2.addShape(pptx.shapes.RECTANGLE, {
        x: xPos + 0.3,
        y: yPos + 1.9,
        w: 2.6,
        h: 0.3,
        fill: { color: SLIDE_BG },
        line: { color: CARD_BORDER, width: 0.8 },
        rectRadius: 0.04,
      });
      s2.addText(p.tag, {
        x: xPos + 0.3,
        y: yPos + 1.9,
        w: 2.6,
        h: 0.3,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: p.color,
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    });
  }

  // ==========================================
  // SLIDE 3: DETAILED TECH STACK
  // ==========================================
  {
    const s3 = createStandardSlide(
      'Modern, Resilient, Zero-Framework Tech Stack',
      'Engineered for maximum execution speed, zero dependencies, and direct headless integration.',
      'TECHNOLOGY ARCHITECTURE'
    );

    const stackItems = [
      {
        layer: 'EDGE PRESENTATION',
        tech: 'AEM Edge Delivery Services',
        desc: 'Static markup delivered directly from GitHub via global Fastly/Cloudflare Edge CDN in <50ms.',
        badge: 'Zero Server Render',
        badgeColor: GSF_NAVY,
      },
      {
        layer: 'FRONTEND RUNTIME',
        tech: 'Vanilla JavaScript (ES6+)',
        desc: 'No React, Angular, or Vue. Pure Web Standards: Fetch API, CustomEvent Bus, and native DOM.',
        badge: 'Zero Framework Overhead',
        badgeColor: GSF_GREEN,
      },
      {
        layer: 'DESIGN SYSTEM',
        tech: 'Custom CSS3 Architecture',
        desc: 'GSF brand tokens (--color-brand-primary: #002f6e), clamp() typography, and shimmer skeletons.',
        badge: 'Zero Layout Shift (CLS: 0.00)',
        badgeColor: GSF_RED,
      },
      {
        layer: 'COMMERCE ENGINE',
        tech: 'Adobe Commerce (Magento 2)',
        desc: 'Direct headless GraphQL queries for category trees, products, facets, and coupons (PARTS30).',
        badge: 'Headless GraphQL',
        badgeColor: GSF_NAVY,
      },
      {
        layer: 'AUTOMOTIVE GATEWAY',
        tech: 'GSF Proprietary VRM APIs',
        desc: 'DVLA lookup (/vrmdetails), SKU fitment resolver (/skus), and cascading vehicle metadata endpoints.',
        badge: 'Real-Time DVLA Match',
        badgeColor: GSF_GREEN,
      },
      {
        layer: 'AUTHORING & TOOLING',
        tech: 'Adobe AEM Sidekick',
        desc: 'In-context preview, publish to live via Adobe Admin API, and multi-environment toggling.',
        badge: 'Direct GitHub Sync',
        badgeColor: 'D97706',
      },
    ];

    stackItems.forEach((item, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const xPos = 0.8 + col * 3.98;
      const yPos = 1.65 + row * 2.55;

      s3.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 3.78,
        h: 2.35,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      // Top color strip
      s3.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: yPos,
        w: 3.78,
        h: 0.06,
        fill: { color: item.badgeColor },
        line: { color: item.badgeColor },
        rectRadius: 0.03,
      });

      s3.addText(item.layer, {
        x: xPos + 0.25,
        y: yPos + 0.18,
        w: 3.28,
        h: 0.25,
        fontSize: 9,
        fontFace: 'Arial',
        color: GSF_NAVY,
        bold: true,
        letterSpacing: 1.0,
      });

      s3.addText(item.tech, {
        x: xPos + 0.25,
        y: yPos + 0.45,
        w: 3.28,
        h: 0.45,
        fontSize: 14,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
      });

      s3.addText(item.desc, {
        x: xPos + 0.25,
        y: yPos + 0.95,
        w: 3.28,
        h: 0.85,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: TEXT_BODY,
        lineSpacing: 16,
      });

      // Bottom Badge
      s3.addShape(pptx.shapes.RECTANGLE, {
        x: xPos + 0.25,
        y: yPos + 1.88,
        w: 2.5,
        h: 0.3,
        fill: { color: SLIDE_BG },
        line: { color: CARD_BORDER, width: 0.8 },
        rectRadius: 0.04,
      });
      s3.addText(item.badge, {
        x: xPos + 0.25,
        y: yPos + 1.88,
        w: 2.5,
        h: 0.3,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: item.badgeColor,
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    });
  }

  // ==========================================
  // SLIDE 4: SYSTEM ARCHITECTURE & TOPOGRAPHY
  // ==========================================
  {
    const s4 = createStandardSlide(
      'System Architecture: Direct Edge-to-API Topography',
      'Eliminating intermediate middleware: Browser clients communicate directly with GraphQL & REST.',
      'SYSTEM TOPOGRAPHY'
    );

    const steps = [
      {
        num: 'STEP 1',
        title: 'Edge CDN Shell',
        detail: 'Fastly / Cloudflare delivers lean HTML shell in <50ms. No server-side rendering delays or complex Node.js processes.',
        color: GSF_NAVY,
      },
      {
        num: 'STEP 2',
        title: 'Modular Blocks',
        detail: 'EDS loads blocks dynamically (header, vehicle-search, product-list, pdp) as viewport demand requires.',
        color: GSF_GREEN,
      },
      {
        num: 'STEP 3',
        title: 'Service Layer',
        detail: 'Centralized catalog-service & vehicle-lookup orchestrate queries, normalization, and client fitment caching.',
        color: 'D97706',
      },
      {
        num: 'STEP 4',
        title: 'Headless APIs',
        detail: 'Direct HTTPS calls to Magento 2 GraphQL and GSF VRM REST Gateway with zero intermediate middleware hop.',
        color: GSF_RED,
      },
    ];

    steps.forEach((st, idx) => {
      const xPos = 0.8 + idx * 2.98;
      s4.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 1.65,
        w: 2.78,
        h: 3.55,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      // Top color bar
      s4.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 1.65,
        w: 2.78,
        h: 0.1,
        fill: { color: st.color },
        line: { color: st.color },
        rectRadius: 0.04,
      });

      s4.addText(st.num, {
        x: xPos + 0.2,
        y: 1.85,
        w: 2.38,
        h: 0.25,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: st.color,
        bold: true,
        letterSpacing: 1.0,
      });

      s4.addText(st.title, {
        x: xPos + 0.2,
        y: 2.1,
        w: 2.38,
        h: 0.5,
        fontSize: 15,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
      });

      s4.addText(st.detail, {
        x: xPos + 0.2,
        y: 2.7,
        w: 2.38,
        h: 2.3,
        fontSize: 11,
        fontFace: 'Arial',
        color: TEXT_BODY,
        lineSpacing: 18,
      });
    });

    // Architecture Highlight Callout Box at Bottom
    s4.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 5.4,
      w: 11.733,
      h: 1.35,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1.5 },
      rectRadius: 0.08,
    });
    s4.addText('💡 FUTURE-PROOF ARCHITECTURAL ADVANTAGE: ADOBE APP BUILDER & API MESH READY', {
      x: 1.1,
      y: 5.55,
      w: 11.133,
      h: 0.35,
      fontSize: 11,
      fontFace: 'Arial',
      color: GSF_NAVY,
      bold: true,
    });
    s4.addText('When Adobe App Builder + API Mesh is provisioned, simply set "catalogApiEndpoint" in config.json. All traffic will seamlessly route via the unified API Mesh with ZERO frontend block, layout, or CSS modifications. The abstraction is fully built-in.', {
      x: 1.1,
      y: 5.95,
      w: 11.133,
      h: 0.65,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_BODY,
      lineSpacing: 16,
    });
  }

  // ==========================================
  // SLIDE 5: VEHICLE REGISTRATION (VRM) FLOW
  // ==========================================
  {
    const s5 = createStandardSlide(
      'Real-Time Vehicle Registration (VRM) & Fitment Flow',
      'From UK license plate input to guaranteed SKU fitment set in milliseconds.',
      'FITMENT ENGINE'
    );

    const stages = [
      {
        step: 'STEP 1',
        name: 'Plate Input & Validation',
        desc: 'UK regex validates format in the iconic yellow search box. Sanitizes spaces, casing, and invalid characters.',
      },
      {
        step: 'STEP 2',
        name: 'DVLA Details Lookup',
        desc: 'Calls /vrmdetails endpoint. Resolves Make, Model, Year, Engine, Fuel, and issues an active sessionId.',
      },
      {
        step: 'STEP 3',
        name: 'Category SKU Resolution',
        desc: 'Cross-references active category component IDs with /skus to return exact compatible parts list.',
      },
      {
        step: 'STEP 4',
        name: 'State Broadcast & Garage',
        desc: 'Persists to localStorage & cookies. Dispatches gsf:vehicle-changed event. Saves car to "My Garage".',
      },
    ];

    stages.forEach((st, idx) => {
      const xPos = 0.8 + idx * 2.98;
      s5.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 1.65,
        w: 2.78,
        h: 2.9,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      s5.addText(st.step, {
        x: xPos + 0.2,
        y: 1.85,
        w: 2.38,
        h: 0.25,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: GSF_RED,
        bold: true,
        letterSpacing: 1.2,
      });

      s5.addText(st.name, {
        x: xPos + 0.2,
        y: 2.1,
        w: 2.38,
        h: 0.6,
        fontSize: 14,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
      });

      s5.addText(st.desc, {
        x: xPos + 0.2,
        y: 2.75,
        w: 2.38,
        h: 1.6,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: TEXT_BODY,
        lineSpacing: 16,
      });
    });

    // 3 Feature Cards at Bottom
    const features = [
      { label: 'Dynamic MOT & Road Tax Alerts', val: 'Calculates expiry dates and urgent service alerts directly from registration plate.', color: GSF_GREEN },
      { label: 'Cascading Manual Vehicle Select', val: '6-tier fallback: Make → Model → Year → Engine → Body → HP ratings via /vehiclemetadata.', color: GSF_NAVY },
      { label: '"My Garage" Multi-Vehicle Switcher', val: 'Sticky header dropdown enabling trade users and families to toggle saved cars in 1 click.', color: 'D97706' },
    ];

    features.forEach((f, idx) => {
      const xPos = 0.8 + idx * 3.98;
      s5.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 4.8,
        w: 3.78,
        h: 1.95,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      s5.addText(`✔ ${f.label}`, {
        x: xPos + 0.2,
        y: 5.0,
        w: 3.38,
        h: 0.45,
        fontSize: 12,
        fontFace: 'Arial',
        color: f.color,
        bold: true,
      });

      s5.addText(f.val, {
        x: xPos + 0.2,
        y: 5.5,
        w: 3.38,
        h: 1.1,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: TEXT_BODY,
        lineSpacing: 16,
      });
    });
  }

  // ==========================================
  // SLIDE 6: PLP & PDP FITMENT EXPERIENCES
  // ==========================================
  {
    const s6 = createStandardSlide(
      'Catalog Discovery (PLP) & Product Details (PDP)',
      'Intelligent dual-tier browsing, facet filtering, and real-time compatibility verification.',
      'CATALOG & CONVERSION'
    );

    // Left Column: PLP
    s6.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 1.65,
      w: 5.75,
      h: 5.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1.2 },
      rectRadius: 0.08,
    });
    s6.addShape(pptx.shapes.RECTANGLE, {
      x: 0.8,
      y: 1.65,
      w: 5.75,
      h: 0.08,
      fill: { color: GSF_RED },
      line: { color: GSF_RED },
      rectRadius: 0.04,
    });

    s6.addText('PRODUCT LISTING PAGE (PLP)', {
      x: 1.1,
      y: 1.85,
      w: 5.15,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: GSF_RED,
      bold: true,
      letterSpacing: 1.2,
    });
    s6.addText('Dual-View Intelligent Routing', {
      x: 1.1,
      y: 2.15,
      w: 5.15,
      h: 0.45,
      fontSize: 16,
      fontFace: 'Arial',
      color: TEXT_DARK,
      bold: true,
    });

    const plpPoints = [
      '• Parent Category View: Visual subcategory cards with item counts and category icons for frictionless navigation.',
      '• Leaf Category View: Full e-commerce catalog filtered strictly to SKUs guaranteed to fit active vehicle.',
      '• Sidebar Facets: Dynamic Brand filtering using Magento "quality" attribute codes (EBC, Bosch, Borg & Beck).',
      '• Brand Relevance Sorting: Initial card order perfectly mirrors GSF preproduction catalog sequence.',
      '• Zero-CLS Skeletons: Full skeleton shimmer prevents layout shift during asynchronous data retrieval.',
    ];
    s6.addText(plpPoints.join('\n\n'), {
      x: 1.1,
      y: 2.7,
      w: 5.15,
      h: 3.8,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_BODY,
      lineSpacing: 18,
    });

    // Right Column: PDP
    s6.addShape(pptx.shapes.RECTANGLE, {
      x: 6.78,
      y: 1.65,
      w: 5.75,
      h: 5.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1.2 },
      rectRadius: 0.08,
    });
    s6.addShape(pptx.shapes.RECTANGLE, {
      x: 6.78,
      y: 1.65,
      w: 5.75,
      h: 0.08,
      fill: { color: GSF_GREEN },
      line: { color: GSF_GREEN },
      rectRadius: 0.04,
    });

    s6.addText('PRODUCT DETAILS PAGE (PDP)', {
      x: 7.08,
      y: 1.85,
      w: 5.15,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: GSF_GREEN,
      bold: true,
      letterSpacing: 1.2,
    });
    s6.addText('Real-Time Fitment & Conversion', {
      x: 7.08,
      y: 2.15,
      w: 5.15,
      h: 0.45,
      fontSize: 16,
      fontFace: 'Arial',
      color: TEXT_DARK,
      bold: true,
    });

    const pdpPoints = [
      '• Dynamic Fitment Banner: Prominent green "Guaranteed to Fit [Vehicle]" or high-visibility red mismatch warning.',
      '• Inline Plate Checker: If no vehicle is active, customers can type their plate directly on PDP for instant verification.',
      '• Dynamic Gallery: Main high-res product visual with responsive multi-angle thumbnail carousel.',
      '• Pricing & Promotions: Transparent inc/ex VAT display and automatic coupon code application (PARTS30).',
      '• Tabbed Technical Specs: Full vehicle compatibility table, OEM cross-references, and warranty information.',
    ];
    s6.addText(pdpPoints.join('\n\n'), {
      x: 7.08,
      y: 2.7,
      w: 5.15,
      h: 3.8,
      fontSize: 10.5,
      fontFace: 'Arial',
      color: TEXT_BODY,
      lineSpacing: 18,
    });
  }

  // ==========================================
  // SLIDE 7: PERFORMANCE & BUSINESS ROI
  // ==========================================
  {
    const s7 = createStandardSlide(
      'Proven Performance & Tangible Business ROI',
      'How sub-second edge performance and fitment accuracy translate directly into business value.',
      'BUSINESS IMPACT & ROI'
    );

    const kpis = [
      {
        metric: '100 / 100',
        label: 'Google PageSpeed Score',
        sub: 'Flawless mobile & desktop audit across performance, accessibility & SEO.',
        color: GSF_GREEN,
      },
      {
        metric: '< 900ms',
        label: 'Largest Contentful Paint',
        sub: '4x faster than legacy monolithic Magento storefronts (avg 3.8s).',
        color: GSF_NAVY,
      },
      {
        metric: '< 85ms',
        label: 'Server TTFB',
        sub: 'Edge CDN caching delivers static HTML with near-zero network latency.',
        color: 'D97706',
      },
      {
        metric: '0.00',
        label: 'Cumulative Layout Shift',
        sub: 'Shimmer skeleton layouts ensure total visual stability during loading.',
        color: GSF_RED,
      },
    ];

    kpis.forEach((k, idx) => {
      const xPos = 0.8 + idx * 2.98;
      s7.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 1.65,
        w: 2.78,
        h: 2.4,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      s7.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 1.65,
        w: 2.78,
        h: 0.06,
        fill: { color: k.color },
        line: { color: k.color },
        rectRadius: 0.03,
      });

      s7.addText(k.metric, {
        x: xPos + 0.15,
        y: 1.85,
        w: 2.48,
        h: 0.55,
        fontSize: 26,
        fontFace: 'Arial',
        color: k.color,
        bold: true,
      });

      s7.addText(k.label, {
        x: xPos + 0.15,
        y: 2.45,
        w: 2.48,
        h: 0.45,
        fontSize: 12,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
      });

      s7.addText(k.sub, {
        x: xPos + 0.15,
        y: 2.95,
        w: 2.48,
        h: 0.95,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: TEXT_MUTED,
        lineSpacing: 15,
      });
    });

    // ROI Bottom Cards
    const roiItems = [
      {
        icon: '📈',
        title: 'Conversion Rate Lift',
        desc: 'Industry data demonstrates a 1% conversion increase for every 100ms shaved off page load time. Sub-second speed drives higher mobile checkout completion.',
        color: GSF_NAVY,
      },
      {
        icon: '🔄',
        title: 'Drastic Reduction in Returns',
        desc: '100% pre-purchase fitment verification directly curtails the £15–£25 cost of each incorrect part return and subsequent customer service handling.',
        color: GSF_GREEN,
      },
      {
        icon: '☁️',
        title: 'Zero Middleware Cloud Costs',
        desc: 'No dedicated Node.js render cluster or ACCS server fleet required. Pure edge CDN distribution slashes monthly infrastructure spending.',
        color: GSF_RED,
      },
    ];

    roiItems.forEach((r, idx) => {
      const xPos = 0.8 + idx * 3.98;
      s7.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 4.3,
        w: 3.78,
        h: 2.45,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      s7.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 4.3,
        w: 3.78,
        h: 0.06,
        fill: { color: r.color },
        line: { color: r.color },
        rectRadius: 0.03,
      });

      s7.addText(`${r.icon}  ${r.title}`, {
        x: xPos + 0.2,
        y: 4.55,
        w: 3.38,
        h: 0.4,
        fontSize: 13,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
      });

      s7.addText(r.desc, {
        x: xPos + 0.2,
        y: 5.05,
        w: 3.38,
        h: 1.5,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: TEXT_BODY,
        lineSpacing: 16,
      });
    });
  }

  // ==========================================
  // SLIDE 8: SUMMARY & STRATEGIC ROADMAP
  // ==========================================
  {
    const s8 = createStandardSlide(
      'Conclusion & Production Rollout Roadmap',
      'The path from successful Proof of Concept to full enterprise storefront deployment.',
      'ROADMAP & ROLLOUT'
    );

    const roadmapPhases = [
      {
        phase: 'PHASE 1',
        title: 'POC Validation (Complete)',
        status: 'STATUS: DELIVERED',
        statusColor: GSF_GREEN,
        items: [
          '✔ 100/100 Core Web Vitals achieved',
          '✔ Live DVLA VRM lookup & session engine',
          '✔ Direct Magento 2 GraphQL integration',
          '✔ Dual-view PLP & fitment-checked PDP',
          '✔ Adobe Sidekick preview & live publish',
        ],
      },
      {
        phase: 'PHASE 2',
        title: 'Omnichannel Integration',
        status: 'TARGET: Q1 2027',
        statusColor: GSF_NAVY,
        items: [
          '• Real-time branch stock (180+ stores)',
          '• 30-min Click & Collect branch picker',
          '• Customer account & saved garage sync',
          '• Full checkout & payment gateway',
          '• Trade pricing & workshop discounts',
        ],
      },
      {
        phase: 'PHASE 3',
        title: 'API Mesh & Enterprise Scale',
        status: 'TARGET: Q2 2027',
        statusColor: 'D97706',
        items: [
          '• Activate Adobe App Builder API Mesh',
          '• Unified GraphQL schema across ERP/WMS',
          '• Trade portal & B2B garage accounts',
          '• Progressive Web App (PWA) offline mode',
          '• Multi-warehouse inventory routing',
        ],
      },
    ];

    roadmapPhases.forEach((ph, idx) => {
      const xPos = 0.8 + idx * 3.98;
      s8.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 1.65,
        w: 3.78,
        h: 5.1,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1.2 },
        rectRadius: 0.08,
      });

      s8.addShape(pptx.shapes.RECTANGLE, {
        x: xPos,
        y: 1.65,
        w: 3.78,
        h: 0.08,
        fill: { color: ph.statusColor },
        line: { color: ph.statusColor },
        rectRadius: 0.04,
      });

      s8.addText(ph.phase, {
        x: xPos + 0.25,
        y: 1.88,
        w: 3.28,
        h: 0.25,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: GSF_RED,
        bold: true,
        letterSpacing: 1.2,
      });

      s8.addText(ph.title, {
        x: xPos + 0.25,
        y: 2.15,
        w: 3.28,
        h: 0.55,
        fontSize: 15,
        fontFace: 'Arial',
        color: TEXT_DARK,
        bold: true,
      });

      // Status Pill
      s8.addShape(pptx.shapes.RECTANGLE, {
        x: xPos + 0.25,
        y: 2.8,
        w: 2.4,
        h: 0.32,
        fill: { color: SLIDE_BG },
        line: { color: ph.statusColor, width: 1.2 },
        rectRadius: 0.05,
      });
      s8.addText(ph.status, {
        x: xPos + 0.25,
        y: 2.8,
        w: 2.4,
        h: 0.32,
        fontSize: 8.5,
        fontFace: 'Arial',
        color: ph.statusColor,
        bold: true,
        align: 'center',
        valign: 'middle',
      });

      s8.addText(ph.items.join('\n\n'), {
        x: xPos + 0.25,
        y: 3.35,
        w: 3.28,
        h: 3.2,
        fontSize: 10.5,
        fontFace: 'Arial',
        color: TEXT_BODY,
        lineSpacing: 18,
      });
    });
  }

  // Save presentation
  const outputPath = path.join(__dirname, '..', 'GSF_Car_Parts_EDS_POC.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`Presentation successfully written to: ${outputPath}`);
}

createPresentation().catch((err) => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
