import sql from "mssql";
import pool from "../config/db.js";

const createNotification = async ({ userId, type, message, actorUsername, relatedSubmissionId, relatedCommentId }) => {
  try {
    console.log(`[Notification] Creating: user=${userId}, type=${type}, actor=${actorUsername}, submission=${relatedSubmissionId}`);
    const result = await pool.request()
      .input("userId", sql.Int, Number(userId))
      .input("type", sql.NVarChar(50), type)
      .input("message", sql.NVarChar(500), message)
      .input("actorUsername", sql.NVarChar(100), actorUsername)
      .input("relatedSubmissionId", sql.Int, relatedSubmissionId ? Number(relatedSubmissionId) : null)
      .input("relatedCommentId", sql.Int, relatedCommentId ? Number(relatedCommentId) : null)
      .query(`
        INSERT INTO Notifications (user_id, type, message, actor_username, related_submission_id, related_comment_id, is_read)
        OUTPUT INSERTED.notification_id
        VALUES (@userId, @type, @message, @actorUsername, @relatedSubmissionId, @relatedCommentId, 0)
      `);
    console.log(`[Notification] Created notification_id=${result.recordset[0].notification_id}`);
  } catch (error) {
    console.error("[Notification] Error creating notification:", error.message);
    console.error("[Notification] SQL details:", error);
  }
};

const getPostOwnerId = async (submissionId) => {
  const result = await pool.request()
    .input("submissionId", sql.Int, Number(submissionId))
    .query("SELECT author_id FROM Analysis_Submissions WHERE submission_id = @submissionId");
  return result.recordset[0]?.author_id;
};

export const getComments = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .query(`
        SELECT 
          pc.comment_id,
          pc.content,
          pc.created_at,
          u.username,
          u.user_id
        FROM Post_Comments pc
        JOIN Users u ON pc.user_id = u.user_id
        WHERE pc.submission_id = @submissionId
        ORDER BY pc.created_at DESC
      `);
    
    res.json(result.recordset);
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
    
    console.log(`[Comment] Adding comment: user=${userId}, submission=${submissionId}`);
    
    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }
    
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId))
      .input("content", sql.NVarChar(sql.MAX), content.trim())
      .query(`
        INSERT INTO Post_Comments (submission_id, user_id, content)
        OUTPUT INSERTED.comment_id, INSERTED.created_at
        VALUES (@submissionId, @userId, @content)
      `);
    
    const userResult = await pool.request()
      .input("userId", sql.Int, Number(userId))
      .query("SELECT username FROM Users WHERE user_id = @userId");
    
    const postOwnerId = await getPostOwnerId(submissionId);
    console.log(`[Comment] Post owner=${postOwnerId}, commenter=${userId}, same=${postOwnerId === userId}`);
    
    res.status(201).json({
      comment_id: result.recordset[0].comment_id,
      content: content.trim(),
      created_at: result.recordset[0].created_at,
      username: userResult.recordset[0].username,
      user_id: userId
    });

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
    
    const check = await pool.request()
      .input("commentId", sql.Int, Number(commentId))
      .input("userId", sql.Int, Number(userId))
      .query("SELECT user_id FROM Post_Comments WHERE comment_id = @commentId");
    
    if (check.recordset.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    if (check.recordset[0].user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }
    
    await pool.request()
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
    
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .query(`
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
    
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId))
      .query(`
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
    
    console.log(`[Like] Toggling like: user=${userId}, submission=${submissionId}`);
    
    if (!userId) {
      return res.status(401).json({ error: "Not authorized" });
    }
    
    const existing = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId))
      .query(`
        SELECT like_id FROM Post_Likes 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);
    
    if (existing.recordset.length > 0) {
      await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId))
        .query(`
          DELETE FROM Post_Likes 
          WHERE submission_id = @submissionId AND user_id = @userId
        `);
      
      const countResult = await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query("SELECT COUNT(*) as like_count FROM Post_Likes WHERE submission_id = @submissionId");
      
      res.json({ isLiked: false, like_count: countResult.recordset[0].like_count });
    } else {
      await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId))
        .query(`
          INSERT INTO Post_Likes (submission_id, user_id) VALUES (@submissionId, @userId)
        `);
      
      const countResult = await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query("SELECT COUNT(*) as like_count FROM Post_Likes WHERE submission_id = @submissionId");
      
      const likerResult = await pool.request()
        .input("userId", sql.Int, Number(userId))
        .query("SELECT username FROM Users WHERE user_id = @userId");

      const postOwnerId = await getPostOwnerId(submissionId);
      console.log(`[Like] Post owner=${postOwnerId}, liker=${userId}, same=${postOwnerId === userId}`);
      
      if (postOwnerId && postOwnerId !== userId) {
        await createNotification({
          userId: postOwnerId,
          type: "like",
          message: `liked your analysis`,
          actorUsername: likerResult.recordset[0].username,
          relatedSubmissionId: submissionId,
        });
      }
      
      res.json({ isLiked: true, like_count: countResult.recordset[0].like_count });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};

export const getShares = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .query(`
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
    
    const existing = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId))
      .query(`
        SELECT share_id FROM Post_Shares 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);
    
    if (existing.recordset.length > 0) {
      await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId))
        .query(`
          DELETE FROM Post_Shares 
          WHERE submission_id = @submissionId AND user_id = @userId
        `);
      
      const countResult = await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query("SELECT COUNT(*) as share_count FROM Post_Shares WHERE submission_id = @submissionId");
      
      res.json({ isShared: false, share_count: countResult.recordset[0].share_count });
    } else {
      await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId))
        .query(`
          INSERT INTO Post_Shares (submission_id, user_id) VALUES (@submissionId, @userId)
        `);
      
      const countResult = await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .query("SELECT COUNT(*) as share_count FROM Post_Shares WHERE submission_id = @submissionId");
      
      res.json({ isShared: true, share_count: countResult.recordset[0].share_count });
    }
  } catch (error) {
    console.error("Error toggling share:", error);
    res.status(500).json({ error: "Failed to toggle share" });
  }
};

export const getSaves = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .query(`
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
    
    const result = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId))
      .query(`
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
    
    const existing = await pool.request()
      .input("submissionId", sql.Int, Number(submissionId))
      .input("userId", sql.Int, Number(userId))
      .query(`
        SELECT save_id FROM Post_Saves 
        WHERE submission_id = @submissionId AND user_id = @userId
      `);
    
    if (existing.recordset.length > 0) {
      await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId))
        .query(`
          DELETE FROM Post_Saves 
          WHERE submission_id = @submissionId AND user_id = @userId
        `);
      
      res.json({ isSaved: false });
    } else {
      await pool.request()
        .input("submissionId", sql.Int, Number(submissionId))
        .input("userId", sql.Int, Number(userId))
        .query(`
          INSERT INTO Post_Saves (submission_id, user_id) VALUES (@submissionId, @userId)
        `);
      
      res.json({ isSaved: true });
    }
  } catch (error) {
    console.error("Error toggling save:", error);
    res.status(500).json({ error: "Failed to toggle save" });
  }
};
