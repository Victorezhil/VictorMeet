// ============================================================
// VictorMeet — Global State Manager
// ============================================================

const state = {
  user: null,             // { id, email, nickname, interests, accountType, tokens }
  token: null,            // JWT token string
  isAuthenticated: false,
  callState: 'idle',      // 'idle' | 'queued' | 'matching' | 'connected' | 'ended'
  currentRoom: null,
  partnerId: null,
  partnerNickname: null,
  isInitiator: false,
  isAudioMuted: false,
  isVideoOff: false,
  selectedInterests: [],
  filters: { gender: null, region: null },
  onlineCount: 0,
};

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * Get a single state value by key.
 * @param {string} key
 * @returns {*}
 */
export function getState(key) {
  return state[key];
}

/**
 * Set a single state value by key and notify all subscribers.
 * @param {string} key
 * @param {*} value
 */
export function setState(key, value) {
  const prev = state[key];
  state[key] = value;

  if (listeners.has(key)) {
    listeners.get(key).forEach((cb) => {
      try {
        cb(value, prev);
      } catch (err) {
        console.error(`[state] listener error for "${key}":`, err);
      }
    });
  }
}

/**
 * Subscribe to changes on a specific key.
 * @param {string} key
 * @param {Function} callback  – called with (newValue, oldValue)
 * @returns {Function} unsubscribe function
 */
export function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key).add(callback);

  return () => {
    const subs = listeners.get(key);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) listeners.delete(key);
    }
  };
}

/**
 * Attempt to restore the user session from localStorage.
 * If a token exists it is validated via the API; on failure the
 * stored credentials are cleared silently.
 */
export async function loadUserFromStorage() {
  try {
    const token = localStorage.getItem('vm_token');
    if (!token) return;

    setState('token', token);

    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      clearUser();
      return;
    }

    const data = await res.json();
    setState('user', data.user);
    setState('isAuthenticated', true);
  } catch (err) {
    console.warn('[state] failed to restore session:', err);
    clearUser();
  }
}

/**
 * Clear all auth-related state and remove stored token.
 */
export function clearUser() {
  localStorage.removeItem('vm_token');
  setState('user', null);
  setState('token', null);
  setState('isAuthenticated', false);
  setState('callState', 'idle');
  setState('currentRoom', null);
  setState('partnerId', null);
  setState('partnerNickname', null);
  setState('isInitiator', false);
  setState('selectedInterests', []);
  setState('filters', { gender: null, region: null });
}

export default state;
