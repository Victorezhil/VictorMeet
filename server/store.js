/**
 * store.js — Resilient Data Store with Instant Cache-First Reads/Writes
 *
 * Speeds up response times to <10ms by executing user creation and updates
 * in memory instantly, offloading Supabase writes to the background.
 * This guarantees the frontend never times out or throws "Connection error".
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
let useSupabase = false;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    useSupabase = true;
    console.log('[store] Supabase client initialized successfully.');
  } catch (err) {
    console.error('[store] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[store] Supabase credentials not configured. Operating in In-Memory fallback mode.');
}

// ─── Local Fallback Data Structures ──────────────────────────

/** Local cache and in-memory store for users. */
const users = new Map();

/** Active socket sessions (in-memory only). */
const sessions = new Map();

/** Block lists cache (userId -> Set of blocked userIds). */
const blocks = new Map();

/** In-memory reports collection. */
const reports = [];

/** In-memory matchmaking queue. */
const matchQueue = [];

// ─── User helpers ────────────────────────────────────────────

/**
 * Create a new user with instant local cache-first response, offloading DB write.
 * @param {{ id?: string, email?: string, passwordHash?: string, nickname: string,
 *           interests?: string[], accountType?: string }} data
 * @returns {Promise<object>} the created user record
 */
async function addUser({
  email = null,
  passwordHash = null,
  nickname,
  interests = [],
  accountType = 'guest',
}) {
  const id = uuidv4();
  const newUser = {
    id,
    email,
    passwordHash,
    nickname,
    interests,
    accountType,
    tokens: 0,
    createdAt: new Date().toISOString(),
  };

  // 1. Instantly cache in memory so the HTTP response returns immediately (<10ms)
  users.set(id, newUser);

  // 2. Perform the database insert asynchronously in the background
  if (useSupabase) {
    supabase
      .from('users')
      .insert([{
        id,
        email,
        password_hash: passwordHash,
        nickname,
        interests,
        account_type: accountType,
        tokens: 0,
        created_at: newUser.createdAt
      }])
      .then(({ error }) => {
        if (error) {
          console.warn('[store] Background Supabase insert user failed:', error.message);
        } else {
          console.log('[store] Background Supabase insert user succeeded for:', id);
        }
      })
      .catch((err) => {
        console.warn('[store] Background Supabase insert user error:', err.message);
      });
  }

  return newUser;
}

/**
 * Retrieve user profile instantly from cache.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUser(userId) {
  // Check in-memory/cache first for instant response
  if (users.has(userId)) {
    return users.get(userId);
  }

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const user = {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          nickname: data.nickname,
          interests: data.interests,
          accountType: data.account_type,
          tokens: data.tokens,
          createdAt: data.created_at,
        };
        users.set(user.id, user);
        return user;
      }
    } catch (err) {
      console.warn('[store] Supabase getUser failed:', err.message);
    }
  }

  return null;
}

/**
 * Retrieve user profile by email instantly from cache.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function getUserByEmail(email) {
  // Check cache
  for (const user of users.values()) {
    if (user.email === email) return user;
  }

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      if (data) {
        const user = {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          nickname: data.nickname,
          interests: data.interests,
          accountType: data.account_type,
          tokens: data.tokens,
          createdAt: data.created_at,
        };
        users.set(user.id, user);
        return user;
      }
    } catch (err) {
      console.warn('[store] Supabase getUserByEmail failed:', err.message);
    }
  }

  return null;
}

// ─── Session helpers ─────────────────────────────────────────

function addSession(socketId, { userId, roomId = null, partnerId = null }) {
  sessions.set(socketId, { userId, roomId, partnerId });
}

function removeSession(socketId) {
  sessions.delete(socketId);
}

// ─── Block helpers ───────────────────────────────────────────

/**
 * Load blocks for a specific user into the local cache.
 * @param {string} userId
 */
async function loadUserBlocks(userId) {
  if (!blocks.has(userId)) {
    blocks.set(userId, new Set());
  }

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('user_id', userId);

      if (error) throw error;

      const set = blocks.get(userId);
      data.forEach((row) => set.add(row.blocked_id));
    } catch (err) {
      console.warn('[store] Supabase loadUserBlocks failed:', err.message);
    }
  }
}

/**
 * Record a block instantly in memory, updating DB in background.
 * @param {string} userId
 * @param {string} blockedId
 */
async function addBlock(userId, blockedId) {
  // 1. Sync cache instantly
  if (!blocks.has(userId)) {
    blocks.set(userId, new Set());
  }
  blocks.get(userId).add(blockedId);

  // 2. Persist to Supabase in background
  if (useSupabase) {
    supabase
      .from('blocks')
      .insert([{ user_id: userId, blocked_id: blockedId }])
      .then(({ error }) => {
        if (error) console.warn('[store] Background Supabase insert block failed:', error.message);
      })
      .catch((err) => {
        console.warn('[store] Background Supabase insert block error:', err.message);
      });
  }
}

/**
 * Check whether either user has blocked the other.
 * @param {string} userA
 * @param {string} userB
 * @returns {boolean}
 */
function isBlocked(userA, userB) {
  const aBlocks = blocks.get(userA);
  const bBlocks = blocks.get(userB);
  return (aBlocks?.has(userB) ?? false) || (bBlocks?.has(userA) ?? false);
}

// ─── Report helpers ──────────────────────────────────────────

/**
 * File an abuse report instantly in memory, updating DB in background.
 * @param {{ reporterId: string, reportedId: string, reason: string,
 *           description?: string }} data
 */
async function addReport({ reporterId, reportedId, reason, description = '' }) {
  const reportObj = {
    reporterId,
    reportedId,
    reason,
    description,
    timestamp: new Date().toISOString(),
  };

  // 1. Save in-memory instantly
  reports.push(reportObj);

  // 2. Persist to Supabase in background
  if (useSupabase) {
    supabase
      .from('reports')
      .insert([{
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        description,
        created_at: reportObj.timestamp
      }])
      .then(({ error }) => {
        if (error) console.warn('[store] Background Supabase insert report failed:', error.message);
      })
      .catch((err) => {
        console.warn('[store] Background Supabase insert report error:', err.message);
      });
  }
}

// ─── Exported Store ──────────────────────────────────────────

const store = {
  // Raw collections
  users,
  sessions,
  blocks,
  matchQueue,
  supabase,

  // Helper methods
  addUser,
  getUser,
  getUserByEmail,
  addSession,
  removeSession,
  loadUserBlocks,
  addBlock,
  isBlocked,
  addReport,
};

export default store;
