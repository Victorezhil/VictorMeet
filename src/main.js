// ============================================================
// VictorMeet — Application Entry Point
// ============================================================

import { inject } from '@vercel/analytics';
import { initRouter, registerRoute, navigate } from './router.js';
import { loadUserFromStorage, getState } from './state.js';
import { initSocket } from './socket.js';

import * as landing from './pages/landing.js';
import * as auth from './pages/auth.js';
import * as chat from './pages/chat.js';
import * as profile from './pages/profile.js';
import * as pricing from './pages/pricing.js';
import * as settings from './pages/settings.js';
import * as report from './pages/report.js';

async function init() {
  // ── Initialize Vercel Web Analytics ─────────────────────────
  inject();

  // ── Register all routes ─────────────────────────────────────
  registerRoute('/landing', landing);
  registerRoute('/auth', auth);
  registerRoute('/chat', chat);
  registerRoute('/profile', profile);
  registerRoute('/pricing', pricing);
  registerRoute('/settings', settings);
  registerRoute('/report', report);

  // ── Restore persisted session ───────────────────────────────
  await loadUserFromStorage();

  // ── Boot socket immediately to load real-time online counter ──
  initSocket();

  // ── Start the router (renders the first page) ──────────────
  initRouter();
}

init().catch((err) => {
  console.error('[main] init failed:', err);
});
