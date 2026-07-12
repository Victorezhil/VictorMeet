// ============================================================
// VictorMeet — Socket.io Client Singleton
// ============================================================

import { io } from 'socket.io-client';
import state, { setState, getState } from './state.js';

/** @type {import('socket.io-client').Socket | null} */
let socket = null;

/**
 * Initialise the Socket.io connection.
 * Attaches global event handlers for connection lifecycle and online count.
 * @returns {import('socket.io-client').Socket}
 */
export function initSocket() {
  if (socket && socket.connected) return socket;

  const token = getState('token');

  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const backendUrl = isProduction ? 'https://victormeet.onrender.com' : '/';

  socket = io(backendUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[socket] connection error:', err.message);
  });

  socket.on('online-count', (count) => {
    setState('onlineCount', count);
  });

  return socket;
}

/**
 * Return the current socket instance (may be null).
 * @returns {import('socket.io-client').Socket | null}
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect and dispose of the socket.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
