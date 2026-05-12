import sql from "mssql";
import pool from "../config/db.js";
import { awardSubmissionXp } from "../services/reputationService.js";

async function fetchAllSubmissions() {
  try {
    const result = await pool.request().query(`
      SELECT TOP 50
        s.submission_id,
        s.author_id,
        s.title,
        LEFT(s.content, 200) AS content,
        s.status,
        s.submitted_at,
        u.username,
        u.role,
        a.sha256_hash,
        a.malware_family,
        a.malware_category,
        e.sandbox_status,
        ISNULL(lc.like_count, 0) AS like_count,
        ISNULL(cc.comment_count, 0) AS comment_count,
        ISNULL(sc.share_count, 0) AS share_count
      FROM Analysis_Submissions s
      INNER JOIN Users u ON u.user_id = s.author_id
      LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
      LEFT JOIN (
        SELECT submission_id, status AS sandbox_status,
               ROW_NUMBER() OVER(PARTITION BY submission_id ORDER BY queued_at DESC) AS rn
        FROM Sandbox_Executions
      ) e ON e.submission_id = s.submission_id AND e.rn = 1
      LEFT JOIN (SELECT submission_id, COUNT(*) AS like_count FROM Post_Likes GROUP BY submission_id) lc ON lc.submission_id = s.submission_id
      LEFT JOIN (SELECT submission_id, COUNT(*) AS comment_count FROM Post_Comments GROUP BY submission_id) cc ON cc.submission_id = s.submission_id
      LEFT JOIN (SELECT submission_id, COUNT(*) AS share_count FROM Post_Shares GROUP BY submission_id) sc ON sc.submission_id = s.submission_id
      WHERE s.status = 'Published'
      ORDER BY s.submitted_at DESC
    `);
    return result.recordset;
  } catch (err) {
    console.log("Failed to fetch Submissions: ", err);
    return [];
  }
}

async function fetchUserSubmissions(userId, top) {
  try {
    const result = await pool.request().input("user_id", sql.INT, userId)
      .query(`
        SELECT${top ? ` TOP ${top}` : ""}
          s.submission_id,
          s.author_id,
          s.artifact_id,
          s.title,
          s.status,
          s.version,
          s.template_type,
          s.submitted_at,
          s.updated_at,
          a.file_name,
          a.sha256_hash,
          a.malware_family,
          a.malware_category,
          ai.ai_score_percentage,
          ai.threat_level AS ai_threat_level,
          e.execution_id,
          e.sandbox_status,
          e.finished_at AS sandbox_finished_at
        FROM Analysis_Submissions s
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        LEFT JOIN (
          SELECT evaluation_id, submission_id, ai_score_percentage, threat_level,
                 ROW_NUMBER() OVER(PARTITION BY submission_id ORDER BY evaluation_date DESC) AS rn
          FROM AI_Evaluations
        ) ai ON ai.submission_id = s.submission_id AND ai.rn = 1
        LEFT JOIN (
          SELECT se.submission_id, se.execution_id, se.status AS sandbox_status, se.finished_at,
                 ROW_NUMBER() OVER(PARTITION BY se.submission_id ORDER BY se.queued_at DESC) AS rn
          FROM Sandbox_Executions se
        ) e ON e.submission_id = s.submission_id AND e.rn = 1
        WHERE s.author_id = @user_id
        ORDER BY s.updated_at DESC
      `);
    return result.recordset;
  } catch (err) {
    console.log("Failed to fetch user submissions: ", err);
    return [];
  }
}

