/**
 * matchQueue.js — Matching Queue Engine for VictorMeet
 *
 * Manages the pool of users waiting for a video-chat partner and
 * implements the matching algorithm:
 *   1. Never match blocked users.
 *   2. Respect premium users' gender / region filters.
 *   3. Prefer partners with the highest interest overlap.
 *   4. Fall back to random FIFO if no interest match exists.
 *   5. Premium users get 2× weight (checked first).
 */

import store from './store.js';

export default class MatchQueue {
  constructor() {
    /**
     * Internal queue of waiting users.
     * @type {Array<{
     *   socketId: string,
     *   userId: string,
     *   interests: string[],
     *   filters: { gender?: string, region?: string },
     *   accountType: string,
     *   timestamp: number
     * }>}
     */
    this.queue = [];
  }

  // ─── Public API ──────────────────────────────────────────

  /**
   * Add a user to the match queue.
   * Premium users are inserted at the front so they are evaluated first
   * (2× weight / priority).
   *
   * @param {string} socketId
   * @param {string} userId
   * @param {string[]} interests
   * @param {{ gender?: string, region?: string }} filters
   * @param {string} accountType  'guest' | 'registered' | 'premium'
   */
  addToQueue(socketId, userId, interests = [], filters = {}, accountType = 'guest') {
    // Prevent duplicate entries
    this.removeFromQueue(socketId);

    const entry = {
      socketId,
      userId,
      interests: interests.map((i) => i.toLowerCase().trim()),
      filters,
      accountType,
      timestamp: Date.now(),
    };

    // Premium users get priority — insert at the front of the queue
    if (accountType === 'premium') {
      this.queue.unshift(entry);
    } else {
      this.queue.push(entry);
    }
  }

  /**
   * Remove a user from the queue (e.g. on disconnect or successful match).
   * @param {string} socketId
   */
  removeFromQueue(socketId) {
    this.queue = this.queue.filter((e) => e.socketId !== socketId);
  }

  /**
   * Find the best available match for the given socket.
   *
   * Algorithm (in order):
   *   1. Filter out self, blocked users, and filter-incompatible users.
   *   2. Score remaining candidates by shared-interest count.
   *   3. Pick the candidate with the highest score.
   *   4. If all scores are 0 (no overlap), fall back to FIFO order.
   *
   * @param {string} socketId
   * @returns {string|null}  The matched socketId, or null if none available.
   */
  findMatch(socketId) {
    const seeker = this.queue.find((e) => e.socketId === socketId);
    if (!seeker) return null;

    // Build list of eligible candidates
    const candidates = this.queue.filter((candidate) => {
      // Never match with yourself
      if (candidate.socketId === socketId) return false;

      // Never match blocked users (check both directions)
      if (store.isBlocked(seeker.userId, candidate.userId)) return false;

      // Respect premium filter constraints (both directions)
      if (!this._filtersCompatible(seeker, candidate)) return false;
      if (!this._filtersCompatible(candidate, seeker)) return false;

      return true;
    });

    if (candidates.length === 0) return null;

    // ── Score by interest overlap ──────────────────────────
    let bestCandidate = null;
    let bestScore = -1;

    for (const candidate of candidates) {
      const score = this._interestOverlap(seeker.interests, candidate.interests);

      // Premium candidates get 2× weight in tie-breaking
      const adjustedScore = candidate.accountType === 'premium' ? score + 0.5 : score;

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore;
        bestCandidate = candidate;
      }
    }

    // If nobody shares interests, fall back to first candidate (FIFO order
    // is already preserved because the queue is ordered by insertion time
    // with premium users at the front).
    if (bestScore <= 0) {
      bestCandidate = candidates[0];
    }

    return bestCandidate.socketId;
  }

  /**
   * Current number of users waiting in the queue.
   * @returns {number}
   */
  getQueueSize() {
    return this.queue.length;
  }

  // ─── Private helpers ─────────────────────────────────────

  /**
   * Count how many interests two arrays share.
   * @param {string[]} a
   * @param {string[]} b
   * @returns {number}
   */
  _interestOverlap(a, b) {
    if (!a.length || !b.length) return 0;
    const setB = new Set(b);
    return a.reduce((count, interest) => count + (setB.has(interest) ? 1 : 0), 0);
  }

  /**
   * Check whether `a`'s premium filters are satisfied by `b`.
   * Non-premium users don't have enforced filters, so they always pass.
   *
   * @param {{ filters: object, accountType: string }} a
   * @param {{ filters: object, accountType: string }} b
   * @returns {boolean}
   */
  _filtersCompatible(a, b) {
    // Only premium filters are enforced
    if (a.accountType !== 'premium') return true;

    const { gender, region } = a.filters;

    // If premium user specified a gender filter, the candidate must match
    if (gender && b.filters.gender && b.filters.gender !== gender) {
      return false;
    }

    // If premium user specified a region filter, the candidate must match
    if (region && b.filters.region && b.filters.region !== region) {
      return false;
    }

    return true;
  }
}
