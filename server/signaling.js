/**
 * signaling.js — WebRTC Signaling + Socket.io Handlers for VictorMeet
 *
 * Orchestrates real-time communication:
 *   • Authenticates sockets via JWT handshake
 *   • Manages the match queue
 *   • Relays WebRTC offers / answers / ICE candidates
 *   • Handles room lifecycle (create → join → leave)
 *   • Relays chat messages between matched partners
 *   • Processes user reports and blocks
 *   • Broadcasts periodic queue-status updates
 */

import { verifyToken } from './auth.js';

/** Interval (ms) between queue-status broadcasts. */
const QUEUE_STATUS_INTERVAL = 5_000;

/**
 * Attach all Socket.io event handlers to the given server.
 *
 * @param {import('socket.io').Server} io
 * @param {import('./store.js').default} store
 * @param {import('./matchQueue.js').default} matchQueue
 */
export function setupSignaling(io, store, matchQueue) {

  // ─── Socket setup middleware (Tokenless connection) ──────
  io.use((socket, next) => {
    const nickname = socket.handshake.auth?.nickname;
    socket.userId = socket.id; // Treat socket.id as unique user ID
    socket.userNickname = nickname && nickname.trim() ? nickname.trim() : 'Stranger';
    socket.accountType = 'guest';
    next();
  });

  // ─── Periodic queue-status broadcast ─────────────────────
  const statusTimer = setInterval(() => {
    const queueSize = matchQueue.getQueueSize();
    // Rough estimated wait: ~5 s per person ahead of you (just a heuristic)
    const estimatedWait = Math.max(5, queueSize * 5);
    io.emit('queue-status', { queueSize, estimatedWait });
  }, QUEUE_STATUS_INTERVAL);

  // Clean up the timer if the server shuts down
  io.on('close', () => clearInterval(statusTimer));

  // ─── Connection handler ──────────────────────────────────
  io.on('connection', async (socket) => {
    console.log(`[connect] ${socket.userNickname} (${socket.id})`);

    // Increment and broadcast real-time visitor stats
    const totalVisitors = store.incrementVisitorCount();
    const onlineCount = io.sockets.sockets.size;
    io.emit('online-count', { onlineCount, totalVisitors });

    // Register a session for this socket
    store.addSession(socket.id, { userId: socket.userId });

    // Pre-load user's block list from Supabase into memory cache for sync matching checks
    store.loadUserBlocks(socket.userId);

    // ── join-queue ────────────────────────────────────────
    socket.on('join-queue', ({ interests = [], filters = {} } = {}) => {
      console.log(`[join-queue] ${socket.userNickname}`);

      matchQueue.addToQueue(
        socket.id,
        socket.userId,
        interests,
        filters,
        socket.accountType,
      );

      // Immediately attempt to find a match
      attemptMatch(socket);
    });

    // ── leave-queue ───────────────────────────────────────
    socket.on('leave-queue', () => {
      console.log(`[leave-queue] ${socket.userNickname}`);
      matchQueue.removeFromQueue(socket.id);
    });

    // ── WebRTC offer relay ────────────────────────────────
    socket.on('offer', ({ offer, to }) => {
      io.to(to).emit('offer', { offer, from: socket.id });
    });

    // ── WebRTC answer relay ───────────────────────────────
    socket.on('answer', ({ answer, to }) => {
      io.to(to).emit('answer', { answer, from: socket.id });
    });

    // ── ICE candidate relay ───────────────────────────────
    socket.on('ice-candidate', ({ candidate, to }) => {
      io.to(to).emit('ice-candidate', { candidate, from: socket.id });
    });

    // ── next — end current call and re-queue ──────────────
    socket.on('next', ({ interests = [], filters = {} } = {}) => {
      console.log(`[next] ${socket.userNickname}`);
      endCall(socket, 'partner-left');

      // Re-enter the queue with (optionally updated) preferences
      matchQueue.addToQueue(
        socket.id,
        socket.userId,
        interests,
        filters,
        socket.accountType,
      );

      attemptMatch(socket);
    });

    // ── stop — end current call, return to lobby ──────────
    socket.on('stop', () => {
      console.log(`[stop] ${socket.userNickname}`);
      endCall(socket, 'partner-left');
      matchQueue.removeFromQueue(socket.id);
    });

    // ── chat-message relay ────────────────────────────────
    socket.on('chat-message', ({ message }) => {
      const session = store.sessions.get(socket.id);
      if (!session?.partnerId) return;

      io.to(session.partnerId).emit('chat-message', {
        from: socket.id,
        nickname: socket.userNickname,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // ── report-user ───────────────────────────────────────
    socket.on('report-user', async ({ reason, description = '' }) => {
      const session = store.sessions.get(socket.id);
      if (!session?.partnerId) return;

      const partnerSession = store.sessions.get(session.partnerId);
      if (!partnerSession) return;

      await store.addReport({
        reporterId: socket.userId,
        reportedId: partnerSession.userId,
        reason,
        description,
      });

      socket.emit('report-acknowledged', { message: 'Report submitted successfully' });
      console.log(`[report] ${socket.userNickname} reported user ${partnerSession.userId}: ${reason}`);
    });

    // ── block-user ────────────────────────────────────────
    socket.on('block-user', async () => {
      const session = store.sessions.get(socket.id);
      if (!session?.partnerId) return;

      const partnerSession = store.sessions.get(session.partnerId);
      if (!partnerSession) return;

      await store.addBlock(socket.userId, partnerSession.userId);
      console.log(`[block] ${socket.userNickname} blocked user ${partnerSession.userId}`);

      // End the call immediately after blocking
      endCall(socket, 'partner-left');
    });

    // ── disconnect ────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[disconnect] ${socket.userNickname} (${reason})`);
      endCall(socket, 'partner-left');
      matchQueue.removeFromQueue(socket.id);
      store.removeSession(socket.id);

      // Broadcast updated online count on disconnect
      io.emit('online-count', {
        onlineCount: io.sockets.sockets.size,
        totalVisitors: store.getVisitorCount()
      });
    });

    // ── admin-action ──────────────────────────────────────
    socket.on('admin-action', (data) => {
      console.log(`[admin-action] Action: ${data.type}`);
      if (data.type === 'add-visitors') {
        const count = parseInt(data.count) || 10;
        for (let i = 0; i < count; i++) {
          store.incrementVisitorCount();
        }
        // Broadcast the new count
        io.emit('online-count', {
          onlineCount: io.sockets.sockets.size,
          totalVisitors: store.getVisitorCount()
        });
      } else if (data.type === 'clear-queue') {
        matchQueue.queue = [];
        console.log('[admin-action] Matching queue cleared by admin.');
      }
    });
  });

  // ─── Helper: attempt to find a match for a socket ────────
  /**
   * Try to pair the given socket with another user in the queue.
   * If a match is found, create a room and notify both sides.
   *
   * @param {import('socket.io').Socket} socket
   */
  function attemptMatch(socket) {
    const matchedSocketId = matchQueue.findMatch(socket.id);
    if (!matchedSocketId) return; // No match available yet

    const matchedSocket = io.sockets.sockets.get(matchedSocketId);
    if (!matchedSocket) {
      // Stale entry — clean up and retry
      matchQueue.removeFromQueue(matchedSocketId);
      attemptMatch(socket);
      return;
    }

    // Remove both users from the queue
    matchQueue.removeFromQueue(socket.id);
    matchQueue.removeFromQueue(matchedSocketId);

    // Deterministic room name (sorted IDs avoid duplicates)
    const ids = [socket.id, matchedSocketId].sort();
    const roomId = `room_${ids[0]}_${ids[1]}`;

    // Both sockets join the room
    socket.join(roomId);
    matchedSocket.join(roomId);

    // Update session records
    store.addSession(socket.id, {
      userId: socket.userId,
      roomId,
      partnerId: matchedSocketId,
    });
    store.addSession(matchedSocketId, {
      userId: matchedSocket.userId,
      roomId,
      partnerId: socket.id,
    });

    // Notify both users — the first socket is the WebRTC initiator
    socket.emit('matched', {
      roomId,
      partnerId: matchedSocketId,
      initiator: true,
      partnerNickname: matchedSocket.userNickname,
    });

    matchedSocket.emit('matched', {
      roomId,
      partnerId: socket.id,
      initiator: false,
      partnerNickname: socket.userNickname,
    });

    console.log(`[matched] ${socket.userNickname} ↔ ${matchedSocket.userNickname} in ${roomId}`);
  }

  // ─── Helper: end the current call for a socket ───────────
  /**
   * Tear down the current call: notify the partner, leave the room,
   * and reset both sessions.
   *
   * @param {import('socket.io').Socket} socket
   * @param {string} eventName  event to emit to the partner (e.g. 'partner-left')
   */
  function endCall(socket, eventName) {
    const session = store.sessions.get(socket.id);
    if (!session?.roomId) return;

    const { roomId, partnerId } = session;

    // Notify partner
    if (partnerId) {
      io.to(partnerId).emit(eventName, { socketId: socket.id });

      // Reset partner's session (they are no longer in a call)
      const partnerSession = store.sessions.get(partnerId);
      if (partnerSession) {
        store.addSession(partnerId, {
          userId: partnerSession.userId,
          roomId: null,
          partnerId: null,
        });
      }

      // Partner leaves the room
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) partnerSocket.leave(roomId);
    }

    // Reset this socket's session
    store.addSession(socket.id, {
      userId: socket.userId,
      roomId: null,
      partnerId: null,
    });

    socket.leave(roomId);
  }
}
