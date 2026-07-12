/**
 * store.js — Supabase Integrated Data Store with Automatic In-Memory Fallback
 *
 * Manages user records, abuse reports, and block lists via Supabase.
 * If Supabase is offline, the tables are missing, or credentials are invalid,
 * it automatically falls back to local in-memory collections so the app
 * NEVER crashes and ALWAYS works out of the box.
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
 * Create a new user in Supabase (with automatic local fallback).
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

  if (useSupabase) {
    try {
      const { data, error } = await supabase
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
        .select()
        .single();

      if (error) throw error;

      const normalized = {
        id: data.id,
        email: data.email,
        passwordHash: data.password_hash,
        nickname: data.nickname,
        interests: data.interests,
        accountType: data.account_type,
        tokens: data.tokens,
        createdAt: data.created_at,
      };

      users.set(normalized.id, normalized);
      return normalized;
    } catch (err) {
      console.warn('[store] Supabase addUser failed. Falling back to In-Memory mode:', err.message);
    }
  }

  // Fallback to in-memory
  users.set(id, newUser);
  return newUser;
}

/**
 * Retrieve user profile from cache, in-memory store, or query Supabase.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUser(userId) {
  // Check in-memory/cache first
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
      console.warn('[store] Supabase getUser failed. Checking local storage:', err.message);
    }
  }

  return null;
}

/**
 * Retrieve user profile by email.
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
      console.warn('[store] Supabase loadUserBlocks failed, using local blocks:', err.message);
    }
  }
}

/**
 * Record a block.
 * @param {string} userId
 * @param {string} blockedId
 */
async function addBlock(userId, blockedId) {
  // 1. Sync cache
  if (!blocks.has(userId)) {
    blocks.set(userId, new Set());
  }
  blocks.get(userId).add(blockedId);

  // 2. Persist to Supabase
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from('blocks')
        .insert([{ user_id: userId, blocked_id: blockedId }]);
      if (error) throw error;
    } catch (err) {
      console.warn('[store] Supabase addBlock failed, stored locally:', err.message);
    }
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
 * File an abuse report.
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

  // 1. Save in-memory
  reports.push(reportObj);

  // 2. Persist to Supabase
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from('reports')
        .insert([{
          reporter_id: reporterId,
          reported_id: reportedId,
          reason,
          description,
          created_at: reportObj.timestamp
        }]);
      if (error) throw error;
    } catch (err) {
      console.warn('[store] Supabase addReport failed, stored locally:', err.message);
    }
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
