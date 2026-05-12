import sql from 'mssql';
import pool from '../config/db.js';

// ─── XP → expertise_level ladder ─────────────────────────────────────────────
// Maps to the four values validated in ProfileController.js and the DB constraint:
//   'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
// role is a PERMISSIONS column (Analyst / Moderator / Administrator).
// It is set by admins only and must NEVER be touched by the XP system.
export const EXPERTISE_THRESHOLDS = [
  { level: 'Expert', xp: 500 },
  { level: 'Advanced', xp: 200 },
  { level: 'Intermediate', xp: 75 },
  { level: 'Beginner', xp: 0 }, // default / floor
];

/**
 * Return the expertise_level that corresponds to a given reputation score.
 */
export const expertiseForScore = (score) => {
  for (const tier of EXPERTISE_THRESHOLDS) {
    if (score >= tier.xp) return tier.level;
  }
  return 'Beginner';
};

/**
 * Core helper: award XP then sync expertise_level if it changed.
 * role is intentionally never read or written here.
 */
const awardXp = async (userId, points) => {
  // 1. Increment XP and get back the new score + current expertise_level
  const result = await pool.request()
    .input('userId', sql.Int, Number(userId))
    .input('points', sql.Int, points)
    .query(`
      UPDATE Users
      SET reputation_score = reputation_score + @points
      OUTPUT
        INSERTED.reputation_score,
        INSERTED.expertise_level
      WHERE user_id = @userId
    `);

  const updated = result.recordset[0];
  if (!updated) return;

  const { reputation_score: newScore, expertise_level: currentExpertise } = updated;

  // 2. Only write back if expertise_level actually needs to change
  const earnedExpertise = expertiseForScore(newScore);
  if (earnedExpertise === currentExpertise) return;

  await pool.request()
    .input('userId', sql.Int, Number(userId))
    .input('expertise_level', sql.NVarChar, earnedExpertise)
    .query('UPDATE Users SET expertise_level = @expertise_level WHERE user_id = @userId');
};

// ─── XP event values ──────────────────────────────────────────────────────────
export const xpEvents = {
  SUBMISSION_CREATED: 10,
  SUBMISSION_PUBLISHED: 25,
  COMMENT_ADDED: 3,
  LIKE_GIVEN: 1,
  LIKE_RECEIVED: 1,
  REVIEW_SUBMITTED: 5,
  REVIEW_RECEIVED: 2,
  ADMIN_APPROVED: 25,
};

// ─── Public helpers ───────────────────────────────────────────────────────────
export const awardSubmissionXp = async (userId, status) => {
  const points = status === 'Published'
    ? xpEvents.SUBMISSION_PUBLISHED
    : xpEvents.SUBMISSION_CREATED;
  await awardXp(userId, points);
  return points;
};

export const awardCommentXp = async (userId) => {
  await awardXp(userId, xpEvents.COMMENT_ADDED);
  return xpEvents.COMMENT_ADDED;
};

export const awardLikeXp = async (userId, postOwnerId) => {
  if (postOwnerId && postOwnerId !== userId) {
    await awardXp(postOwnerId, xpEvents.LIKE_RECEIVED);
  }
  await awardXp(userId, xpEvents.LIKE_GIVEN);
};

export const awardReviewXp = async (authorId, reviewerId) => {
  await awardXp(authorId, xpEvents.REVIEW_RECEIVED);
  await awardXp(reviewerId, xpEvents.REVIEW_SUBMITTED);
};

export const awardApprovalXp = async (userId) => {
  await awardXp(userId, xpEvents.ADMIN_APPROVED);
};
