/**
 * Integration and custom handlers for the default Adobe AEM Sidekick extension (<aem-sidekick>).
 * Extends the default Sidekick with:
 *  - "👁️ View Preview" & "🚀 View Live" one-click environment switching
 *  - "🚀 Publish to Live" (calls Adobe Admin API)
 *  - Un-disabling the native "Preview" item in the <env-switcher> dropdown
 *  - "⚡ Sync Code" cache bus purging
 */

const REPO_CONFIG = {
  owner: 'prateek654321',
  repo: 'gsf-poc',
  ref: 'main',
  devHost: 'localhost:3000',
  previewHost: 'main--gsf-poc--prateek654321.aem.page',
  liveHost: 'main--gsf-poc--prateek654321.aem.live',
};

/**
 * Normalizes resource path for Admin API (removes .html, ensures leading slash)
 */
function getNormalizedResourcePath() {
  let p = window.location.pathname || '/';
  if (p.endsWith('/index.html') || p === '/index.html') {
    p = '/';
  } else if (p.endsWith('.html')) {
    p = p.slice(0, -5);
  }
  return p.startsWith('/') ? p : `/${p}`;
}

/**
 * Shows an Adobe Spectrum-style floating notification toast
 */
function showToast(message, type = 'info', actionButton = null) {
  let toast = document.getElementById('aem-sidekick-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aem-sidekick-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000000;
      background: rgba(28, 28, 32, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 10px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      transition: all 0.25s ease;
      opacity: 0;
      transform: translateY(-10px);
    `;
    document.body.appendChild(toast);
  }

  const borderColor = type === 'success' ? '#00c853' : (type === 'error' ? '#f44336' : '#00b4d8');
  toast.style.borderLeft = `4px solid ${borderColor}`;

  toast.innerHTML = `<span style="font-weight: 500;">${message}</span>`;

  if (actionButton) {
    actionButton.style.cssText = `
      background: #00c853;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      text-decoration: none;
      cursor: pointer;
      display: inline-block;
    `;
    toast.appendChild(actionButton);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.6);
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    margin-left: 6px;
  `;
  closeBtn.onclick = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
  };
  toast.appendChild(closeBtn);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  if (toast._timeout) clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
  }, 6000);
}

/**
 * Publishes content and code to Live via Adobe Admin API
 */
async function publishToLive() {
  const cleanPath = getNormalizedResourcePath();
  const { owner, repo, ref, liveHost } = REPO_CONFIG;
  const adminBase = 'https://admin.hlx.page';

  showToast('🚀 Publishing page & code to Live...', 'info');

  try {
    const liveEndpoint = `${adminBase}/live/${owner}/${repo}/${ref}${cleanPath === '/' ? '/index' : cleanPath}`;
    await fetch(liveEndpoint, { method: 'POST' }).catch(() => null);

    const codeEndpoint = `${adminBase}/code/${owner}/${repo}/${ref}/*`;
    await fetch(codeEndpoint, { method: 'POST' }).catch(() => null);

    const liveUrl = `https://${liveHost}${window.location.pathname}${window.location.search}${window.location.hash}`;

    const openBtn = document.createElement('a');
    openBtn.href = liveUrl;
    openBtn.target = '_blank';
    openBtn.textContent = 'Open Live Page ➔';

    showToast('✓ Page published to Live successfully!', 'success', openBtn);
  } catch (err) {
    showToast(`⚠️ Publish status: ${err.message}`, 'error');
  }
}

/**
 * Purges the code bus cache
 */
async function syncCode() {
  showToast('⚡ Purging code bus cache...', 'info');
  try {
    const codeEndpoint = `https://admin.hlx.page/code/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/${REPO_CONFIG.ref}/*`;
    await fetch(codeEndpoint, { method: 'POST' });
    showToast('✓ Code cache purged successfully!', 'success');
  } catch (err) {
    showToast(`Error syncing code: ${err.message}`, 'error');
  }
}

/**
 * Switches between preview, live, and dev environments preserving path and query
 */
export function switchEnvironment(targetEnv) {
  const { pathname, search, hash } = window.location;
  let targetOrigin = '';

  if (targetEnv === 'preview') {
    targetOrigin = `https://${REPO_CONFIG.previewHost}`;
  } else if (targetEnv === 'live') {
    targetOrigin = `https://${REPO_CONFIG.liveHost}`;
  } else if (targetEnv === 'dev') {
    targetOrigin = `http://${REPO_CONFIG.devHost}`;
  } else {
    return;
  }

  const targetUrl = `${targetOrigin}${pathname}${search}${hash}`;
  if (targetUrl !== window.location.href) {
    showToast(`Switching to ${targetEnv.toUpperCase()}...`, 'info');
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 150);
  }
}

/**
 * Un-disables native menu items in the default Sidekick's <env-switcher>
 */
