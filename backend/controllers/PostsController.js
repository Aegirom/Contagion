import sql from "mssql";
import pool from "../config/db.js";
import { createNotification } from "../services/notificationService.js";
import { awardCommentXp, awardLikeXp } from "../services/reputationService.js";
import { convertR2ToHttpUrl } from "../services/r2Service.js";
import { invalidatePrefix } from "../services/cacheService.js";

const getPostOwnerId = async (submissionId) => {
  const result = await pool
    .request()
    .input("submissionId", sql.Int, Number(submissionId))
    .query(
      "SELECT author_id FROM Analysis_Submissions WHERE submission_id = @submissionId",
    );
  return result.recordset[0]?.author_id;
};

export const getComments = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId)).query(`
        SELECT 
          pc.comment_id,
          pc.content,
          pc.created_at,
          u.username,
          u.user_id,
          u.role,
          p.avatar_url
        FROM Post_Comments pc
        JOIN Users u ON pc.user_id = u.user_id
        LEFT JOIN User_Profiles p ON u.user_id = p.user_id
        WHERE pc.submission_id = @submissionId
        ORDER BY pc.created_at DESC
      `);

    const comments = result.recordset.map((c) => ({
      ...c,
      avatar_url: convertR2ToHttpUrl(c.avatar_url),
    }));

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const result = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId))
      .input("content", sql.NVarChar(sql.MAX), content.trim()).query(`
        INSERT INTO Post_Comments (submission_id, user_id, content)
        OUTPUT INSERTED.comment_id, INSERTED.created_at
        VALUES (@submissionId, @userId, @content)
      `);

    const userResult = await pool
      .request()
      .input("userId", sql.Int, Number(userId))
      .query("SELECT username FROM Users WHERE user_id = @userId");

    const postOwnerId = await getPostOwnerId(submissionId);

    if (!result.recordset || !result.recordset[0]) {
      return res.status(500).json({ error: "Failed to create comment" });
    }
    if (!userResult.recordset || !userResult.recordset[0]) {
      return res
        .status(500)
        .json({ error: "Failed to retrieve user information" });
    }

    if (postOwnerId && postOwnerId !== userId) {
      await createNotification({
        userId: postOwnerId,
        type: "comment",
        message: `commented on your analysis`,
        actorUsername: userResult.recordset[0].username,
        relatedSubmissionId: submissionId,
        relatedCommentId: result.recordset[0].comment_id,
      });
    }

    const xp = await awardCommentXp(userId);

    invalidatePrefix(`submissions:overview:${submissionId}`);

    res.status(201).json({
      comment_id: result.recordset[0].comment_id,
      content: content.trim(),
      created_at: result.recordset[0].created_at,
      username: userResult.recordset[0].username,
      user_id: userId,
      xp_gained: xp,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const check = await pool
      .request()
      .input("commentId", sql.Int, Number(commentId))
      .input("userId", sql.Int, Number(userId))
      .query("SELECT user_id FROM Post_Comments WHERE comment_id = @commentId");

    if (check.recordset.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (check.recordset[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    await pool
      .request()
      .input("commentId", sql.Int, Number(commentId))
      .query(
        "UPDATE Notifications SET related_comment_id = NULL WHERE related_comment_id = @commentId",
      );

    await pool
      .request()
      .input("commentId", sql.Int, Number(commentId))
      .query("DELETE FROM Post_Comments WHERE comment_id = @commentId");

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

export const getLikes = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId)).query(`
        SELECT COUNT(*) as like_count FROM Post_Likes WHERE submission_id = @submissionId
      `);

    res.json({ like_count: result.recordset[0].like_count });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
};

export const getUserLike = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.userId || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const result = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId)).query(`
        SELECT like_id FROM Post_Likes 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);

    res.json({ isLiked: result.recordset.length > 0 });
  } catch (error) {
    console.error("Error checking user like:", error);
    res.status(500).json({ error: "Failed to check like status" });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.userId || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const existing = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId)).query(`
        SELECT like_id FROM Post_Likes 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);

    if (existing.recordset.length > 0) {
      await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId)).query(`
          DELETE FROM Post_Likes 
          WHERE submission_id = @submissionId AND user_id = @userId
        `);

      const countResult = await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query(
          "SELECT COUNT(*) as like_count FROM Post_Likes WHERE submission_id = @submissionId",
        );

      invalidatePrefix(`submissions:overview:${submissionId}`);

      res.json({
        isLiked: false,
        like_count: countResult.recordset[0].like_count,
      });
    } else {
      await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId)).query(`
          INSERT INTO Post_Likes (submission_id, user_id) VALUES (@submissionId, @userId)
        `);

      const countResult = await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query(
          "SELECT COUNT(*) as like_count FROM Post_Likes WHERE submission_id = @submissionId",
        );

      const likerResult = await pool
        .request()
        .input("userId", sql.Int, Number(userId))
        .query("SELECT username FROM Users WHERE user_id = @userId");

      const postOwnerId = await getPostOwnerId(submissionId);

      if (postOwnerId && postOwnerId !== userId) {
        await createNotification({
          userId: postOwnerId,
          type: "like",
          message: `liked your analysis`,
          actorUsername: likerResult.recordset[0].username,
          relatedSubmissionId: submissionId,
        });
      }

      await awardLikeXp(userId, postOwnerId);

      invalidatePrefix(`submissions:overview:${submissionId}`);

      res.json({
        isLiked: true,
        like_count: countResult.recordset[0].like_count,
        xp_gained: 1,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};

export const getShares = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId)).query(`
        SELECT COUNT(*) as share_count FROM Post_Shares WHERE submission_id = @submissionId
      `);

    res.json({ share_count: result.recordset[0].share_count });
  } catch (error) {
    console.error("Error fetching shares:", error);
    res.status(500).json({ error: "Failed to fetch shares" });
  }
};

