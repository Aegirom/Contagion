import sql from "mssql";
import pool from "../config/db.js";

// Internal notification helper (same pattern as PostsController)
const createNotification = async ({ userId, type, message, actorUsername, relatedSubmissionId, relatedReviewId }) => {
  try {
    await pool.request()
      .input("userId", sql.Int, Number(userId))
      .input("type", sql.NVarChar(50), type)
      .input("message", sql.NVarChar(500), message)
      .input("actorUsername", sql.NVarChar(100), actorUsername)
      .input("relatedSubmissionId", sql.Int, relatedSubmissionId ? Number(relatedSubmissionId) : null)
      .input("relatedReviewId", sql.Int, relatedReviewId ? Number(relatedReviewId) : null)
      .query(`
        INSERT INTO Notifications (user_id, type, message, actor_username, related_submission_id, related_review_id, is_read)
        VALUES (@userId, @type, @message, @actorUsername, @relatedSubmissionId, @relatedReviewId, 0)
      `);
  } catch (error) {
    console.error("[PeerReview] Failed to create notification:", error.message);
  }
};

// POST /:submissionId/reviews — Submit a peer review
export const submitReview = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const reviewerId = req.user.userId || req.user.user_id;
    const { technical_score, methodology_score, documentation_score, insights_score, comments } = req.body;

    if (!technical_score || !methodology_score || !documentation_score || !insights_score || !comments) {
      return res.status(400).json({ error: "All scores and comments are required" });
    }

    const scores = [technical_score, methodology_score, documentation_score, insights_score];
    for (const score of scores) {
      if (score < 1 || score > 10) {
        return res.status(400).json({ error: "All scores must be between 1 and 10" });
      }
    }

    if (comments.trim().length < 10) {
      return res.status(400).json({ error: "Comments must be at least 10 characters" });
    }

    // Check submission exists and get author info
    const submissionCheck = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .query(`
        SELECT s.submission_id, s.author_id, u.username, u.email
        FROM Analysis_Submissions s
        JOIN Users u ON s.author_id = u.user_id
        WHERE s.submission_id = @submissionId
      `);

    if (submissionCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const submission = submissionCheck.recordset[0];

    // Can't review your own submission
    if (submission.author_id === reviewerId) {
      return res.status(403).json({ error: "You cannot review your own submission" });
    }

    // Check if user already reviewed this submission
    const existingReview = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("reviewerId", sql.Int, Number(reviewerId))
      .query("SELECT review_id FROM Peer_Reviews WHERE submission_id = @submissionId AND reviewer_id = @reviewerId");

    if (existingReview.recordset.length > 0) {
      return res.status(409).json({ error: "You have already reviewed this submission" });
    }

    // Get reviewer's username for notification
    const reviewerInfo = await pool.request()
      .input("reviewerId", sql.Int, Number(reviewerId))
      .query("SELECT username FROM Users WHERE user_id = @reviewerId");

    const reviewerUsername = reviewerInfo.recordset[0]?.username || "Unknown";

    // Insert the review
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("reviewerId", sql.Int, Number(reviewerId))
      .input("technicalScore", sql.Int, technical_score)
      .input("methodologyScore", sql.Int, methodology_score)
      .input("documentationScore", sql.Int, documentation_score)
      .input("insightsScore", sql.Int, insights_score)
      .input("comments", sql.NVarChar(sql.MAX), comments.trim())
      .input("status", sql.NVarChar(20), "Submitted")
      .query(`
        INSERT INTO Peer_Reviews (submission_id, reviewer_id, technical_score, methodology_score, documentation_score, insights_score, comments, status)
        OUTPUT INSERTED.review_id, INSERTED.reviewed_at
        VALUES (@submissionId, @reviewerId, @technicalScore, @methodologyScore, @documentationScore, @insightsScore, @comments, @status)
      `);

    const review = result.recordset[0];

    // Notify the submission author
    await createNotification({
      userId: submission.author_id,
      type: "peer_review",
      message: `reviewed your analysis "${submission.username}'s submission"`,
      actorUsername: reviewerUsername,
      relatedSubmissionId: Number(submissionId),
      relatedReviewId: review.review_id,
    });

    // Small reputation boost for the author (receiving a review)
    await pool.request()
      .input("authorId", sql.Int, submission.author_id)
      .query("UPDATE Users SET reputation_score = reputation_score + 2 WHERE user_id = @authorId");

    // XP gain: +5 XP for submitting a peer review
    await pool.request()
      .input("reviewerId", sql.Int, Number(reviewerId))
      .query("UPDATE Users SET reputation_score = reputation_score + 5 WHERE user_id = @reviewerId");

    res.status(201).json({
      review_id: review.review_id,
      reviewed_at: review.reviewed_at,
      message: "Review submitted successfully",
      xp_gained: 5,
    });
  } catch (error) {
    console.error("[PeerReview] Error submitting review:", error.message);
    if (error.code === "EREQUEST" && error.message.includes("uq_reviews_user_submission")) {
      return res.status(409).json({ error: "You have already reviewed this submission" });
    }
    res.status(500).json({ error: "Failed to submit review" });
  }
};

