// ============================================================
// VictorMeet — Pricing Page
// ============================================================

import { getState, setState } from '../state.js';
import { navigate } from '../router.js';

// ── Render ────────────────────────────────────────────────────

export function render() {
  const isAuth = getState('isAuthenticated');

  return `
    <nav class="navbar">
      <a href="#/landing" class="nav-logo">VictorMeet</a>
      <div class="nav-links">
        <a href="#/landing" class="nav-link">Home</a>
        <a href="#/chat" class="nav-link">Chat</a>
        ${
          isAuth
            ? '<a href="#/profile" class="nav-link">Profile</a>'
            : '<a href="#/auth" class="nav-link">Login</a>'
        }
      </div>
    </nav>

    <section class="pricing-page">
      <div class="pricing-header">
        <h1 class="pricing-title">Upgrade to <span class="gradient-text">Premium</span></h1>
        <p class="pricing-subtitle">Unlock the full VictorMeet experience</p>
      </div>

      <!-- Subscription plans -->
      <div class="pricing-grid">
        <!-- Monthly -->
        <div class="pricing-card" data-plan="monthly">
          <h3 class="pricing-plan-name">Monthly</h3>
          <div class="pricing-amount">
            <span class="pricing-currency">$</span>
            <span class="pricing-value">9.99</span>
            <span class="pricing-period">/mo</span>
          </div>
          <ul class="pricing-features">
            <li>✅ Gender filter</li>
            <li>✅ Region filter</li>
            <li>✅ Ad-free experience</li>
            <li>✅ Priority matching</li>
            <li>✅ 50 tokens/mo</li>
          </ul>
          <button class="btn btn-outline btn-block plan-btn" data-plan="monthly">Choose Monthly</button>
        </div>

        <!-- Quarterly (Popular) -->
        <div class="pricing-card pricing-card-popular" data-plan="quarterly">
          <div class="pricing-badge">POPULAR</div>
          <h3 class="pricing-plan-name">Quarterly</h3>
          <div class="pricing-amount">
            <span class="pricing-currency">$</span>
            <span class="pricing-value">7.99</span>
            <span class="pricing-period">/mo</span>
          </div>
          <p class="pricing-billed">$23.97 billed quarterly</p>
          <div class="pricing-save-badge">Save 20%</div>
          <ul class="pricing-features">
            <li>✅ Gender filter</li>
            <li>✅ Region filter</li>
            <li>✅ Ad-free experience</li>
            <li>✅ Priority matching</li>
            <li>✅ 200 tokens</li>
          </ul>
          <button class="btn btn-primary btn-block plan-btn" data-plan="quarterly">Choose Quarterly</button>
        </div>

        <!-- Annual -->
        <div class="pricing-card" data-plan="annual">
          <div class="pricing-badge pricing-badge-best">Best Value</div>
          <h3 class="pricing-plan-name">Annual</h3>
          <div class="pricing-amount">
            <span class="pricing-currency">$</span>
            <span class="pricing-value">4.99</span>
            <span class="pricing-period">/mo</span>
          </div>
          <p class="pricing-billed">$59.88 billed annually</p>
          <div class="pricing-save-badge">Save 50%</div>
          <ul class="pricing-features">
            <li>✅ Gender filter</li>
            <li>✅ Region filter</li>
            <li>✅ Ad-free experience</li>
            <li>✅ Priority matching</li>
            <li>✅ 500 tokens</li>
          </ul>
          <button class="btn btn-outline btn-block plan-btn" data-plan="annual">Choose Annual</button>
        </div>
      </div>

      <!-- Feature Comparison -->
      <div class="pricing-comparison">
        <h2>Feature Comparison</h2>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th>Premium</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Random Matching</td><td>✅</td><td>✅</td></tr>
            <tr><td>Interest Tags</td><td>✅</td><td>✅</td></tr>
            <tr><td>Text Chat</td><td>✅</td><td>✅</td></tr>
            <tr><td>Gender Filter</td><td>❌</td><td>✅</td></tr>
            <tr><td>Region Filter</td><td>❌</td><td>✅</td></tr>
            <tr><td>Ad-free</td><td>❌</td><td>✅</td></tr>
            <tr><td>Priority Matching</td><td>❌</td><td>✅</td></tr>
            <tr><td>Monthly Tokens</td><td>0</td><td>50–500</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Token packages -->
      <div class="token-packages">
        <h2>Token Packages</h2>
        <p class="text-muted">Use tokens for special features and gifts.</p>
        <div class="pricing-grid">
          <div class="pricing-card token-card" data-tokens="100">
            <h3 class="pricing-plan-name">100 Tokens</h3>
            <div class="pricing-amount">
              <span class="pricing-currency">$</span>
              <span class="pricing-value">4.99</span>
            </div>
            <button class="btn btn-outline btn-block token-btn" data-tokens="100">Buy Now</button>
          </div>
          <div class="pricing-card token-card pricing-card-popular" data-tokens="500">
            <div class="pricing-badge">Most Popular</div>
            <h3 class="pricing-plan-name">500 Tokens</h3>
            <div class="pricing-amount">
              <span class="pricing-currency">$</span>
              <span class="pricing-value">19.99</span>
            </div>
            <button class="btn btn-primary btn-block token-btn" data-tokens="500">Buy Now</button>
          </div>
          <div class="pricing-card token-card" data-tokens="1000">
            <div class="pricing-badge pricing-badge-best">Best Value</div>
            <h3 class="pricing-plan-name">1000 Tokens</h3>
            <div class="pricing-amount">
              <span class="pricing-currency">$</span>
              <span class="pricing-value">34.99</span>
            </div>
            <button class="btn btn-outline btn-block token-btn" data-tokens="1000">Buy Now</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  // Plan purchase buttons
  document.querySelectorAll('.plan-btn').forEach((btn) => {
    btn.addEventListener('click', () => handlePlanPurchase(btn.dataset.plan));
  });

  // Token purchase buttons
  document.querySelectorAll('.token-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleTokenPurchase(btn.dataset.tokens));
  });
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  // No persistent listeners
}

// ── Handlers ──────────────────────────────────────────────────

async function handlePlanPurchase(plan) {
  if (!getState('isAuthenticated')) {
    navigate('/auth');
    return;
  }

  try {
    const res = await fetch('/api/user/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getState('token')}`,
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Purchase failed. Please try again.');
      return;
    }

    // Update state
    const user = getState('user');
    setState('user', { ...user, accountType: 'premium', ...(data.user || {}) });
    showToast(`Successfully upgraded to ${plan} plan! 🎉`);
  } catch (err) {
    console.error('[pricing] plan purchase error:', err);
    alert('Network error. Please try again.');
  }
}

async function handleTokenPurchase(tokens) {
  if (!getState('isAuthenticated')) {
    navigate('/auth');
    return;
  }

  try {
    const res = await fetch('/api/user/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getState('token')}`,
      },
      body: JSON.stringify({ amount: Number(tokens) }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Purchase failed. Please try again.');
      return;
    }

    const user = getState('user');
    setState('user', { ...user, tokens: (user.tokens || 0) + Number(tokens), ...(data.user || {}) });
    showToast(`Purchased ${tokens} tokens! 🪙`);
  } catch (err) {
    console.error('[pricing] token purchase error:', err);
    alert('Network error. Please try again.');
  }
}

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
