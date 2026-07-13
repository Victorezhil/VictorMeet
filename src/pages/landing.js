// ============================================================
// VictorMeet — Landing Page (Classic Light Theme Copy)
// ============================================================

import { getState, setState, subscribe } from '../state.js';
import { navigate } from '../router.js';
import { initSocket } from '../socket.js';
import { openDonateModal } from './donate.js';
import { TRANSLATIONS, LANGUAGES } from './languages.js';

let unsubs = [];
let activeFilters = new Set(); // Stores clicked funny matching tags

// ── Render ────────────────────────────────────────────────────

export function render() {
  const onlineCount = getState('onlineCount') || 0;
  
  // Get active language from localStorage (defaults to english)
  const langCode = localStorage.getItem('vm_lang') || 'en';
  const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

  // Funny matching interest tags
  const tags = [
    { id: 'pranks', label: 'Pranks 🎭' },
    { id: 'roasting', label: 'Roasting 🔥' },
    { id: 'singing', label: 'Singing 🎤' },
    { id: 'memes', label: 'Memes 🤣' },
    { id: 'dating', label: 'Dating 💖' },
    { id: 'gaming', label: 'Gaming 🎮' },
    { id: 'confessions', label: 'Confessions 🤫' },
    { id: '18plus', label: '18+ Chat 🔞' }
  ];

  return `
    <div class="landing-page classic-layout" style="background: var(--bg-primary); min-height: 100vh; font-family: sans-serif;">
      <!-- Navbar -->
      <nav class="navbar" style="position: static; height: auto; padding: var(--space-4) var(--space-6); background: transparent; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);">
        <a href="#/landing" class="nav-logo" style="font-size: 36px; font-weight: 900; text-decoration: none;">
          <span style="color: var(--primary);">Victor</span><span style="color: var(--secondary);">Meet</span>
        </a>
        <div style="display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap;">
          <!-- Language Selector -->
          <select id="langSelect" style="background: #FFF; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 4px 8px; font-size: 13px; font-weight: bold; color: var(--text-primary); cursor: pointer; outline: none;">
            ${LANGUAGES.map(l => `<option value="${l.code}" ${l.code === langCode ? 'selected' : ''}>${l.name}</option>`).join('')}
          </select>
          
          <div style="font-size: var(--text-sm); color: var(--text-secondary); font-weight: 500;">
            ${t.tagline}
          </div>
          <button id="donateBtn" class="btn" style="background: #28a745; color: #FFF; font-size: 13px; font-weight: 800; padding: var(--space-1.5) var(--space-4); border-radius: var(--radius-full); cursor: pointer; border: none; box-shadow: 0 2px 4px rgba(40,167,69,0.2); flex-shrink: 0;">${t.donateLabel}</button>
        </div>
      </nav>

      <!-- Top Ad Banner -->
      <div class="ad-top-banner" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: var(--space-2) var(--space-6); display: flex; align-items: center; justify-content: center; gap: var(--space-4); min-height: 40px; box-sizing: border-box; width: 100%;">
        <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--tracking-wider); font-weight: 600;">Advertisement</span>
        <span style="font-size: 12px; color: var(--text-secondary); text-align: center;">💬 <strong>VictorMeet Premium:</strong> ${t.premiumNotice}</span>
        <a href="#/pricing" class="btn btn-primary" style="font-size: 10px; padding: 4px var(--space-3); text-decoration: none; border-radius: var(--radius-sm); font-weight: 700;">${t.upgradeNow}</a>
      </div>

      <!-- Classic Split Layout (Class replaces inline styles to fix squished layout bug) -->
      <div class="landing-split-grid">
        
        <!-- Left Side: Copywriting & Ads -->
        <div style="display: flex; flex-direction: column; gap: var(--space-6);">
          <h2 style="font-size: 32px; font-weight: 800; color: var(--text-primary); line-height: 1.2; margin: 0;">
            ${t.heroTitle}
          </h2>
          <p style="font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin: 0;">
            ${t.heroText}
          </p>
          
          <!-- Live User Counter -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border); padding: var(--space-4); border-radius: var(--radius-lg); display: flex; align-items: center; gap: var(--space-3);">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent-green); animation: pulse 2s infinite; flex-shrink: 0;"></div>
            <span style="font-size: 15px; font-weight: 600; color: var(--text-primary);">
              <span id="onlineCountStat">${onlineCount}</span> ${t.usersOnline}
            </span>
          </div>

          <!-- Ad Unit 1 (Google AdSense) -->
          <div class="card" style="padding: var(--space-4); background: var(--bg-secondary); border-color: var(--border); min-height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; width: 100%;">
            <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2); font-weight: 600;">Sponsored</span>
            <ins class="adsbygoogle"
                 style="display:block; width:100%; min-height:90px;"
                 data-ad-client="ca-pub-9747982919206794"
                 data-ad-slot="1000000001"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
          </div>
        </div>

        <!-- Right Side: Match Options & Form -->
        <div class="card" style="padding: var(--space-6); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-xl); display: flex; flex-direction: column; gap: var(--space-5); box-shadow: var(--shadow-md); box-sizing: border-box; width: 100%;">
          
          <!-- Name Input -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); display: block; margin-bottom: var(--space-1.5);">${t.chooseName}</label>
            <input type="text" id="usernameInput" class="input" placeholder="${t.namePlaceholder}" style="border-radius: var(--radius-md); width: 100%; box-sizing: border-box; background: var(--bg-primary);" required />
          </div>

          <!-- Age Input -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); display: block; margin-bottom: var(--space-1.5);">${t.enterAge}</label>
            <input type="number" id="userAgeInput" class="input" placeholder="${t.agePlaceholder}" min="13" max="120" style="border-radius: var(--radius-md); width: 100%; box-sizing: border-box; background: var(--bg-primary);" required />
          </div>

          <!-- Famous & Funny matching interest tags (Filters) -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); display: block; margin-bottom: var(--space-2);">${t.funnyTagsTitle}</label>
            <div style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
              ${tags.map(tag => {
                const isActive = activeFilters.has(tag.id);
                const borderStyle = isActive ? '2px solid var(--primary)' : '1px solid var(--border)';
                const bgStyle = isActive ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-primary)';
                const colorStyle = isActive ? 'var(--primary)' : 'var(--text-secondary)';
                return `
                  <span class="funny-tag-pill" data-id="${tag.id}" style="padding: 6px 12px; font-size: 12px; border-radius: var(--radius-full); cursor: pointer; border: ${borderStyle}; background: ${bgStyle}; color: ${colorStyle}; font-weight: 600; transition: all 0.15s; user-select: none;">
                    ${tag.label}
                  </span>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Formalities Checkboxes -->
          <div style="display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); background: rgba(239,68,68,0.03); border: 1px solid rgba(239,68,68,0.1); border-radius: var(--radius-lg);">
            <h4 style="font-size: 11px; font-weight: 700; color: var(--accent-rose); text-transform: uppercase; margin: 0; letter-spacing: var(--tracking-wider);">${t.safetyTitle}</h4>
            
            <label style="display: flex; gap: var(--space-2.5); font-size: 12px; color: var(--text-secondary); cursor: pointer; align-items: flex-start; margin: 0; user-select: none;">
              <input type="checkbox" id="agreeAge" style="margin-top: 2px; cursor: pointer;" />
              <span>${t.agreeAge}</span>
            </label>
            
            <label style="display: flex; gap: var(--space-2.5); font-size: 12px; color: var(--text-secondary); cursor: pointer; align-items: flex-start; margin: 0; user-select: none;">
              <input type="checkbox" id="agreeTerms" style="margin-top: 2px; cursor: pointer;" />
              <span>${t.agreeTerms} <a href="#/terms" style="color: var(--primary); text-decoration: none; font-weight: 500;">${t.terms}</a> ${t.and} <a href="#/privacy" style="color: var(--primary); text-decoration: none; font-weight: 500;">${t.privacy}</a>.</span>
            </label>
          </div>

          <!-- Action Buttons -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); display: block; margin-bottom: var(--space-2);">Start Chatting:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
              <button class="btn btn-primary" id="startTextBtn" style="padding: var(--space-3.5) 0; font-size: 16px; border-radius: var(--radius-lg); background-color: var(--primary); background: var(--gradient-primary); font-weight: 700;">
                ${t.startTexting}
              </button>
              <button class="btn btn-primary" id="startVideoBtn" style="padding: var(--space-3.5) 0; font-size: 16px; border-radius: var(--radius-lg); background-color: var(--secondary); background: var(--gradient-primary-reverse); font-weight: 700;">
                ${t.startVideo}
              </button>
            </div>
          </div>

          <!-- Ad Unit 2 (Google AdSense inside Form Box - In-feed fluid unit) -->
          <div style="border-top: 1px solid var(--border); padding-top: var(--space-4); margin-top: var(--space-2); min-height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden; width: 100%;">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-format="fluid"
                 data-ad-layout-key="-6t+ed+2i-1n-4w"
                 data-ad-client="ca-pub-9747982919206794"
                 data-ad-slot="9470226099"></ins>
          </div>
          
        </div>
      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  const usernameInput = document.getElementById('usernameInput');
  const userAgeInput = document.getElementById('userAgeInput');
  const agreeAge = document.getElementById('agreeAge');
  const agreeTerms = document.getElementById('agreeTerms');
  const startTextBtn = document.getElementById('startTextBtn');
  const startVideoBtn = document.getElementById('startVideoBtn');
  const donateBtn = document.getElementById('donateBtn');
  const langSelect = document.getElementById('langSelect');
  const tagPills = document.querySelectorAll('.funny-tag-pill');

  // Fill in previously used name/age
  if (usernameInput) usernameInput.value = localStorage.getItem('vm_username') || '';
  if (userAgeInput) userAgeInput.value = localStorage.getItem('vm_age') || '';

  // Language switch handler
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      localStorage.setItem('vm_lang', e.target.value);
      // Reload layout to apply translations
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = render();
        mount();
      }
    });
  }

  // Handle donation modal opening
  if (donateBtn) {
    donateBtn.addEventListener('click', openDonateModal);
  }

  // Toggle funny matching interest tags
  tagPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const tagId = pill.dataset.id;
      if (activeFilters.has(tagId)) {
        activeFilters.delete(tagId);
        pill.style.border = '1px solid var(--border)';
        pill.style.background = 'var(--bg-primary)';
        pill.style.color = 'var(--text-secondary)';
      } else {
        activeFilters.add(tagId);
        pill.style.border = '2px solid var(--primary)';
        pill.style.background = 'rgba(124, 58, 237, 0.1)';
        pill.style.color = 'var(--primary)';
      }
    });
  });

  async function checkAuthAndNavigate(mode) {
    const username = usernameInput ? usernameInput.value.trim() : '';
    const age = userAgeInput ? userAgeInput.value.trim() : '';

    if (!username) {
      alert('Please enter a Name / Nickname.');
      if (usernameInput) usernameInput.focus();
      return;
    }

    if (!age) {
      alert('Please enter your Age.');
      if (userAgeInput) userAgeInput.focus();
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      alert('Please enter a valid age between 13 and 120.');
      if (userAgeInput) userAgeInput.focus();
      return;
    }

    if (!agreeAge.checked || !agreeTerms.checked) {
      alert('Please accept both safety agreement checkboxes.');
      return;
    }

    // Initialize state
    setState('token', 'guest-token');
    setState('user', { nickname: username, age: ageNum, accountType: 'guest' });
    setState('isAuthenticated', true);
    
    localStorage.setItem('vm_username', username);
    localStorage.setItem('vm_age', age);

    // Navigate to Chat
    navigate('/chat');
    
    // Map active funny filters as matching interests
    const localInterests = Array.from(activeFilters);

    // Auto Join Match Queue
    setTimeout(() => {
      const socket = initSocket(username);
      if (socket) {
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

  // Live user counter updates
  const countEl = document.getElementById('onlineCountStat');
  if (countEl) {
    const unsub = subscribe('onlineCount', (count) => {
      countEl.textContent = count;
    });
    unsubs.push(unsub);
  }

  // Trigger Google AdSense display load
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.warn('[AdSense] Load error:', e);
  }
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  unsubs.forEach((fn) => fn());
  unsubs = [];
}
