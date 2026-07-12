// ============================================================
// VictorMeet — Landing Page (Classic Omegle style Copy)
// ============================================================

import { getState, setState, subscribe } from '../state.js';
import { navigate } from '../router.js';
import { initSocket } from '../socket.js';

let unsubs = [];
let localInterests = [];

// ── Render ────────────────────────────────────────────────────

export function render() {
  const onlineCount = getState('onlineCount') || 0;

  return `
    <div class="landing-page classic-layout">
      <!-- Navbar -->
      <nav class="navbar" style="position: static; height: auto; padding: var(--space-4) var(--space-6); background: transparent; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <a href="#/landing" class="nav-logo" style="font-size: 32px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; text-decoration: none;">VictorMeet</a>
        <div style="font-size: var(--text-sm); color: var(--text-secondary); font-weight: 500;">
          Talk to Strangers!
        </div>
      </nav>

      <!-- Classic Split Layout -->
      <div style="max-width: 1100px; margin: var(--space-10) auto; padding: 0 var(--space-6); display: grid; grid-template-columns: 1.1fr 0.9fr; gap: var(--space-10);">
        
        <!-- Left Side: Copywriting -->
        <div style="display: flex; flex-direction: column; gap: var(--space-6);">
          <h2 style="font-size: 32px; font-weight: 800; color: var(--text-primary); line-height: 1.2;">
            VictorMeet: Talk to Strangers!
          </h2>
          <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin: 0;">
            VictorMeet is a great way to meet new friends. When you use VictorMeet, we pick someone else at random so you can have a one-on-one chat. 
          </p>
          <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin: 0;">
            To help you find people who share your interests, you can add your interests, and VictorMeet will point you to someone who has the same interests as you.
          </p>
          
          <!-- Live User Counter -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: var(--space-4); border-radius: var(--radius-lg); display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-2);">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent-green); animation: pulse 2s infinite; flex-shrink: 0;"></div>
            <span style="font-size: 15px; font-weight: 600; color: var(--text-primary);">
              <span id="onlineCountStat">${onlineCount}</span> users online right now
            </span>
          </div>

          <!-- VPN Ad -->
          <div class="card" style="padding: var(--space-4); background: rgba(255,255,255,0.01); border-color: var(--border); margin-top: var(--space-2);">
            <span style="font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--tracking-wider);">Sponsored</span>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top: var(--space-1.5); display: flex; align-items: center; gap: var(--space-2);">
              <span>🛡️</span> <span><strong>SurfTunnel VPN:</strong> Encrypt your chat sessions and secure your location metadata.</span>
            </div>
          </div>
        </div>

        <!-- Right Side: Match Options & Formalities -->
        <div class="card" style="padding: var(--space-6); background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: var(--radius-xl); display: flex; flex-direction: column; gap: var(--space-6); box-shadow: var(--shadow-xl);">
          
          <!-- Interests Box -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); display: block; margin-bottom: var(--space-2);">What do you want to talk about? (Optional)</label>
            <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-3);">
              <input type="text" id="interestInput" class="input" placeholder="Type interest & press Add" style="border-radius: var(--radius-md);" />
              <button class="btn btn-secondary" id="addInterestBtn" style="padding: 0 var(--space-4); border-radius: var(--radius-md); font-size: 13px;">Add</button>
            </div>
            <div id="selectedInterestsContainer" style="display: flex; flex-wrap: wrap; gap: var(--space-2); min-height: 40px; padding: var(--space-2); background: rgba(0,0,0,0.25); border-radius: var(--radius-md); border: 1px solid var(--border); align-content: flex-start;">
              <!-- Pills will render here -->
            </div>
          </div>

          <!-- Formalities Checkboxes -->
          <div style="display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); background: rgba(244,63,94,0.04); border: 1px solid rgba(244,63,94,0.12); border-radius: var(--radius-lg);">
            <h4 style="font-size: 12px; font-weight: 700; color: var(--accent-rose); text-transform: uppercase; margin: 0; letter-spacing: var(--tracking-wider);">⚠️ Safety Formalities & Agreement</h4>
            
            <label style="display: flex; gap: var(--space-2.5); font-size: 12px; color: var(--text-secondary); cursor: pointer; align-items: flex-start; margin: 0; user-select: none;">
              <input type="checkbox" id="agreeAge" style="margin-top: 2px; cursor: pointer;" />
              <span>I am 18 years or older, or 13+ with parental consent, and commit to clean behavior.</span>
            </label>
            
            <label style="display: flex; gap: var(--space-2.5); font-size: 12px; color: var(--text-secondary); cursor: pointer; align-items: flex-start; margin: 0; user-select: none;">
              <input type="checkbox" id="agreeTerms" style="margin-top: 2px; cursor: pointer;" />
              <span>I accept VictorMeet's <a href="#/settings" style="color: var(--primary); text-decoration: none; font-weight: 500;">Terms of Service</a> &amp; <a href="#/settings" style="color: var(--primary); text-decoration: none; font-weight: 500;">Privacy Policy</a>.</span>
            </label>
          </div>

          <!-- Action Buttons -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); display: block; margin-bottom: var(--space-2);">Start Chatting:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
              <button class="btn btn-primary" id="startTextBtn" style="padding: var(--space-4) 0; font-size: 16px; border-radius: var(--radius-lg); background-color: var(--primary); background: var(--gradient-primary); font-weight: 700;">
                💬 Text
              </button>
              <button class="btn btn-primary" id="startVideoBtn" style="padding: var(--space-4) 0; font-size: 16px; border-radius: var(--radius-lg); background-color: var(--secondary); background: var(--gradient-primary-reverse); font-weight: 700;">
                📹 Video
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  const interestInput = document.getElementById('interestInput');
  const addInterestBtn = document.getElementById('addInterestBtn');
  const interestsContainer = document.getElementById('selectedInterestsContainer');
  const agreeAge = document.getElementById('agreeAge');
  const agreeTerms = document.getElementById('agreeTerms');
  const startTextBtn = document.getElementById('startTextBtn');
  const startVideoBtn = document.getElementById('startVideoBtn');

  // Load existing selected interests if any
  localInterests = [...(getState('selectedInterests') || [])];
  renderInterestPills();

  function renderInterestPills() {
    if (!interestsContainer) return;
    if (localInterests.length === 0) {
      interestsContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-tertiary); padding: var(--space-1);">No interests added yet</span>';
      return;
    }
    interestsContainer.innerHTML = localInterests
      .map(
        (interest, idx) => `
        <span class="pill active" style="font-size: 11px; padding: var(--space-1) var(--space-2.5); display: flex; align-items: center; gap: 6px; margin: 0; background: var(--primary); border: none;">
          ${interest}
          <span class="remove-interest" data-idx="${idx}" style="cursor: pointer; opacity: 0.7; font-weight: bold;">✕</span>
        </span>
      `
      )
      .join('');

    // Wire remove buttons
    interestsContainer.querySelectorAll('.remove-interest').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        localInterests.splice(idx, 1);
        setState('selectedInterests', localInterests);
        renderInterestPills();
      });
    });
  }

  function handleAddInterest() {
    const val = interestInput.value.trim().toLowerCase();
    if (val && !localInterests.includes(val)) {
      localInterests.push(val);
      setState('selectedInterests', localInterests);
      renderInterestPills();
    }
    interestInput.value = '';
    interestInput.focus();
  }

  if (addInterestBtn && interestInput) {
    addInterestBtn.addEventListener('click', handleAddInterest);
    interestInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddInterest();
      }
    });
  }

  async function checkAuthAndNavigate(mode) {
    if (!agreeAge.checked || !agreeTerms.checked) {
      alert('Please check both safety agreement boxes before starting.');
      return;
    }

    // Start matching process
    // If not authenticated, do a quick anonymous guest login
    if (!getState('isAuthenticated')) {
      try {
        const res = await fetch('/api/auth/guest', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Failed to authenticate session.');
          return;
        }
        localStorage.setItem('vm_token', data.token);
        setState('token', data.token);
        setState('user', data.user);
        setState('isAuthenticated', true);
        initSocket();
      } catch (err) {
        console.error('[landing] guest sign-in error:', err);
        alert('Connection error. Please try again.');
        return;
      }
    }

    // Set routing to chat page
    navigate('/chat');
    
    // Trigger match start automatically on the chat page based on mode
    setTimeout(() => {
      const socket = initSocket();
      if (socket) {
        // Toggle camera based on text vs video mode
        if (mode === 'text') {
          setState('isVideoOff', true);
        } else {
          setState('isVideoOff', false);
        }
        socket.emit('join-queue', {
          interests: localInterests,
          filters: { gender: null, region: null }
        });
        setState('callState', 'queued');
      }
    }, 200);
  }

  if (startTextBtn) {
    startTextBtn.addEventListener('click', () => checkAuthAndNavigate('text'));
  }

  if (startVideoBtn) {
    startVideoBtn.addEventListener('click', () => checkAuthAndNavigate('video'));
  }

  // Live online count updates
  const countEl = document.getElementById('onlineCountStat');
  if (countEl) {
    const unsub = subscribe('onlineCount', (count) => {
      countEl.textContent = count;
    });
    unsubs.push(unsub);
  }
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  unsubs.forEach((fn) => fn());
  unsubs = [];
}
