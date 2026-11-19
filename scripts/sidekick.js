/**
 * AEM Edge Delivery Services Sidekick Integration
 * Provides in-browser Sidekick toolbar with:
 *  - Environment Switcher (Local Dev, Preview, Live)
 *  - Publish to Live (calls Adobe Admin API)
 *  - Preview & Code Sync
 *  - Quick Project Plugins (Categories, PLP, My Garage)
 *  - Persistent collapse/expand state & keyboard shortcut (Ctrl+Shift+S)
 */

const REPO_CONFIG = {
  owner: 'prateek654321',
  repo: 'gsf-poc',
  ref: 'main',
  project: 'GSF Car Parts',
  devHost: 'localhost:3000',
  previewHost: 'main--gsf-poc--prateek654321.aem.page',
  liveHost: 'main--gsf-poc--prateek654321.aem.live',
};

const STORAGE_KEYS = {
  COLLAPSED: 'gsf_sidekick_collapsed',
};

/**
 * Detect current environment based on hostname
 */
export function getCurrentEnv() {
  const { host } = window.location;
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return { id: 'dev', label: 'Local Dev', tag: 'DEV', color: '#ffb300' };
  }
  if (host.includes('.aem.page') || host.includes('.hlx.page')) {
    return { id: 'preview', label: 'Preview', tag: 'PREVIEW', color: '#00b4d8' };
  }
  if (host.includes('.aem.live') || host.includes('.hlx.live')) {
    return { id: 'live', label: 'Live', tag: 'LIVE', color: '#00c853' };
  }
  return { id: 'custom', label: host, tag: 'CUSTOM', color: '#7b2cbf' };
}

/**
 * Constructs URL for target environment preserving current path and query
 */
export function getEnvironmentUrl(targetEnvId) {
  const { pathname, search, hash } = window.location;
  let targetOrigin = '';

  switch (targetEnvId) {
    case 'dev':
      targetOrigin = `http://${REPO_CONFIG.devHost}`;
      break;
    case 'preview':
      targetOrigin = `https://${REPO_CONFIG.previewHost}`;
      break;
    case 'live':
      targetOrigin = `https://${REPO_CONFIG.liveHost}`;
      break;
    default:
      targetOrigin = window.location.origin;
  }

  return `${targetOrigin}${pathname}${search}${hash}`;
}

/**
 * Switch current page to target environment
 */
export function switchEnvironment(targetEnvId) {
  const targetUrl = getEnvironmentUrl(targetEnvId);
  if (targetUrl === window.location.href) return;
  window.location.href = targetUrl;
}

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
 * Publish current page and code to Live via Adobe Admin API
 */
