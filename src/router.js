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
    try {
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
    } catch (err) {
      console.error('[router] page render/mount error:', err);
      app.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #EF4444; background: #000; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; box-sizing: border-box;">
          <h2 style="margin-bottom: 10px;">⚠️ VictorMeet UI Error</h2>
          <p style="color: #A3A3A3; max-width: 500px; margin-bottom: 20px; font-size: 14px; line-height: 1.5;">
            An error occurred while loading this page: <strong>${err.message}</strong>
          </p>
          <pre style="background: #111; color: #F43F5E; padding: 15px; border-radius: 8px; font-size: 12px; text-align: left; max-width: 90%; overflow-x: auto; border: 1px solid #222; font-family: monospace; white-space: pre-wrap; word-break: break-all;">${err.stack}</pre>
          <a href="#/landing" style="margin-top: 25px; padding: 10px 24px; background: #0052FF; color: #FFF; text-decoration: none; font-weight: bold; border-radius: 8px; transition: opacity 0.15s;">Return to Home Page</a>
        </div>
      `;
      app.style.opacity = '1';
      app.style.transform = 'translateY(0)';
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
      width: 100%;
      height: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
  `;
  document.head.appendChild(style);

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
