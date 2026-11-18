const { chromium } = require('playwright');

async function testLive() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('favicon') && !text.includes('analytics')) {
      console.log('PAGE LOG:', text);
    }
  });

  try {
    console.log('Navigating to live PLP with vrm=AK16NXV...');
    await page.goto('https://main--gsf-poc--prateek654321.aem.live/plp.html?category_id=5461&category_name=Braking&vrm=AK16NXV', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    const countText = await page.evaluate(() => document.querySelector('.plp-results-count')?.innerText);
    console.log('Results count:', countText);

    const firstProduct = await page.evaluate(() => document.querySelector('.product-card .card-title')?.innerText);
    console.log('First product card title:', firstProduct);

    const tabFitted = await page.evaluate(() => document.querySelector('#tab-fitted-count')?.innerText);
    const tabAll = await page.evaluate(() => document.querySelector('#tab-all-count')?.innerText);
    console.log(`Tabs => Fitted: ${tabFitted}, All: ${tabAll}`);

    // Check Brake Pads specific page
    console.log('\nNavigating to live PLP Brake Pads (5467)...');
    await page.goto('https://main--gsf-poc--prateek654321.aem.live/plp.html?category_id=5467&category_name=Brake%20Pads&vrm=AK16NXV', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const padsCount = await page.evaluate(() => document.querySelector('.plp-results-count')?.innerText);
    console.log('Brake Pads Results count:', padsCount);

    // Check Brake Discs specific page
    console.log('\nNavigating to live PLP Brake Discs (5470)...');
    await page.goto('https://main--gsf-poc--prateek654321.aem.live/plp.html?category_id=5470&category_name=Brake%20Discs&vrm=AK16NXV', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const discsCount = await page.evaluate(() => document.querySelector('.plp-results-count')?.innerText);
    console.log('Brake Discs Results count:', discsCount);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}
testLive();
