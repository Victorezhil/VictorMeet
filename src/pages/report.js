// ============================================================
// VictorMeet — Report Page / Modal
// ============================================================

import { getState, setState } from '../state.js';
import { navigate } from '../router.js';
import { getSocket } from '../socket.js';

// ── Render ────────────────────────────────────────────────────

export function render() {
  const partnerNickname = getState('partnerNickname') || 'this user';

  return `
    <div class="report-page">
      <div class="report-card">
        <h2 class="report-title">🚩 Report User</h2>
        <p class="report-subtitle">Report <strong>${escapeHtml(partnerNickname)}</strong></p>

        <!-- Reason cards -->
        <div class="report-reasons" id="reportReasons">
          <label class="report-reason-card">
            <input type="radio" name="reportReason" value="inappropriate" />
            <span class="reason-label">🔞 Inappropriate behavior</span>
          </label>
          <label class="report-reason-card">
            <input type="radio" name="reportReason" value="spam" />
            <span class="reason-label">📧 Spam</span>
          </label>
          <label class="report-reason-card">
            <input type="radio" name="reportReason" value="harassment" />
            <span class="reason-label">😡 Harassment</span>
          </label>
          <label class="report-reason-card">
            <input type="radio" name="reportReason" value="underage" />
            <span class="reason-label">🚸 Underage user</span>
          </label>
          <label class="report-reason-card">
            <input type="radio" name="reportReason" value="other" />
            <span class="reason-label">📝 Other</span>
          </label>
        </div>

        <!-- Optional description -->
        <div class="form-group">
          <label class="label" for="reportDescription">Additional details (optional)</label>
          <textarea class="input report-textarea" id="reportDescription" rows="3"
                    placeholder="Describe what happened…"></textarea>
        </div>

        <!-- Block user checkbox -->
        <div class="form-group form-check">
          <label class="label">
            <input type="checkbox" id="blockUserCheck" />
            Block this user
          </label>
        </div>

        <!-- Actions -->
        <div class="report-actions">
          <button class="btn btn-outline" id="reportCancelBtn">Cancel</button>
          <button class="btn btn-danger" id="reportSubmitBtn">Submit Report</button>
        </div>
      </div>
    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────

export function mount() {
  const cancelBtn = document.getElementById('reportCancelBtn');
  const submitBtn = document.getElementById('reportSubmitBtn');

  // Cancel → back to chat
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => navigate('/chat'));
  }

  // Submit report
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const selected = document.querySelector('input[name="reportReason"]:checked');
      if (!selected) {
        alert('Please select a reason for the report.');
        return;
      }

      const reason = selected.value;
      const description = document.getElementById('reportDescription').value.trim();
      const blockUser = document.getElementById('blockUserCheck').checked;

      const socket = getSocket();
      const partnerId = getState('partnerId');
      const roomId = getState('currentRoom');

      if (socket && partnerId) {
        socket.emit('report-user', {
          reportedUserId: partnerId,
          roomId,
          reason,
          description,
        });

        if (blockUser) {
          socket.emit('block-user', { blockedUserId: partnerId });
        }
      }

      showToast('Report submitted. Thank you for keeping VictorMeet safe. 🙏');
      navigate('/chat');
    });
  }

  // Highlight selected reason card
  document.querySelectorAll('.report-reason-card input').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.report-reason-card').forEach((card) =>
        card.classList.remove('selected'),
      );
      radio.closest('.report-reason-card').classList.add('selected');
    });
  });
}

// ── Unmount ───────────────────────────────────────────────────

export function unmount() {
  // No persistent listeners
}

// ── Helpers ───────────────────────────────────────────────────

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
