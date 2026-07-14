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

  const savedName = localStorage.getItem('vm_username') || '';
  const savedAge = localStorage.getItem('vm_userage') || '';

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
    <div class="landing-page classic-layout" style="background: var(--bg-primary); min-height: 100vh; font-family: var(--font-sans); position: relative; overflow: hidden;">
      
      <!-- Premium Background Glow Blobs -->
      <div class="hero-orb hero-orb-1" style="position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(0, 82, 255, 0.12), transparent 70%); top: -150px; left: -150px; z-index: 0; pointer-events: none;"></div>
      <div class="hero-orb hero-orb-2" style="position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%); bottom: -100px; right: -100px; z-index: 0; pointer-events: none;"></div>

      <!-- Navbar -->
      <nav class="navbar" style="position: relative; z-index: 10; padding: var(--space-4) var(--space-6); background: transparent; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
        <!-- Premium SVG Logo + Admin Trigger -->
        <a href="#/landing" id="logoAdminTrigger" class="nav-logo" style="display: flex; align-items: center; gap: 12px; text-decoration: none; cursor: pointer; user-select: none;">
          <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: bounceIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1); filter: drop-shadow(0 4px 10px rgba(0, 82, 255, 0.25));">
            <circle cx="50" cy="50" r="45" fill="url(#logo-grad-landing)" />
            <rect x="30" y="35" width="26" height="30" rx="6" fill="white" />
            <path d="M59 40L72 32V68L59 60V40Z" fill="white" />
            <circle cx="43" cy="45" r="4" fill="#0052FF" />
            <defs>
              <linearGradient id="logo-grad-landing" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#0052FF" />
                <stop offset="100%" stop-color="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          <span style="font-size: 32px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; display: inline-flex; align-items: center;">
            <span style="color: var(--primary);">Victor</span><span style="color: var(--secondary);">Meet</span>
          </span>
        </a>
        
        <div style="display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap;">
          <!-- Language Selector -->
          <select id="langSelect" style="background: #FFF; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 10px; font-size: 13px; font-weight: bold; color: var(--text-primary); cursor: pointer; outline: none; box-shadow: var(--shadow-sm);">
            ${LANGUAGES.map(l => `<option value="${l.code}" ${l.code === langCode ? 'selected' : ''}>${l.name}</option>`).join('')}
          </select>
          
          <div style="font-size: var(--text-sm); color: var(--text-secondary); font-weight: 600; background: var(--bg-secondary); padding: 6px 12px; border-radius: var(--radius-full); border: 1px solid var(--border);">
            ${t.tagline}
          </div>
          <button id="donateBtn" class="btn" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFF; font-size: 13px; font-weight: 800; padding: 8px 16px; border-radius: var(--radius-full); cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transition: all 0.2s; flex-shrink: 0;">${t.donateLabel}</button>
        </div>
      </nav>

      <!-- Top Ad Banner -->
      <div class="ad-top-banner" style="position: relative; z-index: 5; background: var(--bg-secondary); border-bottom: 1px solid var(--border); padding: var(--space-2) var(--space-6); display: flex; align-items: center; justify-content: center; gap: var(--space-4); min-height: 40px; box-sizing: border-box; width: 100%; animation: fadeIn 1s ease 0.2s forwards; opacity: 0;">
        <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--tracking-wider); font-weight: 600;">Advertisement</span>
        <span style="font-size: 12px; color: var(--text-secondary); text-align: center;">💬 <strong>VictorMeet Premium:</strong> ${t.premiumNotice}</span>
        <a href="#/pricing" class="btn btn-primary" style="font-size: 10px; padding: 4px var(--space-3); text-decoration: none; border-radius: var(--radius-sm); font-weight: 700;">${t.upgradeNow}</a>
      </div>

      <!-- Classic Split Layout -->
      <div class="landing-split-grid" style="position: relative; z-index: 5;">
        
        <!-- Left Side: Copywriting, Image & Ads -->
        <div style="display: flex; flex-direction: column; gap: var(--space-6); animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;">
          
          <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 82, 255, 0.08); border: 1px solid rgba(0, 82, 255, 0.15); padding: 6px 12px; border-radius: var(--radius-full); width: fit-content;">
            <span style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; display: inline-block; animation: pulse 2s infinite;"></span>
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--primary); letter-spacing: 1px;">🌍 P2P Global Video Network</span>
          </div>

          <h2 style="font-size: clamp(28px, 4vw, 42px); font-weight: 900; color: var(--text-primary); line-height: 1.15; margin: 0; letter-spacing: -1px;">
            ${t.heroTitle}
          </h2>
          <p style="font-size: 16px; color: var(--text-secondary); line-height: 1.6; margin: 0;">
            ${t.heroText}
          </p>

          <!-- Premium 3D Generated Image -->
          <div style="position: relative; border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-lg); animation: float 6s ease-in-out infinite; background: var(--bg-secondary);">
            <img src="/hero_banner.png" alt="VictorMeet global connectivity" style="width: 100%; height: auto; display: block; object-fit: cover;" />
            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent 50%); pointer-events: none;"></div>
          </div>
          
          <!-- Live User Counter & Visitor stats (Glassmorphism layout) -->
          <div style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid var(--border); padding: var(--space-5); border-radius: var(--radius-xl); display: flex; flex-direction: row; justify-content: space-between; gap: var(--space-4); box-shadow: var(--shadow-sm); flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--accent-green); animation: pulse 1.8s infinite; flex-shrink: 0; box-shadow: 0 0 10px var(--accent-green);"></div>
              <div>
                <div style="font-size: 18px; font-weight: 800; color: var(--text-primary); line-height: 1;">
                  <span id="onlineCountStat">${onlineCount}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; margin-top: 2px;">
                  ${t.usersOnline}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-3); border-left: 1px solid var(--border); padding-left: var(--space-4);">
              <div style="font-size: 24px; line-height: 1;"></div>
              <div>
                <div style="font-size: 18px; font-weight: 800; color: var(--text-primary); line-height: 1;">
                  <span id="totalVisitorsStat">${getState('totalVisitors') || 78}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; margin-top: 2px;">
                  Visitors Active
                </div>
              </div>
            </div>
          </div>

          <!-- Ad Unit 1 (Google AdSense - In-article fluid unit) -->
          <div class="card" style="padding: var(--space-4); background: var(--bg-secondary); border-color: var(--border); min-height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; width: 100%; border-radius: var(--radius-xl);">
            <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2); font-weight: 600;">Sponsored</span>
            <ins class="adsbygoogle"
                 style="display:block; text-align:center;"
                 data-ad-layout="in-article"
                 data-ad-format="fluid"
                 data-ad-client="ca-pub-9747982919206794"
                 data-ad-slot="9853790930"></ins>
          </div>
        </div>

        <!-- Right Side: Match Options & Form -->
        <div class="card" style="padding: var(--space-6); background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-xl); display: flex; flex-direction: column; gap: var(--space-5); box-shadow: var(--shadow-lg); box-sizing: border-box; width: 100%; animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;">
          
          <!-- Name Input -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); display: block; margin-bottom: var(--space-1.5);">${t.chooseName}</label>
            <input type="text" id="usernameInput" class="input" placeholder="${t.namePlaceholder}" value="${savedName}" style="border-radius: var(--radius-md); width: 100%; box-sizing: border-box; background: var(--bg-primary);" required />
          </div>

          <!-- Age Input -->
          <div>
            <label style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); display: block; margin-bottom: var(--space-1.5);">${t.enterAge}</label>
            <input type="number" id="userAgeInput" class="input" placeholder="${t.agePlaceholder}" value="${savedAge}" min="13" max="120" style="border-radius: var(--radius-md); width: 100%; box-sizing: border-box; background: var(--bg-primary);" required />
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

      <!-- Ad Unit 3 (Google AdSense - Below form, full width) -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); margin: 0 var(--space-6); display: flex; flex-direction: column; align-items: center; overflow: hidden; width: calc(100% - 2 * var(--space-6)); box-sizing: border-box;">
        <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2); font-weight: 600;">Sponsored</span>
        <ins class="adsbygoogle"
             style="display:block; text-align:center;"
             data-ad-layout="in-article"
             data-ad-format="fluid"
             data-ad-client="ca-pub-9747982919206794"
             data-ad-slot="9660018119"></ins>
      </div>

      <!-- Footer with visible admin login link -->
      <footer style="width: 100%; border-top: 1px solid var(--border); padding: var(--space-4) 0; margin-top: var(--space-12); text-align: center; font-size: 13px; color: var(--text-secondary); display: flex; flex-direction: column; align-items: center; gap: var(--space-1); flex-shrink: 0;">
        <div>© 2026 VictorMeet. All rights reserved.</div>
        <div style="display: flex; gap: var(--space-3); margin-top: var(--space-1); flex-wrap: wrap; justify-content: center;">
          <a href="#/terms" style="color: var(--primary); text-decoration: none; font-weight: 600;">Terms & Conditions</a>
          <span style="color: var(--border);">|</span>
          <a href="#/privacy" style="color: var(--primary); text-decoration: none; font-weight: 600;">Privacy Policy</a>
          <span style="color: var(--border);">|</span>
          <a href="#/admin" style="color: var(--primary); text-decoration: none; font-weight: 700;">Admin Panel Login</a>
        </div>
      </footer>

      <!-- Ad Unit 4 (Google AdSense - Bottom of page) -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); margin: 0 var(--space-6) var(--space-6); display: flex; flex-direction: column; align-items: center; overflow: hidden; box-sizing: border-box;">
        <span style="font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-2); font-weight: 600;">Sponsored</span>
        <ins class="adsbygoogle"
             style="display:block; text-align:center;"
             data-ad-format="fluid"
             data-ad-layout-key="-6t+ed+2i-1n-4w"
             data-ad-client="ca-pub-9747982919206794"
             data-ad-slot="1050900351"></ins>
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
    localStorage.setItem('vm_userage', age);

    // Map active funny filters as matching interests
    const localInterests = Array.from(activeFilters);
    setState('selectedInterests', localInterests);

    if (mode === 'text') {
      setState('isVideoOff', true);
    } else {
      setState('isVideoOff', false);
    }

    // Set flag for chat page to automatically trigger match queue start
    setState('autoStartQueue', true);

    // Navigate to Chat
    navigate('/chat');
  }

  // Hidden admin panel trigger (Click 5 times)
  let logoClicks = 0;
  const logoTrigger = document.getElementById('logoAdminTrigger');
  if (logoTrigger) {
    logoTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      logoClicks += 1;
      if (logoClicks >= 5) {
        logoClicks = 0;
        const pin = prompt('Enter Admin Security PIN:');
        if (pin === '20032004') {
          sessionStorage.setItem('vm_admin_auth', 'true');
          navigate('/admin');
        } else if (pin !== null) {
          alert('Invalid Admin PIN!');
        }
      }
    });
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

  // Live visitors counter updates
  const visitorsEl = document.getElementById('totalVisitorsStat');
  if (visitorsEl) {
    const unsub = subscribe('totalVisitors', (count) => {
      visitorsEl.textContent = count;
    });
    unsubs.push(unsub);
  }

  // Trigger Google AdSense display load
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});
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