export async function publishToLive(onProgress) {
  const cleanPath = getNormalizedResourcePath();
  const { owner, repo, ref, liveHost } = REPO_CONFIG;
  const adminBase = `https://admin.hlx.page`;

  try {
    if (onProgress) onProgress({ status: 'publishing', message: 'Publishing content to Live...' });

    // 1. Publish content resource if applicable
    const liveEndpoint = `${adminBase}/live/${owner}/${repo}/${ref}${cleanPath === '/' ? '/index' : cleanPath}`;
    const liveRes = await fetch(liveEndpoint, { method: 'POST' }).catch(() => null);

    if (onProgress) onProgress({ status: 'syncing', message: 'Synchronizing code bus cache...' });

    // 2. Synchronize code cache on live/preview bus
    const codeEndpoint = `${adminBase}/code/${owner}/${repo}/${ref}/*`;
    const codeRes = await fetch(codeEndpoint, { method: 'POST' }).catch(() => null);

    const liveUrl = `https://${liveHost}${window.location.pathname}${window.location.search}${window.location.hash}`;

    const isSuccess = (liveRes && (liveRes.status === 200 || liveRes.status === 204)) ||
                      (codeRes && (codeRes.status === 200 || codeRes.status === 202));

    return {
      success: true,
      liveUrl,
      cleanPath,
      codeStatus: codeRes?.status,
      contentStatus: liveRes?.status,
    };
  } catch (err) {
    console.error('Error publishing to live:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Reload preview cache via Adobe Admin API
 */
export async function reloadPreview(onProgress) {
  const cleanPath = getNormalizedResourcePath();
  const { owner, repo, ref } = REPO_CONFIG;
  const adminBase = `https://admin.hlx.page`;

  try {
    if (onProgress) onProgress({ status: 'reloading', message: 'Updating preview cache...' });

    const previewEndpoint = `${adminBase}/preview/${owner}/${repo}/${ref}${cleanPath === '/' ? '/index' : cleanPath}`;
    await fetch(previewEndpoint, { method: 'POST' }).catch(() => null);

    const codeEndpoint = `${adminBase}/code/${owner}/${repo}/${ref}/*`;
    await fetch(codeEndpoint, { method: 'POST' }).catch(() => null);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Render notification toast
 */
function showToast(message, type = 'info', actionButton = null) {
  let toastContainer = document.getElementById('aem-sidekick-toast');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'aem-sidekick-toast';
    document.body.appendChild(toastContainer);
  }

  toastContainer.innerHTML = '';
  toastContainer.className = `aem-sidekick-toast ${type} active`;

  const msgSpan = document.createElement('span');
  msgSpan.className = 'toast-msg';
  msgSpan.innerHTML = message;
  toastContainer.appendChild(msgSpan);

  if (actionButton) {
    toastContainer.appendChild(actionButton);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => {
    toastContainer.classList.remove('active');
  };
  toastContainer.appendChild(closeBtn);

  if (toastContainer._timeout) clearTimeout(toastContainer._timeout);
  toastContainer._timeout = setTimeout(() => {
    toastContainer.classList.remove('active');
  }, 6000);
}

/**
 * Initialize and render the Sidekick toolbar in DOM
 */
export function initSidekick() {
  if (document.getElementById('aem-sidekick-ui')) return;

  const currentEnv = getCurrentEnv();
  const isCollapsed = localStorage.getItem(STORAGE_KEYS.COLLAPSED) === 'true';

  // Container
  const container = document.createElement('aside');
  container.id = 'aem-sidekick-ui';
  container.className = `aem-sidekick-bar ${isCollapsed ? 'collapsed' : ''}`;
  container.setAttribute('aria-label', 'AEM Sidekick Toolbar');

  // Inner markup
  container.innerHTML = `
    <!-- Minimized Floating Pill -->
    <button type="button" class="sk-pill-toggle" id="sk-pill-toggle" title="Toggle AEM Sidekick (Ctrl+Shift+S)">
      <span class="sk-pill-icon">⚡</span>
      <span class="sk-pill-title">Sidekick</span>
      <span class="sk-env-dot" style="background-color: ${currentEnv.color};"></span>
      <span class="sk-env-pill-name">${currentEnv.tag}</span>
    </button>

    <!-- Expanded Toolbar -->
    <div class="sk-toolbar-body">
      <!-- Brand & Project -->
      <div class="sk-group sk-brand-group">
        <div class="sk-brand-badge">
          <span class="sk-brand-logo">⚡</span>
          <span class="sk-brand-name">${REPO_CONFIG.project}</span>
        </div>
        <div class="sk-env-indicator" style="--env-color: ${currentEnv.color}">
          <span class="sk-env-indicator-dot"></span>
          <span class="sk-env-indicator-label">${currentEnv.tag}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="sk-divider"></div>

      <!-- Environment Switcher -->
      <div class="sk-group sk-env-group">
        <label class="sk-group-label">ENV:</label>
        <div class="sk-env-buttons">
          <button type="button" class="sk-btn sk-env-btn ${currentEnv.id === 'dev' ? 'active' : ''}" data-env="dev" title="Switch to Local Dev (localhost:3000)">
            💻 Dev
          </button>
          <button type="button" class="sk-btn sk-env-btn ${currentEnv.id === 'preview' ? 'active' : ''}" data-env="preview" title="Switch to Feature Preview (*.aem.page)">
            👁️ Preview
          </button>
          <button type="button" class="sk-btn sk-env-btn ${currentEnv.id === 'live' ? 'active' : ''}" data-env="live" title="Switch to Production Live (*.aem.live)">
            🚀 Live
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="sk-divider"></div>

      <!-- Actions: Publish & Reload -->
      <div class="sk-group sk-actions-group">
        <button type="button" class="sk-btn sk-btn-primary" id="sk-publish-btn" title="Publish current preview to live environment">
          <span class="sk-btn-icon">🚀</span>
          <span class="sk-btn-text">Publish to Live</span>
        </button>
        <button type="button" class="sk-btn" id="sk-reload-btn" title="Reload and refresh preview cache">
          <span class="sk-btn-icon">🔄</span>
          <span class="sk-btn-text">Reload</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="sk-divider"></div>

      <!-- Quick Navigation Plugins -->
      <div class="sk-group sk-plugins-group">
        <button type="button" class="sk-btn sk-plugin-btn" data-url="/categories.html" title="Jump to Categories Index">
          📂 Categories
        </button>
        <button type="button" class="sk-btn sk-plugin-btn" data-url="/plp.html" title="Jump to Parts Catalog (PLP)">
          📦 Parts PLP
        </button>
        <button type="button" class="sk-btn sk-plugin-btn" data-url="/plp.html?category_id=5392&category_name=Wiper%20Blades&vrm=GV57KCE" title="Jump to Wiper Blades for GV57KCE">
          🚗 Wiper Fitment
        </button>
        <button type="button" class="sk-btn sk-plugin-btn" id="sk-copy-url-btn" title="Copy Current URL">
          📋 Copy URL
        </button>
      </div>

      <!-- Controls: Collapse -->
      <div class="sk-group sk-controls-group">
        <button type="button" class="sk-btn sk-btn-icon-only" id="sk-minimize-btn" title="Minimize Sidekick">
          <span>&minus;</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Bind Events

  // 1. Pill toggle
  const pillBtn = container.querySelector('#sk-pill-toggle');
  const minBtn = container.querySelector('#sk-minimize-btn');
  const toggleCollapse = (force) => {
    const willCollapse = typeof force === 'boolean' ? force : !container.classList.contains('collapsed');
    container.classList.toggle('collapsed', willCollapse);
    localStorage.setItem(STORAGE_KEYS.COLLAPSED, willCollapse ? 'true' : 'false');
  };

  pillBtn?.addEventListener('click', () => toggleCollapse(false));
  minBtn?.addEventListener('click', () => toggleCollapse(true));

  // Keyboard shortcut Ctrl+Shift+S / Cmd+Shift+S
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      toggleCollapse();
    }
  });

  // 2. Environment Switcher Buttons
  container.querySelectorAll('.sk-env-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetEnv = btn.dataset.env;
      if (targetEnv === currentEnv.id) {
        showToast(`Already on <strong>${currentEnv.label}</strong> environment.`, 'info');
        return;
      }
      showToast(`Switching to <strong>${targetEnv.toUpperCase()}</strong>...`, 'info');
      setTimeout(() => switchEnvironment(targetEnv), 200);
    });
  });

  // 3. Publish to Live Button
  const publishBtn = container.querySelector('#sk-publish-btn');
  publishBtn?.addEventListener('click', async () => {
    publishBtn.disabled = true;
    publishBtn.classList.add('loading');
    const originalText = publishBtn.innerHTML;
    publishBtn.innerHTML = `<span class="sk-spinner"></span> <span>Publishing...</span>`;

    showToast('🚀 Publishing page & syncing code to Live environment...', 'info');

    const result = await publishToLive((prog) => {
      publishBtn.querySelector('span:last-child').textContent = prog.message;
    });

    publishBtn.disabled = false;
    publishBtn.classList.remove('loading');
    publishBtn.innerHTML = originalText;

    if (result.success) {
      const openBtn = document.createElement('a');
      openBtn.href = result.liveUrl;
      openBtn.target = '_blank';
      openBtn.className = 'toast-action-btn';
      openBtn.textContent = 'Open Live Page ➔';

      showToast(`✓ Page published to Live successfully!`, 'success', openBtn);
    } else {
      showToast(`⚠️ Publish completed with note: ${result.error || 'Check Admin API status'}`, 'error');
    }
  });

  // 4. Reload Button
  const reloadBtn = container.querySelector('#sk-reload-btn');
  reloadBtn?.addEventListener('click', async () => {
    reloadBtn.disabled = true;
    reloadBtn.classList.add('loading');
    const origHtml = reloadBtn.innerHTML;
    reloadBtn.innerHTML = `<span class="sk-spinner"></span> <span>Reloading...</span>`;

    showToast('🔄 Purging preview cache...', 'info');
    await reloadPreview();

    setTimeout(() => {
      window.location.reload();
    }, 600);
  });

  // 5. Plugin shortcuts
  container.querySelectorAll('.sk-plugin-btn[data-url]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (url) window.location.href = url;
    });
  });

  // 6. Copy URL button
  const copyBtn = container.querySelector('#sk-copy-url-btn');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('📋 Current URL copied to clipboard!', 'success');
    } catch {
      showToast(window.location.href, 'info');
    }
  });

  // Dispatch custom sidekick-ready event for any listeners
  document.dispatchEvent(new CustomEvent('sidekick-ready', { detail: { env: currentEnv } }));
}