// GET /:submissionId/reviews — Get all reviews for a submission
export const getSubmissionReviews = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .query(`
        SELECT 
          pr.review_id,
          pr.technical_score,
          pr.methodology_score,
          pr.documentation_score,
          pr.insights_score,
          pr.comments,
          pr.status,
          pr.reviewed_at,
          u.user_id AS reviewer_id,
          u.username AS reviewer_username,
          u.role AS reviewer_role,
          u.expertise_level AS reviewer_expertise
        FROM Peer_Reviews pr
        JOIN Users u ON pr.reviewer_id = u.user_id
        WHERE pr.submission_id = @submissionId
        ORDER BY pr.reviewed_at DESC
      `);

    res.json({ reviews: result.recordset });
  } catch (error) {
    console.error("[PeerReview] Error fetching reviews:", error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// GET /:submissionId/reviews/me — Get current user's review for this submission
export const getUserReview = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const reviewerId = req.user.userId || req.user.user_id;

    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("reviewerId", sql.Int, Number(reviewerId))
      .query(`
        SELECT 
          pr.review_id,
          pr.technical_score,
          pr.methodology_score,
          pr.documentation_score,
          pr.insights_score,
          pr.comments,
          pr.status,
          pr.reviewed_at
        FROM Peer_Reviews pr
        WHERE pr.submission_id = @submissionId AND pr.reviewer_id = @reviewerId
      `);

    if (result.recordset.length === 0) {
      return res.json({ review: null, hasReviewed: false });
    }

    res.json({ review: result.recordset[0], hasReviewed: true });
  } catch (error) {
    console.error("[PeerReview] Error fetching user review:", error.message);
    res.status(500).json({ error: "Failed to fetch your review" });
  }
};

// GET /:submissionId/reviews/aggregate — Get average scores for a submission
export const getAggregateScores = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .query(`
        SELECT 
          COUNT(*) AS review_count,
          AVG(CAST(technical_score AS DECIMAL(5,2))) AS avg_technical,
          AVG(CAST(methodology_score AS DECIMAL(5,2))) AS avg_methodology,
          AVG(CAST(documentation_score AS DECIMAL(5,2))) AS avg_documentation,
          AVG(CAST(insights_score AS DECIMAL(5,2))) AS avg_insights,
          AVG(CAST(technical_score + methodology_score + documentation_score + insights_score AS DECIMAL(5,2))) / 4 AS avg_overall
        FROM Peer_Reviews
        WHERE submission_id = @submissionId
      `);

    const row = result.recordset[0];
    res.json({
      reviewCount: row.review_count,
      averageScores: row.review_count > 0 ? {
        overall: Math.round(row.avg_overall * 10) / 10,
        technical: Math.round(row.avg_technical * 10) / 10,
        methodology: Math.round(row.avg_methodology * 10) / 10,
        documentation: Math.round(row.avg_documentation * 10) / 10,
        insights: Math.round(row.avg_insights * 10) / 10,
      } : null,
    });
  } catch (error) {
    console.error("[PeerReview] Error fetching aggregate scores:", error.message);
    res.status(500).json({ error: "Failed to fetch aggregate scores" });
  }
};
