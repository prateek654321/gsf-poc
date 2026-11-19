import {
  loadHeader,
  loadFooter,
  decorateSections,
  decorateBlocks,
  loadSections,
  loadSection,
  loadCSS,
} from './aem.js';
import { loadConfig } from './config.js';

// Clean URL: Keep homepage URL as clean '/' without index.html
if (window.location.pathname.endsWith('/index.html') || window.location.pathname === '/index.html') {
  const cleanUrl = '/' + (window.location.search || '') + (window.location.hash || '');
  window.history.replaceState({}, '', cleanUrl);
}

// Global top loader state
let loaderEl = null;
let loaderProgressTimer = null;

export function getGlobalLoader() {
  if (!loaderEl) {
    loaderEl = document.getElementById('global-top-loader');
    if (!loaderEl) {
      loaderEl = document.createElement('div');
      loaderEl.id = 'global-top-loader';
      document.body.prepend(loaderEl);
    }
  }
  return loaderEl;
}

export function showPageLoader() {
  const loader = getGlobalLoader();
  if (loaderProgressTimer) clearInterval(loaderProgressTimer);
  loader.style.transition = 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease';
  loader.classList.add('active');
  loader.style.width = '30%';

  let current = 30;
  loaderProgressTimer = setInterval(() => {
    if (current < 85) {
      current += Math.random() * 12;
      loader.style.width = `${Math.min(current, 85)}%`;
    }
  }, 180);
}

export function hidePageLoader() {
  const loader = getGlobalLoader();
  if (loaderProgressTimer) clearInterval(loaderProgressTimer);
  loader.style.width = '100%';
  setTimeout(() => {
    loader.classList.remove('active');
    setTimeout(() => {
      loader.style.width = '0%';
    }, 250);
  }, 180);
  document.body.classList.remove('page-navigating');
}

// Smooth page transitions across internal site links
function initPageTransitions() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;

    try {
      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
        showPageLoader();
        document.body.classList.add('page-navigating');
      }
    } catch {
      // Ignore invalid URL
    }
  });

  window.addEventListener('pageshow', () => {
    hidePageLoader();
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  await loadConfig();
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

  const footer = doc.querySelector('footer');
  if (footer) loadFooter(footer);

  const main = doc.querySelector('main');
  if (main) await loadSections(main);

  loadCSS(`${window.hlx?.codeBasePath || ''}/styles/styles.css`);
  initPageTransitions();

  // Attach custom handlers and extra features to the default Adobe AEM Sidekick
  import('./sidekick.js').then(({ initSidekick }) => {
    initSidekick();
  }).catch((err) => {
    console.warn('Could not initialize Sidekick listeners:', err);
  });
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
}

loadPage();
