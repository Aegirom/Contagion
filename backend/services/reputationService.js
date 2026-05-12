import sql from 'mssql';
import pool from '../config/db.js';

const awardXp = async (userId, points) => {
  await pool.request()
    .input("userId", sql.Int, Number(userId))
    .input("points", sql.INT, points)
    .query("UPDATE Users SET reputation_score = reputation_score + @points WHERE user_id = @userId");
};

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

export const awardSubmissionXp = async (userId, status) => {
  const points = status === 'Published' ? xpEvents.SUBMISSION_PUBLISHED : xpEvents.SUBMISSION_CREATED;
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
