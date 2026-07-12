/**
 * auth.js — Authentication for VictorMeet
 *
 * Handles registration, login, anonymous guest sessions, and JWT
 * token creation / verification. Uses bcryptjs for password hashing.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import store from './store.js';

/** Signing key for all JWTs (in production, use an env-var / secret manager). */
const JWT_SECRET = process.env.JWT_SECRET || 'victormeet-secret-key-2024';

/** Token lifetimes by account type. */
const TOKEN_EXPIRY = {
  registered: '24h',
  premium: '24h',
  guest: '4h',
};

// ─── Random guest nicknames ──────────────────────────────────

const adjectives = [
  'Swift', 'Cosmic', 'Silent', 'Bold', 'Clever',
  'Lucky', 'Mystic', 'Brave', 'Gentle', 'Vivid',
  'Happy', 'Witty', 'Noble', 'Fierce', 'Calm',
  'Bright', 'Daring', 'Jolly', 'Keen', 'Lively',
];

const nouns = [
  'Phoenix', 'Panda', 'Eagle', 'Tiger', 'Dolphin',
  'Falcon', 'Wolf', 'Owl', 'Fox', 'Hawk',
  'Lion', 'Bear', 'Otter', 'Raven', 'Lynx',
  'Jaguar', 'Cobra', 'Heron', 'Bison', 'Crane',
];

/**
 * Generate a fun guest nickname like "SwiftPanda4219".
 * @returns {string}
 */
function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit suffix
  return `${adj}${noun}${num}`;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Register a new user with email + password.
 * @param {string} email
 * @param {string} password    plaintext — will be hashed before storage
 * @param {string} nickname
 * @param {string[]} interests
 * @returns {{ token: string, user: object }}
 * @throws {Error} if email already in use
 */
export async function registerUser(email, password, nickname, interests = []) {
  // Duplicate check
  const existing = await store.getUserByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash with a cost-factor of 10
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await store.addUser({
    email,
    passwordHash,
    nickname,
    interests,
    accountType: 'registered',
  });

  const token = jwt.sign(
    { userId: user.id, accountType: user.accountType },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY.registered },
  );

  return { token, user: sanitizeUser(user) };
}

/**
 * Authenticate an existing user by email + password.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 * @throws {Error} on invalid credentials
 */
export async function loginUser(email, password) {
  const user = await store.getUserByEmail(email);
  if (!user) throw new Error('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid email or password');

  const expiry = TOKEN_EXPIRY[user.accountType] || TOKEN_EXPIRY.registered;
  const token = jwt.sign(
    { userId: user.id, accountType: user.accountType },
    JWT_SECRET,
    { expiresIn: expiry },
  );

  return { token, user: sanitizeUser(user) };
}

/**
 * Create an anonymous guest session (no email / password required).
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function createGuestSession() {
  const nickname = generateNickname();

  const user = await store.addUser({
    nickname,
    accountType: 'guest',
  });

  const token = jwt.sign(
    { userId: user.id, accountType: user.accountType },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY.guest },
  );

  return { token, user: sanitizeUser(user) };
}

/**
 * Verify a JWT and return the decoded payload.
 * @param {string} token
 * @returns {{ userId: string, accountType: string, iat: number, exp: number }}
 * @throws {Error} if the token is invalid or expired
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware that requires a valid Bearer token.
 * On success, attaches `req.user` (the full user record) to the request.
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = await store.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Internal helpers ────────────────────────────────────────

/**
 * Strip sensitive fields (passwordHash) before sending user data to clients.
 * @param {object} user
 * @returns {object}
 */
function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
