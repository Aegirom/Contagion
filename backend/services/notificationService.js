import sql from "mssql";
import pool from "../config/db.js";
import { del as cacheDel } from "./cacheService.js";

export const createNotification = async ({
  userId,
  type,
  message,
  actorUsername,
  relatedSubmissionId,
  relatedCommentId,
  relatedReviewId,
}) => {
  try {
    cacheDel(`notifications:${userId}`);
    console.log(
      `[Notification] Creating: user=${userId}, type=${type}, actor=${actorUsername}, submission=${relatedSubmissionId}`,
    );

    const fields = [];
    const request = pool.request();

    request.input("userId", sql.Int, Number(userId));
    request.input("type", sql.NVarChar(50), type);
    request.input("message", sql.NVarChar(500), message);
    request.input("actorUsername", sql.NVarChar(100), actorUsername);
    request.input(
      "relatedSubmissionId",
      sql.Int,
      relatedSubmissionId ? Number(relatedSubmissionId) : null,
    );

    fields.push(
      "user_id",
      "type",
      "message",
      "actor_username",
      "related_submission_id",
    );

    if (relatedCommentId != null) {
      request.input("relatedCommentId", sql.Int, Number(relatedCommentId));
      fields.push("related_comment_id");
    }
    if (relatedReviewId != null) {
      request.input("relatedReviewId", sql.Int, Number(relatedReviewId));
      fields.push("related_review_id");
    }

    const colNames = fields.join(", ");
    const paramNames = fields
      .map((f) => {
        if (f === "related_comment_id") return "@relatedCommentId";
        if (f === "related_review_id") return "@relatedReviewId";
        if (f === "related_submission_id") return "@relatedSubmissionId";
        if (f === "actor_username") return "@actorUsername";
        return `@${f}`;
      })
      .join(", ");

    const result = await request.query(`
      INSERT INTO Notifications (${colNames}, is_read)
      OUTPUT INSERTED.notification_id
      VALUES (${paramNames}, 0)
    `);

    console.log(
      `[Notification] Created notification_id=${result.recordset[0].notification_id}`,
    );
  } catch (error) {
    console.error("[Notification] Error creating notification:", error.message);
  }
};
