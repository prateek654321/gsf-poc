// Node test environment setup for Adobe Edge Delivery Services
if (typeof globalThis.window === 'undefined') {
  const storage = new Map();
  globalThis.window = {
    location: {
      origin: 'https://main--gsf-poc--prateek654321.aem.page',
      pathname: '/',
      search: '',
      hash: '',
    },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, val) => storage.set(key, String(val)),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
    },
    sessionStorage: {
      getItem: (key) => storage.get(`session_${key}`) || null,
      setItem: (key, val) => storage.set(`session_${key}`, String(val)),
      removeItem: (key) => storage.delete(`session_${key}`),
      clear: () => storage.clear(),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    CONFIG: {},
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    head: {
      querySelectorAll: () => [],
      querySelector: () => null,
    },
    documentElement: { lang: 'en' },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
}
