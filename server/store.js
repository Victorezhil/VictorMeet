/**
 * store.js — Supabase Integrated Data Store for VictorMeet
 *
 * Manages user records, abuse reports, and block lists via Supabase,
 * while keeping transient session mappings and matching queues in-memory
 * for ultra-fast, low-latency signaling.
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[store] Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

/** Local cache for users to avoid querying database on every request. */
const usersCache = new Map();

/** Active socket sessions (in-memory only). */
const sessions = new Map();

/** Block lists cache (userId -> Set of blocked userIds). */
const blocksCache = new Map();

/** In-memory matchmaking queue. */
const matchQueue = [];

// ─── User helpers ────────────────────────────────────────────

/**
 * Create a new user in Supabase and cache it locally.
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
    password_hash: passwordHash,
    nickname,
    interests,
    account_type: accountType,
    tokens: 0,
    created_at: new Date().toISOString(),
  };

  // 1. Insert to Supabase
  const { data, error } = await supabase
    .from('users')
    .insert([newUser])
    .select()
    .single();

  if (error) {
    console.error('[store] Supabase insert user error:', error);
    throw new Error(error.message);
  }

  // Map backend key names (snake_case to camelCase) if needed,
  // but keeping it simple:
  const normalizedUser = {
    id: data.id,
    email: data.email,
    passwordHash: data.password_hash,
    nickname: data.nickname,
    interests: data.interests,
    accountType: data.account_type,
    tokens: data.tokens,
    createdAt: data.created_at,
  };

  // 2. Cache locally
  usersCache.set(normalizedUser.id, normalizedUser);
  return normalizedUser;
}

/**
 * Retrieve user profile from cache or query Supabase.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUser(userId) {
  if (usersCache.has(userId)) {
    return usersCache.get(userId);
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

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

  usersCache.set(user.id, user);
  return user;
}

/**
 * Retrieve user profile by email from cache or query Supabase.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function getUserByEmail(email) {
  // Check cache first
  for (const user of usersCache.values()) {
    if (user.email === email) return user;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

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

  usersCache.set(user.id, user);
  return user;
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
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('user_id', userId);

  if (error) {
    console.error('[store] Error loading blocks for user:', userId, error);
    return;
  }

  const set = new Set();
  data.forEach((row) => set.add(row.blocked_id));
  blocksCache.set(userId, set);
}

/**
 * Persistent block insert to Supabase and cache sync.
 * @param {string} userId
 * @param {string} blockedId
 */
async function addBlock(userId, blockedId) {
  // 1. Insert to Supabase
  const { error } = await supabase
    .from('blocks')
    .insert([{ user_id: userId, blocked_id: blockedId }]);

  if (error) {
    console.error('[store] Supabase insert block error:', error);
  }

  // 2. Cache locally
  if (!blocksCache.has(userId)) {
    blocksCache.set(userId, new Set());
  }
  blocksCache.get(userId).add(blockedId);
}

/**
 * Synchronously check blocks using local cache.
 * @param {string} userA
 * @param {string} userB
 * @returns {boolean}
 */
function isBlocked(userA, userB) {
  const aBlocks = blocksCache.get(userA);
  const bBlocks = blocksCache.get(userB);
  return (aBlocks?.has(userB) ?? false) || (bBlocks?.has(userA) ?? false);
}

// ─── Report helpers ──────────────────────────────────────────

/**
 * Submit an abuse report to Supabase.
 * @param {{ reporterId: string, reportedId: string, reason: string,
 *           description?: string }} data
 */
async function addReport({ reporterId, reportedId, reason, description = '' }) {
  const { error } = await supabase
    .from('reports')
    .insert([
      {
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        description,
      },
    ]);

  if (error) {
    console.error('[store] Supabase insert report error:', error);
  }
}

// ─── Exported Store ──────────────────────────────────────────

const store = {
  // Raw collections
  users: usersCache,
  sessions,
  blocks: blocksCache,
  matchQueue,

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
