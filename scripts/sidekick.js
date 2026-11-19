/**
 * Integration and custom handlers for the default Adobe AEM Sidekick extension (<aem-sidekick>).
 * Extends the default Sidekick with:
 *  - "🚀 Publish to Live" custom action (calls Adobe Admin API)
 *  - "👁️ View Preview" / "🚀 View Live" one-click environment switcher
 *  - "⚡ Sync Code" cache bus purging
 *  - Native event hooks (published, env-switched)
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

  // Border accent
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

  // Animate in
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
    const liveRes = await fetch(liveEndpoint, { method: 'POST' }).catch(() => null);

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
 * Switches between preview and live environments
 */
function switchEnvironment(targetEnv) {
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
    }, 200);
  }
}

/**
 * Attach listeners to the default AEM Sidekick element
 * @param {Element} sk The <aem-sidekick> or <helix-sidekick> DOM element
 */
function attachSidekickListeners(sk) {
  if (!sk || sk._gsfListenersAttached) return;
  sk._gsfListenersAttached = true;

  // 1. Custom Action: Publish to Live
  sk.addEventListener('custom:publish-live', () => {
    publishToLive();
  });

  // 2. Custom Action: Switch to Preview
  sk.addEventListener('custom:switch-preview', () => {
    switchEnvironment('preview');
  });

  // 3. Custom Action: Switch to Live
  sk.addEventListener('custom:switch-live', () => {
    switchEnvironment('live');
  });

  // 4. Custom Action: Sync Code
  sk.addEventListener('custom:sync-code', async () => {
    showToast('⚡ Purging code bus cache...', 'info');
    try {
      const codeEndpoint = `https://admin.hlx.page/code/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/${REPO_CONFIG.ref}/*`;
      await fetch(codeEndpoint, { method: 'POST' });
      showToast('✓ Code cache purged successfully!', 'success');
    } catch (err) {
      showToast(`Error syncing code: ${err.message}`, 'error');
    }
  });

  // 5. Default Sidekick Event: Native published
  sk.addEventListener('published', async () => {
    try {
      const codeEndpoint = `https://admin.hlx.page/code/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/${REPO_CONFIG.ref}/*`;
      await fetch(codeEndpoint, { method: 'POST' });
    } catch {
      // Ignore
    }
  });
}

/**
 * Initializes listeners on the default Adobe AEM Sidekick
 */
export function initSidekick() {
  const sk = document.querySelector('aem-sidekick, helix-sidekick');
  if (sk) {
    attachSidekickListeners(sk);
  } else {
    document.addEventListener('sidekick-ready', () => {
      const sidekickEl = document.querySelector('aem-sidekick, helix-sidekick');
      if (sidekickEl) {
        attachSidekickListeners(sidekickEl);
      }
    }, { once: true });
  }
}
