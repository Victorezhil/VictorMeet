// ============================================================
// VictorMeet — Auth Page (Login / Register / Guest)
// ============================================================

import { getState, setState } from '../state.js';
import { navigate } from '../router.js';
import { initSocket } from '../socket.js';

// ── Render ────────────────────────────────────────────────────

export function render() {
  // If already logged in, redirect on mount
  return `
    <div class="auth-page">
      <div class="auth-card">
        <h2 class="auth-title">Welcome to <span class="gradient-text">VictorMeet</span></h2>

        <!-- Tabs -->
        <div class="auth-tabs">
          <button class="auth-tab active" id="tabSignIn" data-tab="signin">Sign In</button>
          <button class="auth-tab" id="tabSignUp" data-tab="signup">Sign Up</button>
        </div>

        <!-- Sign In form -->
        <form class="auth-form" id="signinForm">
          <div class="form-group">
            <label class="label" for="loginEmail">Email</label>
            <input class="input" type="email" id="loginEmail" placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label class="label" for="loginPassword">Password</label>
            <input class="input" type="password" id="loginPassword" placeholder="••••••••" required />
          </div>
          <div class="auth-error" id="signinError"></div>
          <button class="btn btn-primary btn-block" type="submit">Sign In</button>
        </form>

        <!-- Sign Up form (hidden by default) -->
        <form class="auth-form" id="signupForm" style="display:none">
          <div class="form-group">
            <label class="label" for="regEmail">Email</label>
            <input class="input" type="email" id="regEmail" placeholder="you@example.com" required />
          </div>
          <div class="form-group">
            <label class="label" for="regPassword">Password</label>
            <input class="input" type="password" id="regPassword" placeholder="••••••••" required />
          </div>
          <div class="form-group">
            <label class="label" for="regNickname">Nickname</label>
            <input class="input" type="text" id="regNickname" placeholder="CoolUser123" required />
          </div>
          <div class="form-group">
            <label class="label" for="regInterests">Interests <small>(comma separated)</small></label>
            <input class="input" type="text" id="regInterests" placeholder="Music, Gaming, Travel" />
          </div>
          <div class="auth-error" id="signupError"></div>
          <button class="btn btn-primary btn-block" type="submit">Create Account</button>
        </form>

        <!-- Divider -->
        <div class="auth-divider"><span>— or —</span></div>

        <!-- Guest -->
        <button class="btn btn-outline btn-block" id="guestBtn">Continue as Guest</button>
      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  // Already authenticated? Redirect.
  if (getState('isAuthenticated')) {
    navigate('/chat');
    return;
  }

  // Auto-authenticate as guest and go straight to chat!
  autoGuestLogin();

  async function autoGuestLogin() {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        handleAuthSuccess(data);
        return;
      }
    } catch (err) {
      console.error('[auth] Auto guest login failed:', err);
    }
  }

  // Tab switching
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');

  tabSignIn.addEventListener('click', () => {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    signinForm.style.display = '';
    signupForm.style.display = 'none';
  });

  tabSignUp.addEventListener('click', () => {
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    signupForm.style.display = '';
    signinForm.style.display = 'none';
  });

  // ── Sign In ──────────────────────────────────────────────────
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('signinError');
    errorEl.textContent = '';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      errorEl.textContent = 'Please fill in all fields.';
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Login failed. Please try again.';
        return;
      }

      handleAuthSuccess(data);
    } catch (err) {
      console.error('[auth] login error:', err);
      errorEl.textContent = 'Network error. Please try again.';
    }
  });

  // ── Sign Up ──────────────────────────────────────────────────
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('signupError');
    errorEl.textContent = '';

    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const nickname = document.getElementById('regNickname').value.trim();
    const interestsRaw = document.getElementById('regInterests').value.trim();
    const interests = interestsRaw
      ? interestsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (!email || !password || !nickname) {
      errorEl.textContent = 'Please fill in all required fields.';
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname, interests }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || 'Registration failed. Please try again.';
        return;
      }

      handleAuthSuccess(data);
    } catch (err) {
      console.error('[auth] register error:', err);
      errorEl.textContent = 'Network error. Please try again.';
    }
  });

  // ── Guest ────────────────────────────────────────────────────
  document.getElementById('guestBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Could not continue as guest.');
        return;
      }

      handleAuthSuccess(data);
    } catch (err) {
      console.error('[auth] guest error:', err);
      alert('Network error. Please try again.');
    }
  });
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  // Forms are destroyed when innerHTML is replaced; no persistent
  // listeners to clean up.
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Shared handler for any successful auth response.
 * Expects { token, user } in the response payload.
 */
function handleAuthSuccess(data) {
  localStorage.setItem('vm_token', data.token);
  setState('token', data.token);
  setState('user', data.user);
  setState('isAuthenticated', true);
  initSocket();
  navigate('/chat');
}
