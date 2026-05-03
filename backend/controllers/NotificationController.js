import sql from "mssql";
import pool from "../config/db.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.user_id;
    console.log(`[Notification] Fetching notifications for user=${userId}`);

    const result = await pool.request()
      .input("userId", sql.Int, Number(userId))
      .query(`
        SELECT 
          notification_id,
          user_id,
          type,
          message,
          actor_username,
          related_submission_id,
          related_comment_id,
          created_at,
          is_read
        FROM Notifications
        WHERE user_id = @userId
        ORDER BY created_at DESC
        OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
      `);

    const unreadResult = await pool.request()
      .input("userId", sql.Int, Number(userId))
      .query(`
        SELECT COUNT(*) as unread_count FROM Notifications 
        WHERE user_id = @userId AND is_read = 0
      `);

    console.log(`[Notification] Found ${result.recordset.length} notifications, ${unreadResult.recordset[0].unread_count} unread`);
    res.json({
      notifications: result.recordset,
      unreadCount: unreadResult.recordset[0].unread_count,
    });
  } catch (error) {
    console.error("[Notification] Error fetching notifications:", error.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId || req.user.user_id;

    await pool.request()
      .input("notificationId", sql.Int, Number(notificationId))
      .input("userId", sql.Int, Number(userId))
      .query(`
        UPDATE Notifications SET is_read = 1 
        WHERE notification_id = @notificationId AND user_id = @userId
      `);

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("[Notification] Error marking notification as read:", error.message);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.user_id;

    await pool.request()
      .input("userId", sql.Int, Number(userId))
      .query(`
        UPDATE Notifications SET is_read = 1 
        WHERE user_id = @userId AND is_read = 0
      `);

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("[Notification] Error marking all notifications as read:", error.message);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { userId, type, message, actorUsername, relatedSubmissionId, relatedCommentId } = req.body;

    const result = await pool.request()
      .input("userId", sql.Int, Number(userId))
      .input("type", sql.NVarChar(50), type)
      .input("message", sql.NVarChar(500), message)
      .input("actorUsername", sql.NVarChar(100), actorUsername)
      .input("relatedSubmissionId", sql.Int, relatedSubmissionId ? Number(relatedSubmissionId) : null)
      .input("relatedCommentId", sql.Int, relatedCommentId ? Number(relatedCommentId) : null)
      .query(`
        INSERT INTO Notifications (user_id, type, message, actor_username, related_submission_id, related_comment_id, is_read)
        OUTPUT INSERTED.notification_id, INSERTED.created_at
        VALUES (@userId, @type, @message, @actorUsername, @relatedSubmissionId, @relatedCommentId, 0)
      `);

    res.status(201).json({
      notification_id: result.recordset[0].notification_id,
      created_at: result.recordset[0].created_at,
    });
  } catch (error) {
    console.error("[Notification] Error creating notification:", error.message);
    res.status(500).json({ error: "Failed to create notification" });
  }
};
