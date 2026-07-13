// ============================================================
// VictorMeet — Admin Dashboard Panel
// ============================================================

import { getState, setState } from '../state.js';
import { navigate } from '../router.js';
import { getSocket } from '../socket.js';

// ── Render ────────────────────────────────────────────────────

export function render() {
  const isAdmin = sessionStorage.getItem('vm_admin_auth') === 'true';

  if (!isAdmin) {
    // PIN Access Screen
    return `
      <div style="background: var(--bg-primary); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; color: var(--text-primary);">
        <div class="card" style="width: 360px; padding: var(--space-6); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-xl); text-align: center; box-shadow: var(--shadow-xl);">
          <h2 style="font-size: 24px; font-weight: 800; color: var(--primary); margin: 0 0 var(--space-2) 0;">Admin Access</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--space-5);">Enter security PIN to unlock the dashboard.</p>
          
          <div style="margin-bottom: var(--space-4);">
            <input type="password" id="adminPinInput" class="input" placeholder="Enter PIN..." style="text-align: center; font-size: 16px; font-weight: bold; letter-spacing: 2px; width: 100%; box-sizing: border-box; background: var(--bg-primary);" />
          </div>

          <button id="adminLoginBtn" class="btn btn-primary" style="width: 100%; padding: var(--space-3) 0; font-size: 15px; font-weight: bold; border-radius: var(--radius-md);">Unlock Panel</button>
          
          <p style="margin-top: var(--space-4); font-size: 12px;"><a href="#/landing" style="color: var(--primary); text-decoration: none;">Back to Home</a></p>
        </div>
      </div>
    `;
  }

  // Admin Dashboard Screen
  const onlineCount = getState('onlineCount') || 0;
  const totalVisitors = getState('totalVisitors') || 78;

  return `
    <div style="background: var(--bg-primary); min-height: 100vh; font-family: sans-serif; color: var(--text-primary);">
      <!-- Header -->
      <nav class="navbar" style="position: static; height: auto; padding: var(--space-4) var(--space-6); background: var(--bg-secondary); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <span style="font-size: 26px; font-weight: 900; color: var(--primary);">VictorMeet <span style="font-size: 14px; font-weight: 700; color: var(--accent-rose); text-transform: uppercase; background: rgba(244,63,94,0.1); padding: 2px 8px; border-radius: var(--radius-sm); margin-left: var(--space-2);">Admin</span></span>
        </div>
        <div>
          <button id="adminLogoutBtn" class="btn btn-outline" style="font-size: 12px; padding: 6px var(--space-4); border-radius: var(--radius-sm);">Exit Panel</button>
        </div>
      </nav>

      <!-- Main Layout -->
      <div style="max-width: 1000px; margin: var(--space-8) auto; padding: 0 var(--space-6); display: flex; flex-direction: column; gap: var(--space-6);">
        
        <!-- Stats Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4);">
          
          <!-- Card 1: Active Connections -->
          <div class="card" style="padding: var(--space-5); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); display: flex; align-items: center; gap: var(--space-4);">
            <div style="font-size: 32px; background: rgba(16,185,129,0.1); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full);">🟢</div>
            <div>
              <h4 style="margin: 0; font-size: 13px; color: var(--text-secondary); text-transform: uppercase;">Active Sockets</h4>
              <span id="adminOnlineCount" style="font-size: 26px; font-weight: 900; color: var(--text-primary);">${onlineCount}</span>
            </div>
          </div>

          <!-- Card 2: Total Visitors -->
          <div class="card" style="padding: var(--space-5); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); display: flex; align-items: center; gap: var(--space-4);">
            <div style="font-size: 32px; background: rgba(59,130,246,0.1); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full);">📈</div>
            <div>
              <h4 style="margin: 0; font-size: 13px; color: var(--text-secondary); text-transform: uppercase;">Total Visitors</h4>
              <span id="adminTotalVisitors" style="font-size: 26px; font-weight: 900; color: var(--text-primary);">${totalVisitors}</span>
            </div>
          </div>

          <!-- Card 3: Google AdSense ID -->
          <div class="card" style="padding: var(--space-5); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); display: flex; align-items: center; gap: var(--space-4);">
            <div style="font-size: 32px; background: rgba(245,158,11,0.1); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-full);">💸</div>
            <div>
              <h4 style="margin: 0; font-size: 13px; color: var(--text-secondary); text-transform: uppercase;">AdSense Client ID</h4>
              <span style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); font-family: monospace;">pub-9747982919206794</span>
            </div>
          </div>

        </div>

        <!-- Controls Section -->
        <div class="card" style="padding: var(--space-6); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-xl);">
          <h3 style="margin: 0 0 var(--space-4) 0; font-size: 18px; font-weight: 800; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-2);">⚡ Admin Operations</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-4);">
            <!-- Trigger testing visitors increment -->
            <button id="adminInc10" class="btn" style="background: var(--primary); color:#FFF; font-weight:bold; font-size:13px; padding: var(--space-3) var(--space-5); border-radius: var(--radius-md); cursor:pointer; border:none;">➕ Add 10 Visitors</button>
            <button id="adminInc100" class="btn" style="background: var(--secondary); color:#FFF; font-weight:bold; font-size:13px; padding: var(--space-3) var(--space-5); border-radius: var(--radius-md); cursor:pointer; border:none;">🚀 Add 100 Visitors</button>
            <button id="adminResetQueue" class="btn btn-outline" style="font-weight:bold; font-size:13px; padding: var(--space-3) var(--space-5); border-radius: var(--radius-md); border-color: var(--accent-rose); color: var(--accent-rose);">❌ Clear Matching Queue</button>
          </div>
        </div>

        <!-- Match Queue logs -->
        <div class="card" style="padding: var(--space-6); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-xl);">
          <h3 style="margin: 0 0 var(--space-3) 0; font-size: 18px; font-weight: 800; color: var(--text-primary);">📝 Server Activity logs</h3>
          <div id="adminServerLogs" style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); height: 200px; overflow-y: auto; font-family: monospace; font-size: 12.5px; color: var(--accent-green); line-height: 1.5; box-sizing: border-box;">
            <div>[system] Admin Dashboard opened successfully.</div>
            <div>[system] Listening for websocket event packets...</div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  const isAdmin = sessionStorage.getItem('vm_admin_auth') === 'true';

  if (!isAdmin) {
    const pinInput = document.getElementById('adminPinInput');
    const loginBtn = document.getElementById('adminLoginBtn');

    if (loginBtn && pinInput) {
      loginBtn.addEventListener('click', () => {
        const pin = pinInput.value;
        if (pin === '20032004') {
          sessionStorage.setItem('vm_admin_auth', 'true');
          // Reload page to draw dashboard
          const app = document.getElementById('app');
          if (app) {
            app.innerHTML = render();
            mount();
          }
        } else {
          alert('Invalid Security PIN!');
          pinInput.value = '';
          pinInput.focus();
        }
      });

      // Allow enter key press
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginBtn.click();
      });
    }
    return;
  }

  // Dashboard listeners
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const inc10 = document.getElementById('adminInc10');
  const inc100 = document.getElementById('adminInc100');
  const resetQueue = document.getElementById('adminResetQueue');
  const logsContainer = document.getElementById('adminServerLogs');

  function addLog(text) {
    if (logsContainer) {
      const div = document.createElement('div');
      div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
      logsContainer.appendChild(div);
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('vm_admin_auth');
      navigate('/landing');
    });
  }

  const socket = getSocket();

  // Increment visitors testing handlers
  if (inc10) {
    inc10.addEventListener('click', () => {
      const current = getState('totalVisitors') || 78;
      const target = current + 10;
      setState('totalVisitors', target);
      addLog(`Incremented total visitors locally by 10 (total: ${target})`);
      if (socket) {
        socket.emit('admin-action', { type: 'add-visitors', count: 10 });
      }
    });
  }

  if (inc100) {
    inc100.addEventListener('click', () => {
      const current = getState('totalVisitors') || 78;
      const target = current + 100;
      setState('totalVisitors', target);
      addLog(`Incremented total visitors locally by 100 (total: ${target})`);
      if (socket) {
        socket.emit('admin-action', { type: 'add-visitors', count: 100 });
      }
    });
  }

  if (resetQueue) {
    resetQueue.addEventListener('click', () => {
      addLog('Clearing server matchmaking queue...');
      if (socket) {
        socket.emit('admin-action', { type: 'clear-queue' });
        addLog('Request sent to server matchmaking queue.');
      } else {
        addLog('Error: Socket not connected. Cannot clear server queue.');
      }
    });
  }

  // Subscribe to real-time stats updates
  const onlineEl = document.getElementById('adminOnlineCount');
  const visitorsEl = document.getElementById('adminTotalVisitors');

  if (onlineEl) {
    const unsub = subscribe('onlineCount', (count) => {
      onlineEl.textContent = count;
      addLog(`Real-time: Sockets count updated to ${count}`);
    });
    unsubs.push(unsub);
  }

  if (visitorsEl) {
    const unsub = subscribe('totalVisitors', (count) => {
      visitorsEl.textContent = count;
      addLog(`Real-time: Visitors count updated to ${count}`);
    });
    unsubs.push(unsub);
  }
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  unsubs.forEach((fn) => fn());
  unsubs = [];
}