async function fetchUserStats(userId) {
  try {
    const result = await pool.request().input("user_id", sql.INT, userId)
      .query(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'Published' THEN 1 END) AS completed,
          COUNT(CASE WHEN status IN ('Draft', 'Pending', 'Archived') THEN 1 END) AS pending
        FROM Analysis_Submissions
        WHERE author_id = @user_id AND status <> 'Archived'
      `);

    const row = result.recordset[0];
    return {
      total_submissions: row?.total || 0,
      published_submissions: row?.completed || 0,
      pending_submissions: row?.pending || 0,
    };
  } catch (err) {
    console.log("Failed to fetch user stats: ", err);
    return {
      total_submissions: 0,
      published_submissions: 0,
      pending_submissions: 0,
    };
  }
}

export const getAllSubmissions = async (req, res) => {
  try {
    console.log(
      "getAllSubmissions called, user:",
      req.user?.userId || "unknown",
    );
    const data = await fetchAllSubmissions();
    console.log("All submissions fetched:", data.length, "items");
    res.json(data);
  } catch (err) {
    console.error("Failed to get Submissions:", err.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
};

export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const top =
      Math.min(Math.max(parseInt(req.query.limit) || 0, 0), 100) || undefined;
    const data = await fetchUserSubmissions(userId, top);
    console.log(`Submissions fetched for user ${userId}:`, data.length);
    res.json(data);
  } catch (err) {
    console.log("Failed to get user Submissions: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stats = await fetchUserStats(userId);
    res.json(stats);
  } catch (err) {
    console.log("Failed to get user stats: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserDrafts = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.request().input("user_id", sql.INT, userId)
      .query(`
        SELECT
          s.submission_id,
          s.author_id,
          s.artifact_id,
          s.title,
          s.content,
          s.status,
          s.version,
          s.template_type,
          s.submitted_at,
          s.updated_at,
          a.file_name,
          a.sha256_hash,
          a.malware_family,
          a.malware_category
        FROM Analysis_Submissions s
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        WHERE s.author_id = @user_id
          AND s.status = 'Draft'
        ORDER BY s.updated_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.log("Failed to get user drafts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSubmissionByIdPublic = async (req, res) => {
  try {
    const submissionId = Number(req.params.id);

    const result = await pool
      .request()
      .input("submission_id", sql.INT, submissionId).query(`
        SELECT
          s.submission_id,
          s.author_id,
          s.artifact_id,
          s.title,
          s.content,
          s.status,
          s.version,
          s.template_type,
          s.submitted_at,
          s.updated_at,
          u.username,
          u.role,
          u.reputation_score
        FROM Analysis_Submissions s
        INNER JOIN Users u ON u.user_id = s.author_id
        WHERE s.submission_id = @submission_id
      `);

    const submission = result.recordset[0];
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json(submission);
  } catch (err) {
    console.log("Failed to get submission:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Alias for backwards compatibility - uses protect middleware in routes
export const getSubmissionById = getSubmissionByIdPublic;

export const getSubmissionArtifact = async (req, res) => {
  try {
    const submissionId = Number(req.params.id);

    const [artifactResult, logsResult] = await Promise.all([
      pool.request().input("submission_id", sql.INT, submissionId).query(`
        SELECT
          a.file_name, a.file_size, a.file_type, a.md5_hash, a.sha256_hash,
          a.storage_path, a.is_quarantined, a.malware_family, a.malware_category, a.upload_time,
          e.execution_id, e.status AS sandbox_status, e.environment, e.os_profile,
          e.network_enabled, e.timeout_seconds, e.queued_at, e.started_at, e.finished_at, e.error_message
        FROM Analysis_Submissions s
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        LEFT JOIN (
          SELECT se.submission_id, se.execution_id, se.status, se.environment,
                 se.os_profile, se.network_enabled, se.timeout_seconds,
                 se.queued_at, se.started_at, se.finished_at, se.error_message,
                 ROW_NUMBER() OVER(PARTITION BY se.submission_id ORDER BY se.queued_at DESC) AS rn
          FROM Sandbox_Executions se
        ) e ON e.submission_id = s.submission_id AND e.rn = 1
        WHERE s.submission_id = @submission_id
      `),
      pool.request().input("submission_id", sql.INT, submissionId).query(`
        SELECT l.log_id, l.log_type, l.log_data, l.captured_at
        FROM Sandbox_Executions e
        INNER JOIN Behavioral_Logs l ON l.execution_id = e.execution_id
        WHERE e.submission_id = @submission_id
        ORDER BY l.captured_at ASC
      `),
    ]);

    res.json({
      ...(artifactResult.recordset[0] || {}),
      behavioral_logs: logsResult.recordset || [],
    });
  } catch (err) {
    console.log("Failed to get submission artifact:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPostOverview = async (req, res) => {
  try {
    const submissionId = Number(req.params.id);
    const userId = req.user?.userId || req.user?.user_id;
    const isAuthenticated = !!userId;

    const [
      submissionResult,
      logsResult,
      likesResult,
      sharesResult,
      commentsResult,
      reviewsResult,
      aggResult,
      userLikeResult,
      userSaveResult,
      userReviewResult,
    ] = await Promise.all([
      pool.request().input("submission_id", sql.INT, submissionId).query(`
        SELECT
          s.submission_id, s.author_id, s.artifact_id, s.title, s.content,
          s.status, s.version, s.template_type, s.submitted_at, s.updated_at,
          u.username, u.role, u.reputation_score,
          a.file_name, a.file_size, a.file_type, a.md5_hash, a.sha256_hash,
          a.storage_path, a.is_quarantined, a.malware_family, a.malware_category, a.upload_time,
          e.execution_id, e.status AS sandbox_status, e.environment, e.os_profile,
          e.network_enabled, e.timeout_seconds, e.queued_at, e.started_at, e.finished_at, e.error_message
        FROM Analysis_Submissions s
        INNER JOIN Users u ON u.user_id = s.author_id
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        LEFT JOIN (
          SELECT se.submission_id, se.execution_id, se.status, se.environment,
                 se.os_profile, se.network_enabled, se.timeout_seconds,
                 se.queued_at, se.started_at, se.finished_at, se.error_message,
                 ROW_NUMBER() OVER(PARTITION BY se.submission_id ORDER BY se.queued_at DESC) AS rn
          FROM Sandbox_Executions se
        ) e ON e.submission_id = s.submission_id AND e.rn = 1
        WHERE s.submission_id = @submission_id
      `),
      pool.request().input("submission_id", sql.INT, submissionId).query(`
        SELECT l.log_id, l.log_type, l.log_data, l.captured_at
        FROM Sandbox_Executions e
        INNER JOIN Behavioral_Logs l ON l.execution_id = e.execution_id
        WHERE e.submission_id = @submission_id
        ORDER BY l.captured_at ASC
      `),
      pool.request().input("submissionId", sql.INT, submissionId).query(`
        SELECT COUNT(*) as like_count FROM Post_Likes WHERE submission_id = @submissionId
      `),
      pool.request().input("submissionId", sql.INT, submissionId).query(`
        SELECT COUNT(*) as share_count FROM Post_Shares WHERE submission_id = @submissionId
      `),
      pool.request().input("submissionId", sql.INT, submissionId).query(`
        SELECT pc.comment_id, pc.content, pc.created_at, u.username, u.user_id, u.role
        FROM Post_Comments pc
        JOIN Users u ON pc.user_id = u.user_id
        WHERE pc.submission_id = @submissionId
        ORDER BY pc.created_at DESC
      `),
      pool.request().input("submissionId", sql.INT, submissionId).query(`
        SELECT pr.review_id, pr.technical_score, pr.methodology_score, pr.documentation_score,
               pr.insights_score, pr.comments, pr.status, pr.reviewed_at,
               u.user_id AS reviewer_id, u.username AS reviewer_username,
               u.role AS reviewer_role, u.expertise_level AS reviewer_expertise
        FROM Peer_Reviews pr
        JOIN Users u ON pr.reviewer_id = u.user_id
        WHERE pr.submission_id = @submissionId
        ORDER BY pr.reviewed_at DESC
      `),
      pool.request().input("submissionId", sql.INT, submissionId).query(`
        SELECT
          COUNT(*) AS review_count,
          AVG(CAST(technical_score AS DECIMAL(5,2))) AS avg_technical,
          AVG(CAST(methodology_score AS DECIMAL(5,2))) AS avg_methodology,
          AVG(CAST(documentation_score AS DECIMAL(5,2))) AS avg_documentation,
          AVG(CAST(insights_score AS DECIMAL(5,2))) AS avg_insights,
          AVG(CAST(technical_score + methodology_score + documentation_score + insights_score AS DECIMAL(5,2))) / 4 AS avg_overall
        FROM Peer_Reviews
        WHERE submission_id = @submissionId
      `),
      isAuthenticated
        ? pool
            .request()
            .input("submissionId", sql.INT, submissionId)
            .input("userId", sql.INT, userId).query(`
            SELECT like_id FROM Post_Likes WHERE submission_id = @submissionId AND user_id = @userId
          `)
        : { recordset: [] },
      isAuthenticated
        ? pool
            .request()
            .input("submissionId", sql.INT, submissionId)
            .input("userId", sql.INT, userId).query(`
            SELECT save_id FROM Post_Saves WHERE submission_id = @submissionId AND user_id = @userId
          `)
        : { recordset: [] },
      isAuthenticated
        ? pool
            .request()
            .input("submissionId", sql.INT, submissionId)
            .input("userId", sql.INT, userId).query(`
            SELECT pr.review_id, pr.technical_score, pr.methodology_score, pr.documentation_score,
                   pr.insights_score, pr.comments, pr.status, pr.reviewed_at
            FROM Peer_Reviews pr
            WHERE pr.submission_id = @submissionId AND pr.reviewer_id = @userId
          `)
        : { recordset: [] },
    ]);

    const submission = submissionResult.recordset[0];
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const aggRow = aggResult.recordset[0];

    res.json({
      ...submission,
      behavioral_logs: logsResult.recordset || [],
      like_count: likesResult.recordset[0]?.like_count || 0,
      share_count: sharesResult.recordset[0]?.share_count || 0,
      isLiked: userLikeResult.recordset.length > 0,
      isSaved: userSaveResult.recordset.length > 0,
      comments: commentsResult.recordset || [],
      reviews: reviewsResult.recordset || [],
      userReview: userReviewResult.recordset[0] || null,
      hasReviewed: userReviewResult.recordset.length > 0,
      aggregate:
        aggRow?.review_count > 0
          ? {
              reviewCount: aggRow.review_count,
              averageScores: {
                overall: Math.round(aggRow.avg_overall * 10) / 10,
                technical: Math.round(aggRow.avg_technical * 10) / 10,
                methodology: Math.round(aggRow.avg_methodology * 10) / 10,
                documentation: Math.round(aggRow.avg_documentation * 10) / 10,
                insights: Math.round(aggRow.avg_insights * 10) / 10,
              },
            }
          : null,
    });
  } catch (err) {
    console.log("Failed to load post overview:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const submissionId = Number(req.params.id);
    const { title, content, status, artifact_id, version, template_type } =
      req.body;

    if (!userId || !submissionId) {
      return res.status(400).json({ error: "Submission id is required" });
    }

    const normalizedStatus =
      status &&
      ["Draft", "Pending", "Published", "Rejected", "Archived"].includes(status)
        ? status
        : null;

    if (status && !normalizedStatus) {
      return res.status(400).json({ error: "Invalid submission status" });
    }

    const isAdminOrMod = ["Administrator", "Moderator"].includes(userRole);
    const authorFilter = isAdminOrMod ? "" : "AND author_id = @user_id";

    const query = `
      UPDATE Analysis_Submissions
      SET title = COALESCE(@title, title),
          content = COALESCE(@content, content),
          status = COALESCE(@status, status),
          artifact_id = COALESCE(@artifact_id, artifact_id),
          version = COALESCE(@version, version),
          template_type = COALESCE(@template_type, template_type),
          updated_at = GETDATE()
      OUTPUT INSERTED.submission_id, INSERTED.status
      WHERE submission_id = @submission_id
        ${authorFilter}
    `;

    const result = await pool
      .request()
      .input("submission_id", sql.INT, submissionId)
      .input("user_id", sql.INT, userId)
      .input("title", sql.NVARCHAR(255), title ?? null)
      .input("content", sql.NVARCHAR(sql.MAX), content ?? null)
      .input("status", sql.NVARCHAR(20), normalizedStatus)
      .input("artifact_id", sql.INT, artifact_id ?? null)
      .input("version", sql.INT, version ?? null)
      .input("template_type", sql.NVARCHAR(50), template_type ?? null)
      .query(query);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({
      message: "Submission updated",
      submission: result.recordset[0],
    });
  } catch (err) {
    console.log("Failed to update submission:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const importSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const submissionId = Number(req.params.id);

    if (!userId || !submissionId) {
      return res.status(400).json({ error: "Submission id is required" });
    }

    // Get original submission
    const original = await pool
      .request()
      .input("submission_id", sql.INT, submissionId).query(`
        SELECT title, content, artifact_id, template_type
        FROM Analysis_Submissions
        WHERE submission_id = @submission_id
      `);

    if (!original.recordset[0]) {
      return res.status(404).json({ error: "Original submission not found" });
    }

    const { title, content, artifact_id, template_type } =
      original.recordset[0];

    // Create new submission for current user
    const result = await pool
      .request()
      .input("author_id", sql.INT, userId)
      .input("artifact_id", sql.INT, artifact_id || null)
      .input("title", sql.NVARCHAR(255), `Imported: ${title}`)
      .input("content", sql.NVARCHAR(sql.MAX), content)
      .input("status", sql.NVARCHAR(20), "Draft")
      .input("version", sql.INT, 1)
      .input("template_type", sql.NVARCHAR(50), template_type).query(`
        INSERT INTO Analysis_Submissions(author_id, artifact_id, title, content, status, version, template_type)
        OUTPUT INSERTED.submission_id
        VALUES (@author_id, @artifact_id, @title, @content, @status, @version, @template_type)
      `);

    res.status(201).json({
      message: "Submission imported successfully",
      submission_id: result.recordset[0].submission_id,
    });
  } catch (err) {
    console.log("Failed to import submission:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const submissionId = Number(req.params.id);

    if (!userId || !submissionId) {
      return res.status(400).json({ error: "Submission id is required" });
    }

    const result = await pool
      .request()
      .input("submission_id", sql.INT, submissionId)
      .input("user_id", sql.INT, userId).query(`
        UPDATE Analysis_Submissions
        SET status = 'Archived', updated_at = GETDATE()
        OUTPUT INSERTED.submission_id, INSERTED.status
        WHERE submission_id = @submission_id
          AND author_id = @user_id
          AND status <> 'Archived'
      `);

    if (!result.recordset[0]) {
      return res
        .status(404)
        .json({ error: "Submission not found or already archived" });
    }

    res.json({
      message: "Submission archived",
      submission: result.recordset[0],
    });
  } catch (err) {
    console.log("Failed to delete submission:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserSavedSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.request().input("user_id", sql.INT, userId)
      .query(`
        SELECT
          s.submission_id,
          s.author_id,
          s.artifact_id,
          s.title,
          s.content,
          s.status,
          s.version,
          s.template_type,
          s.submitted_at,
          s.updated_at,
          u.username,
          u.role,
          a.file_name,
          a.sha256_hash,
          a.malware_family,
          a.malware_category,
          ai.ai_score_percentage,
          ai.threat_level AS ai_threat_level,
          e.execution_id,
          e.sandbox_status,
          e.finished_at AS sandbox_finished_at,
          ISNULL(lc.like_count, 0) AS like_count,
          ISNULL(cc.comment_count, 0) AS comment_count,
          ISNULL(sc.share_count, 0) AS share_count
        FROM Analysis_Submissions s
        INNER JOIN Post_Saves ps ON ps.submission_id = s.submission_id
        INNER JOIN Users u ON u.user_id = s.author_id
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        LEFT JOIN (
          SELECT evaluation_id, submission_id, ai_score_percentage, threat_level,
                 ROW_NUMBER() OVER(PARTITION BY submission_id ORDER BY evaluation_date DESC) AS rn
          FROM AI_Evaluations
        ) ai ON ai.submission_id = s.submission_id AND ai.rn = 1
        LEFT JOIN (
          SELECT se.submission_id, se.execution_id, se.status AS sandbox_status, se.finished_at,
                 ROW_NUMBER() OVER(PARTITION BY se.submission_id ORDER BY se.queued_at DESC) AS rn
          FROM Sandbox_Executions se
        ) e ON e.submission_id = s.submission_id AND e.rn = 1
        LEFT JOIN (SELECT submission_id, COUNT(*) AS like_count FROM Post_Likes GROUP BY submission_id) lc ON lc.submission_id = s.submission_id
        LEFT JOIN (SELECT submission_id, COUNT(*) AS comment_count FROM Post_Comments GROUP BY submission_id) cc ON cc.submission_id = s.submission_id
        LEFT JOIN (SELECT submission_id, COUNT(*) AS share_count FROM Post_Shares GROUP BY submission_id) sc ON sc.submission_id = s.submission_id
        WHERE ps.user_id = @user_id
        ORDER BY ps.created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.log("Failed to get user saved submissions: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const postSubmission = async (req, res) => {
  try {
    const authorId = req.user.userId;
    const userRole = req.user.role;
    const {
      artifact_id,
      title,
      content,
      status = "Draft",
      version = 1,
      template_type = "MALWARE_ANALYSIS",
    } = req.body;

    if (!authorId || !title || !content) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    let finalStatus;
    if (userRole === "Administrator" || userRole === "Moderator") {
      finalStatus = [
        "Draft",
        "Pending",
        "Published",
        "Rejected",
        "Archived",
      ].includes(status)
        ? status
        : "Draft";
    } else {
      finalStatus = ["Draft", "Pending"].includes(status)
        ? status === "Pending"
          ? "Pending"
          : "Draft"
        : "Pending";
    }

    try {
      const result = await pool
        .request()
        .input("author_id", sql.INT, authorId)
        .input("artifact_id", sql.INT, artifact_id || null)
        .input("title", sql.NVARCHAR(255), title)
        .input("content", sql.NVARCHAR(sql.MAX), content)
        .input("status", sql.NVARCHAR(20), finalStatus)
        .input("version", sql.INT, Number(version) || 1)
        .input("template_type", sql.NVARCHAR(50), template_type).query(`
          INSERT INTO Analysis_Submissions(author_id, artifact_id, title, content, status, version, template_type)
          OUTPUT INSERTED.submission_id, INSERTED.status
          VALUES (@author_id, @artifact_id, @title, @content, @status, @version, @template_type)
        `);

      const xpGain = await awardSubmissionXp(authorId, finalStatus);

      res.status(201).json({
        message: "Submission Created",
        submission_id: result.recordset[0].submission_id,
        status: result.recordset[0].status,
        xp_gained: xpGain,
      });
    } catch (dbErr) {
      console.error("Failed to post submission: ", dbErr);
      res.status(500).json({ error: "DB constraint violated" });
    }
  } catch (err) {
    console.log("Failed to post submission:", err);
    res.status(400).json({ error: "Bad Request" });
  }
};