export const toggleShare = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.userId || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const existing = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId)).query(`
        SELECT share_id FROM Post_Shares 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);

    if (existing.recordset.length > 0) {
      await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId)).query(`
          DELETE FROM Post_Shares 
          WHERE submission_id = @submissionId AND user_id = @userId
        `);

      const countResult = await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query(
          "SELECT COUNT(*) as share_count FROM Post_Shares WHERE submission_id = @submissionId",
        );

      invalidatePrefix(`submissions:overview:${submissionId}`);

      res.json({
        isShared: false,
        share_count: countResult.recordset[0].share_count,
      });
    } else {
      await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId)).query(`
          INSERT INTO Post_Shares (submission_id, user_id) VALUES (@submissionId, @userId)
        `);

      const countResult = await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query(
          "SELECT COUNT(*) as share_count FROM Post_Shares WHERE submission_id = @submissionId",
        );

      invalidatePrefix(`submissions:overview:${submissionId}`);

      res.json({
        isShared: true,
        share_count: countResult.recordset[0].share_count,
      });
    }
  } catch (error) {
    console.error("Error toggling share:", error);
    res.status(500).json({ error: "Failed to toggle share" });
  }
};

export const getSaves = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId)).query(`
        SELECT COUNT(*) as save_count FROM Post_Saves WHERE submission_id = @submissionId
      `);

    res.json({ save_count: result.recordset[0].save_count });
  } catch (error) {
    console.error("Error fetching saves:", error);
    res.status(500).json({ error: "Failed to fetch saves" });
  }
};

export const getUserSave = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.userId || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const result = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId)).query(`
        SELECT save_id FROM Post_Saves 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);

    res.json({ isSaved: result.recordset.length > 0 });
  } catch (error) {
    console.error("Error checking user save:", error);
    res.status(500).json({ error: "Failed to check save status" });
  }
};

export const toggleSave = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.userId || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const existing = await pool
      .request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId)).query(`
        SELECT save_id FROM Post_Saves 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);

    if (existing.recordset.length > 0) {
      await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId)).query(`
          DELETE FROM Post_Saves 
          WHERE submission_id = @submissionId AND user_id = @userId
        `);

      invalidatePrefix(`submissions:overview:${submissionId}`);
      res.json({ isSaved: false });
    } else {
      await pool
        .request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId)).query(`
          INSERT INTO Post_Saves (submission_id, user_id) VALUES (@submissionId, @userId)
        `);

      invalidatePrefix(`submissions:overview:${submissionId}`);
      res.json({ isSaved: true });
    }
  } catch (error) {
    console.error("Error toggling save:", error);
    res.status(500).json({ error: "Failed to toggle save" });
  }
};
