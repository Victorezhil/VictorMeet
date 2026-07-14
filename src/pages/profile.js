// ============================================================
// VictorMeet — Profile Page
// ============================================================

import { getState, setState, subscribe } from '../state.js';
import { navigate } from '../router.js';

let unsubs = [];

// ── Render ────────────────────────────────────────────────────

export function render() {
  const user = getState('user');

  if (!user) {
    return `<div class="page-loading">Redirecting…</div>`;
  }

  const initial = (user.nickname || user.email || '?')[0].toUpperCase();
  const interests = (user.interests || []).join(', ');
  const isPremium = user.accountType === 'premium';

  return `
    <nav class="navbar">
      <a href="#/landing" class="nav-logo">VictorMeet</a>
      <div class="nav-links">
        <a href="#/chat" class="nav-link">Chat</a>
        <a href="#/pricing" class="nav-link">Pricing</a>
        <a href="#/settings" class="nav-link">Settings</a>
      </div>
    </nav>

    <div class="profile-page">
      <div class="profile-header">
        <div class="profile-avatar">${initial}</div>
        <h2 class="profile-nickname">${user.nickname || 'Anonymous'}</h2>
        <p class="profile-email">${user.email || 'Guest account'}</p>
        <span class="badge ${isPremium ? 'badge-premium' : 'badge-free'}">
          ${isPremium ? '⭐ Premium' : 'Free'}
        </span>
      </div>

      <!-- Subscription card -->
      <div class="card profile-subscription">
        <h3>Subscription</h3>
        ${
          isPremium
            ? `<p>Your premium subscription is active.</p>
               <p class="text-muted">Expires: ${user.premiumExpiry || 'N/A'}</p>`
            : `<p>You are on the free plan.</p>
               <button class="btn btn-primary" id="upgradeBtn">Upgrade to Premium</button>`
        }
      </div>

      <!-- Token balance -->
      <div class="card profile-tokens">
        <h3>Token Balance</h3>
        <p class="token-balance">${user.tokens ?? 0} <small>tokens</small></p>
      </div>

      <!-- Edit form -->
      <div class="card profile-edit">
        <h3>Edit Profile</h3>
        <form id="profileForm">
          <div class="form-group">
            <label class="label" for="editNickname">Nickname</label>
            <input class="input" type="text" id="editNickname" value="${user.nickname || ''}" />
          </div>
          <div class="form-group">
            <label class="label" for="editInterests">Interests <small>(comma separated)</small></label>
            <input class="input" type="text" id="editInterests" value="${interests}" />
          </div>
          <div class="profile-edit-error" id="profileError"></div>
          <button class="btn btn-primary" type="submit">Save Changes</button>
        </form>
      </div>
      <!-- Ad Unit 7 (Google AdSense - Below edit form) -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); margin: var(--space-6) auto; display: flex; flex-direction: column; align-items: center; overflow: hidden; max-width: 728px; width: 100%; box-sizing: border-box;">
        <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2); font-weight: 600;">Sponsored</span>
        <ins class="adsbygoogle"
             style="display:block; text-align:center;"
             data-ad-layout="in-article"
             data-ad-format="fluid"
             data-ad-client="ca-pub-9747982919206794"
             data-ad-slot="2148772293"></ins>
      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  // Trigger Google AdSense display load
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.warn('[AdSense] Load error:', e);
  }

  if (!getState('isAuthenticated')) {
    navigate('/auth');
    return;
  }

  // Upgrade button
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => navigate('/pricing'));
  }

  // Profile edit form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('profileError');
      errorEl.textContent = '';

      const nickname = document.getElementById('editNickname').value.trim();
      const interestsRaw = document.getElementById('editInterests').value.trim();
      const interests = interestsRaw
        ? interestsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getState('token')}`,
          },
          body: JSON.stringify({ nickname, interests }),
        });

        const data = await res.json();

        if (!res.ok) {
          errorEl.textContent = data.message || 'Failed to save profile.';
          return;
        }

        // Update global state
        setState('user', { ...getState('user'), nickname, interests });
        showToast('Profile updated successfully!');
      } catch (err) {
        console.error('[profile] save error:', err);
        errorEl.textContent = 'Network error. Please try again.';
      }
    });
  }

  // Listen for user changes to keep UI in sync
  const unsub = subscribe('user', () => {
    // Re-render is heavy; for small updates we patch DOM directly
    const user = getState('user');
    if (!user) return;

    const nicknameEl = document.querySelector('.profile-nickname');
    if (nicknameEl) nicknameEl.textContent = user.nickname || 'Anonymous';

    const balanceEl = document.querySelector('.token-balance');
    if (balanceEl) balanceEl.innerHTML = `${user.tokens ?? 0} <small>tokens</small>`;
  });
  unsubs.push(unsub);
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  unsubs.forEach((fn) => fn());
  unsubs = [];
}

// ── Helpers ───────────────────────────────────────────────────

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('toast-visible');
  setTimeout(() => toast.classList.remove('toast-visible'), 3000);
}
