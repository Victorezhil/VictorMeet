// ============================================================
// VictorMeet — Hash-based SPA Router
// ============================================================

/** @type {Record<string, {render: Function, mount?: Function, unmount?: Function}>} */
const routes = {};

let currentPage = null;
let currentCleanup = null;

/**
 * Register a hash-path to a page module.
 * @param {string} path      e.g. '/landing'
 * @param {object} pageModule  must expose render(), and optionally mount() / unmount()
 */
export function registerRoute(path, pageModule) {
  routes[path] = pageModule;
}

/**
 * Programmatic navigation — simply sets the hash.
 * @param {string} path  e.g. '/chat'
 */
export function navigate(path) {
  window.location.hash = path;
}

/**
 * Internal handler executed on every hash change.
 */
function handleRoute() {
  const hash = window.location.hash.slice(1) || '/landing';

  // Run previous page's cleanup / unmount
  if (currentCleanup) {
    try {
      currentCleanup();
    } catch (err) {
      console.error('[router] unmount error:', err);
    }
    currentCleanup = null;
  }

  if (currentPage && currentPage.unmount) {
    try {
      currentPage.unmount();
    } catch (err) {
      console.error('[router] unmount error:', err);
    }
  }

  const page = routes[hash];

  if (!page) {
    navigate('/landing');
    return;
  }

  const app = document.getElementById('app');
  if (!app) return;

  // Start page-exit transition
  app.style.opacity = '0';
  app.style.transform = 'translateY(10px)';

  setTimeout(() => {
    app.innerHTML = page.render();

    // Trigger page-enter transition
    requestAnimationFrame(() => {
      app.style.opacity = '1';
      app.style.transform = 'translateY(0)';
    });

    currentPage = page;

    if (page.mount) {
      const cleanup = page.mount();
      // mount() may return an explicit cleanup function
      if (typeof cleanup === 'function') {
        currentCleanup = cleanup;
      }
    }
  }, 150);
}

/**
 * Boot the router — call once on app init.
 */
export function initRouter() {
  // Inject transition CSS once
  const style = document.createElement('style');
  style.textContent = `
    #app {
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
  `;
  document.head.appendChild(style);

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
