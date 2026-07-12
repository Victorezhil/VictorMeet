// ============================================================
// VictorMeet — Settings Page
// ============================================================

import { getState } from '../state.js';
import { navigate } from '../router.js';
import { clearUser } from '../state.js';
import { disconnectSocket } from '../socket.js';

// ── Render ────────────────────────────────────────────────────

export function render() {
  return `
    <nav class="navbar">
      <a href="#/landing" class="nav-logo">VictorMeet</a>
      <div class="nav-links">
        <a href="#/chat" class="nav-link">Chat</a>
        <a href="#/profile" class="nav-link">Profile</a>
        <a href="#/pricing" class="nav-link">Pricing</a>
      </div>
    </nav>

    <div class="settings-page">
      <h1 class="settings-title">Settings</h1>

      <!-- Video & Audio -->
      <div class="card settings-section">
        <h3>🎥 Video &amp; Audio</h3>
        <div class="form-group">
          <label class="label" for="videoQuality">Video Quality</label>
          <select class="input" id="videoQuality">
            <option value="720">720p (HD)</option>
            <option value="480">480p (SD)</option>
            <option value="360">360p (Low)</option>
          </select>
        </div>
        <div class="form-group form-check">
          <label class="label">
            <input type="checkbox" id="audioEnabled" checked />
            Enable Microphone
          </label>
        </div>
      </div>

      <!-- Notifications -->
      <div class="card settings-section">
        <h3>🔔 Notifications</h3>
        <div class="form-group form-check">
          <label class="label">
            <input type="checkbox" id="notificationsEnabled" checked />
            Enable Notifications
          </label>
        </div>
      </div>

      <!-- Privacy -->
      <div class="card settings-section">
        <h3>🔒 Privacy</h3>
        <p>
          <a href="#/privacy" class="link" style="text-decoration:none; font-weight:600; color:var(--primary);">Privacy Policy</a>
        </p>
        <p>
          <a href="#/terms" class="link" style="text-decoration:none; font-weight:600; color:var(--primary);">Terms of Service</a>
        </p>
      </div>

      <!-- Account -->
      <div class="card settings-section">
        <h3>👤 Account</h3>
        <button class="btn btn-outline btn-block" id="logoutBtn">Log Out</button>
        <button class="btn btn-danger btn-block" id="deleteAccountBtn" style="margin-top:0.5rem">
          Delete Account
        </button>
      </div>
    </div>

    <!-- Delete-account confirmation modal -->
    <div class="modal-overlay" id="deleteModal" style="display:none">
      <div class="modal-card">
        <h3>Delete Account</h3>
        <p>Are you sure you want to permanently delete your account? This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" id="deleteCancelBtn">Cancel</button>
          <button class="btn btn-danger" id="deleteConfirmBtn">Delete</button>
        </div>
      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  if (!getState('isAuthenticated')) {
    navigate('/auth');
    return;
  }

  // Load saved preferences
  const savedQuality = localStorage.getItem('vm_videoQuality');
  if (savedQuality) {
    const sel = document.getElementById('videoQuality');
    if (sel) sel.value = savedQuality;
  }

  const savedNotif = localStorage.getItem('vm_notifications');
  if (savedNotif !== null) {
    const cb = document.getElementById('notificationsEnabled');
    if (cb) cb.checked = savedNotif === 'true';
  }

  const savedAudio = localStorage.getItem('vm_audioEnabled');
  if (savedAudio !== null) {
    const cb = document.getElementById('audioEnabled');
    if (cb) cb.checked = savedAudio !== 'false';
  }

  // ── Video quality ──────────────────────────────────────────
  const qualitySelect = document.getElementById('videoQuality');
  if (qualitySelect) {
    qualitySelect.addEventListener('change', () => {
      localStorage.setItem('vm_videoQuality', qualitySelect.value);
    });
  }

  // ── Audio toggle ───────────────────────────────────────────
  const audioToggle = document.getElementById('audioEnabled');
  if (audioToggle) {
    audioToggle.addEventListener('change', () => {
      localStorage.setItem('vm_audioEnabled', audioToggle.checked);
    });
  }

  // ── Notifications toggle ───────────────────────────────────
  const notifToggle = document.getElementById('notificationsEnabled');
  if (notifToggle) {
    notifToggle.addEventListener('change', () => {
      localStorage.setItem('vm_notifications', notifToggle.checked);
    });
  }

  // ── Logout ─────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearUser();
      disconnectSocket();
      navigate('/landing');
    });
  }

  // ── Delete account ─────────────────────────────────────────
  const deleteBtn = document.getElementById('deleteAccountBtn');
  const deleteModal = document.getElementById('deleteModal');
  const cancelBtn = document.getElementById('deleteCancelBtn');
  const confirmBtn = document.getElementById('deleteConfirmBtn');

  if (deleteBtn && deleteModal) {
    deleteBtn.addEventListener('click', () => {
      deleteModal.style.display = 'flex';
    });

    cancelBtn.addEventListener('click', () => {
      deleteModal.style.display = 'none';
    });

    // Close modal on overlay click
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) deleteModal.style.display = 'none';
    });

    confirmBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/user/account', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getState('token')}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.message || 'Failed to delete account.');
          return;
        }

        clearUser();
        disconnectSocket();
        deleteModal.style.display = 'none';
        navigate('/landing');
      } catch (err) {
        console.error('[settings] delete account error:', err);
        alert('Network error. Please try again.');
      }
    });
  }
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  // Remove modal from body if it was somehow appended elsewhere
  const modal = document.getElementById('deleteModal');
  if (modal && modal.parentElement === document.body) {
    document.body.removeChild(modal);
  }
}