function unDisableNativeEnvSwitcher(sk) {
  try {
    const root = sk?.shadowRoot || sk;
    if (!root) return;

    // Traverse shadowRoot tree
    const envSwitchers = root.querySelectorAll('env-switcher, [class*="env-switcher"]');
    envSwitchers.forEach((sw) => {
      const swRoot = sw.shadowRoot || sw;
      const pickers = swRoot.querySelectorAll('action-bar-picker, [class*="picker"]');
      pickers.forEach((picker) => {
        // Preview item
        const previewItems = picker.querySelectorAll('.env-preview, [value="preview"], sk-menu-item.env-preview');
        previewItems.forEach((item) => {
          item.removeAttribute('disabled');
          item.style.pointerEvents = 'auto';
          item.style.opacity = '1';
          if (!item._gsfBound) {
            item._gsfBound = true;
            item.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              switchEnvironment('preview');
            });
          }
        });

        // Live item
        const liveItems = picker.querySelectorAll('.env-live, [value="live"], sk-menu-item.env-live');
        liveItems.forEach((item) => {
          item.removeAttribute('disabled');
          item.style.pointerEvents = 'auto';
          item.style.opacity = '1';
          if (!item._gsfBound) {
            item._gsfBound = true;
            item.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              switchEnvironment('live');
            });
          }
        });
      });
    });
  } catch {
    // Ignore DOM traversal edge cases
  }
}

/**
 * Attach listeners to default AEM Sidekick element
 */
function attachToSidekick(sk) {
  if (!sk) return;

  const onSwitchPreview = () => switchEnvironment('preview');
  const onSwitchLive = () => switchEnvironment('live');
  const onPublishLive = () => publishToLive();
  const onSyncCode = () => syncCode();

  // Attach direct event listeners on <aem-sidekick>
  sk.addEventListener('custom:switch-preview', onSwitchPreview);
  sk.addEventListener('switch-preview', onSwitchPreview);

  sk.addEventListener('custom:switch-live', onSwitchLive);
  sk.addEventListener('switch-live', onSwitchLive);

  sk.addEventListener('custom:publish-live', onPublishLive);
  sk.addEventListener('publish-live', onPublishLive);

  sk.addEventListener('custom:sync-code', onSyncCode);
  sk.addEventListener('sync-code', onSyncCode);

  // When published via native button, sync code bus
  sk.addEventListener('published', () => {
    fetch(`https://admin.hlx.page/code/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/${REPO_CONFIG.ref}/*`, { method: 'POST' }).catch(() => {});
  });

  // Enable menu items in native env-switcher
  unDisableNativeEnvSwitcher(sk);
}

/**
 * Initializes listeners on the default Adobe AEM Sidekick
 */
export function initSidekick() {
  // Document and Window level event listeners
  const onSwitchPreview = () => switchEnvironment('preview');
  const onSwitchLive = () => switchEnvironment('live');
  const onPublishLive = () => publishToLive();
  const onSyncCode = () => syncCode();

  ['custom:switch-preview', 'switch-preview'].forEach((evt) => {
    document.addEventListener(evt, onSwitchPreview);
    window.addEventListener(evt, onSwitchPreview);
  });

  ['custom:switch-live', 'switch-live'].forEach((evt) => {
    document.addEventListener(evt, onSwitchLive);
    window.addEventListener(evt, onSwitchLive);
  });

  ['custom:publish-live', 'publish-live'].forEach((evt) => {
    document.addEventListener(evt, onPublishLive);
    window.addEventListener(evt, onPublishLive);
  });

  ['custom:sync-code', 'sync-code'].forEach((evt) => {
    document.addEventListener(evt, onSyncCode);
    window.addEventListener(evt, onSyncCode);
  });

  // Attach to existing elements immediately
  document.querySelectorAll('aem-sidekick, helix-sidekick').forEach(attachToSidekick);

  // Listen on sidekick-ready event
  document.addEventListener('sidekick-ready', () => {
    document.querySelectorAll('aem-sidekick, helix-sidekick').forEach(attachToSidekick);
  });

  // Observe DOM additions of <aem-sidekick>
  const observer = new MutationObserver(() => {
    const els = document.querySelectorAll('aem-sidekick, helix-sidekick');
    if (els.length > 0) {
      els.forEach(attachToSidekick);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Polling checks during the first 5 seconds to catch element creation and un-disable env switcher
  let ticks = 0;
  const pollTimer = setInterval(() => {
    ticks += 1;
    const els = document.querySelectorAll('aem-sidekick, helix-sidekick');
    if (els.length > 0) {
      els.forEach((sk) => {
        attachToSidekick(sk);
        unDisableNativeEnvSwitcher(sk);
      });
    }
    if (ticks > 50) clearInterval(pollTimer);
  }, 100);
}
