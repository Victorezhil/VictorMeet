/**
 * index.js — Main Server Entry Point for VictorMeet
 *
 * Bootstraps:
 *   • Express app with CORS + JSON body parsing
 *   • REST API routes for auth and user management
 *   • Socket.io server for real-time signaling
 *   • Connects everything to the shared in-memory store
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import path from 'path';

import store from './store.js';
import MatchQueue from './matchQueue.js';
import { setupSignaling } from './signaling.js';
import {
  registerUser,
  loginUser,
  createGuestSession,
  authMiddleware,
} from './auth.js';

// ─── Server setup ────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = 'http://localhost:3002';

const app = express();
const httpServer = createServer(app);

const io = new SocketIO(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Middleware ───────────────────────────────────────────────

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// ─── Auth routes ─────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { email, password, nickname, interests? }
 * Returns: { token, user }
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nickname, interests } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({ error: 'Email, password, and nickname are required' });
    }

    const result = await registerUser(email, password, nickname, interests);
    res.status(201).json(result);
  } catch (err) {
    const status = err.message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * POST /api/auth/guest
 * No body required.
 * Returns: { token, user }
 */
app.post('/api/auth/guest', async (_req, res) => {
  try {
    const result = await createGuestSession();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── User routes (protected) ────────────────────────────────

/**
 * GET /api/user/profile
 * Headers: Authorization: Bearer <token>
 * Returns the authenticated user's profile (sans passwordHash).
 */
app.get('/api/user/profile', authMiddleware, (req, res) => {
  const { passwordHash, ...profile } = req.user;
  res.json(profile);
});

/**
 * PUT /api/user/profile
 * Headers: Authorization: Bearer <token>
 * Body: { nickname?, interests? }
 * Updates the authenticated user's profile fields.
 */
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  const { nickname, interests } = req.body;
  const user = await store.getUser(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (nickname !== undefined) user.nickname = nickname;
  if (interests !== undefined) user.interests = interests;

  // Update in Supabase
  const { error } = await store.supabase
    .from('users')
    .update({ nickname, interests })
    .eq('id', req.user.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { passwordHash, ...profile } = user;
  res.json(profile);
});

/**
 * GET /api/user/subscription
 * Headers: Authorization: Bearer <token>
 * Returns the user's current subscription / account info.
 */
app.get('/api/user/subscription', authMiddleware, (req, res) => {
  res.json({
    accountType: req.user.accountType,
    tokens: req.user.tokens,
  });
});

/**
 * POST /api/user/upgrade
 * Headers: Authorization: Bearer <token>
 * Simulates a premium upgrade: sets accountType to 'premium' and grants tokens.
 */
app.post('/api/user/upgrade', authMiddleware, async (req, res) => {
  const user = await store.getUser(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.accountType = 'premium';
  user.tokens += 100; // Grant 100 tokens on upgrade

  // Update in Supabase
  const { error } = await store.supabase
    .from('users')
    .update({ account_type: 'premium', tokens: user.tokens })
    .eq('id', req.user.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { passwordHash, ...profile } = user;
  res.json({
    message: 'Upgraded to premium successfully',
    user: profile,
  });
});

// ─── Socket.io signaling ────────────────────────────────────

const matchQueue = new MatchQueue();
setupSignaling(io, store, matchQueue);

// Serve static client assets in production
app.use(express.static('dist'));
app.get('*', (req, res) => {
  res.sendFile(path.resolve('dist', 'index.html'));
});

// ─── Start server ────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`VictorMeet server running on port ${PORT}`);
});
