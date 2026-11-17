import {
  loadHeader,
  loadFooter,
  decorateBlocks,
  loadSections,
  loadSection,
  loadCSS,
} from './aem.js';

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    const firstSection = main.querySelector('.section');
    if (firstSection) {
      await loadSection(firstSection);
    }
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const header = doc.querySelector('header');
  if (header) loadHeader(header);

  const main = doc.querySelector('main');
  if (main) await loadSections(main);

  const footer = doc.querySelector('footer');
  if (footer) loadFooter(footer);

  loadCSS(`${window.hlx?.codeBasePath || ''}/styles/styles.css`);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
}

loadPage();
