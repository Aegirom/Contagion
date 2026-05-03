import sql from 'mssql';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';

async function fetchAllSubmissions() {
  try {
    const result = await pool.request().query(`
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
        a.file_name,
        a.file_size,
        a.file_type,
        a.sha256_hash,
        a.malware_family,
        a.malware_category,
        latest.execution_id,
        latest.sandbox_status,
        latest.finished_at AS sandbox_finished_at,
        ISNULL(like_counts.like_count, 0) AS like_count,
        ISNULL(comment_counts.comment_count, 0) AS comment_count,
        ISNULL(share_counts.share_count, 0) AS share_count
      FROM Analysis_Submissions s
      INNER JOIN Users u ON u.user_id = s.author_id
      LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
      OUTER APPLY (
        SELECT TOP 1
          e.execution_id,
          e.status AS sandbox_status,
          e.finished_at
        FROM Sandbox_Executions e
        WHERE e.submission_id = s.submission_id
        ORDER BY e.queued_at DESC
      ) latest
      OUTER APPLY (
        SELECT COUNT(*) AS like_count
        FROM Post_Likes pl
        WHERE pl.submission_id = s.submission_id
      ) like_counts
      OUTER APPLY (
        SELECT COUNT(*) AS comment_count
        FROM Post_Comments pc
        WHERE pc.submission_id = s.submission_id
      ) comment_counts
      OUTER APPLY (
        SELECT COUNT(*) AS share_count
        FROM Post_Shares ps
        WHERE ps.submission_id = s.submission_id
      ) share_counts
      WHERE s.status <> 'Archived'
      ORDER BY s.updated_at DESC
    `);
    return result.recordset;
  }
  catch (err) {
    console.log("Failed to fetch Submissions: ", err);
    return [];
  }
}

async function fetchUserSubmissions(userId) {
  try {
    const result = await pool.request()
      .input('user_id', sql.INT, userId)
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
          a.file_size,
          a.file_type,
          a.md5_hash,
          a.sha256_hash,
          a.malware_family,
          a.malware_category,
          latest.execution_id,
          latest.sandbox_status,
          latest.finished_at AS sandbox_finished_at
        FROM Analysis_Submissions s
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        OUTER APPLY (
          SELECT TOP 1
            e.execution_id,
            e.status AS sandbox_status,
            e.finished_at
          FROM Sandbox_Executions e
          WHERE e.submission_id = s.submission_id
          ORDER BY e.queued_at DESC
        ) latest
        WHERE s.author_id = @user_id
          AND s.status <> 'Archived'
        ORDER BY s.updated_at DESC
      `);
    return result.recordset;
  }
  catch (err) {
    console.log("Failed to fetch user submissions: ", err);
    return [];
  }
}

async function fetchUserStats(userId) {
  try {
    // Get total submissions count
    const totalResult = await pool.query`SELECT COUNT(*) AS total FROM Analysis_Submissions WHERE author_id = ${userId} AND status <> 'Archived'`;

    // Get completed submissions count
    const completedResult = await pool.query`SELECT COUNT(*) AS completed FROM Analysis_Submissions WHERE author_id = ${userId} AND status = 'Published'`;

    // Get pending submissions count
    const pendingResult = await pool.query`SELECT COUNT(*) AS pending FROM Analysis_Submissions WHERE author_id = ${userId} AND status IN ('Draft', 'Pending')`;

    return {
      total_submissions: totalResult.recordset[0]?.total || 0,
      published_submissions: completedResult.recordset[0]?.completed || 0,
      pending_submissions: pendingResult.recordset[0]?.pending || 0
    };
  }
  catch (err) {
    console.log("Failed to fetch user stats: ", err);
    return { total_submissions: 0, published_submissions: 0, pending_submissions: 0 };
  }
}

export const getAllSubmissions = async (req, res) => {
  try {
    console.log("getAllSubmissions called, user:", req.user?.userId || "unknown");
    const data = await fetchAllSubmissions();
    console.log("All submissions fetched:", data.length, "items");
    res.json(data);
  }
  catch (err) {
    console.error("Failed to get Submissions:", err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}

export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = await fetchUserSubmissions(userId);
    console.log(`Submissions fetched for user ${userId}:`, data.length);
    res.json(data);
  }
  catch (err) {
    console.log("Failed to get user Submissions: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await fetchUserStats(userId);
    res.json(stats);
  }
  catch (err) {
    console.log("Failed to get user stats: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getUserDrafts = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.request()
      .input('user_id', sql.INT, userId)
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
  }
  catch (err) {
    console.log("Failed to get user drafts:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Middleware that optionally extracts user from token (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Silently ignore token errors, just don't set req.user
    }
  }

  next();
};

export const getSubmissionByIdPublic = async (req, res) => {
  try {
    const submissionId = Number(req.params.id);

    // Build query differently based on whether user is authenticated
    const isAuthenticated = req.user && req.user.userId;
    const query = `
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
          u.reputation_score,
          a.file_name,
          a.file_size,
          a.file_type,
          a.md5_hash,
          a.sha256_hash,
          a.storage_path,
          a.is_quarantined,
          a.malware_family,
          a.malware_category,
          a.upload_time,
          latest.execution_id,
          latest.sandbox_status,
          latest.environment,
          latest.os_profile,
          latest.network_enabled,
          latest.timeout_seconds,
          latest.queued_at,
          latest.started_at,
          latest.finished_at,
          latest.error_message,
          (
            SELECT
              l.log_id,
              l.log_type,
              l.log_data,
              l.captured_at
            FROM Sandbox_Executions e
            INNER JOIN Behavioral_Logs l ON l.execution_id = e.execution_id
            WHERE e.submission_id = s.submission_id
            ORDER BY l.captured_at ASC
            FOR JSON PATH
          ) AS behavioral_logs
        FROM Analysis_Submissions s
        INNER JOIN Users u ON u.user_id = s.author_id
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        OUTER APPLY (
          SELECT TOP 1
            e.execution_id,
            e.status AS sandbox_status,
            e.environment,
            e.os_profile,
            e.network_enabled,
            e.timeout_seconds,
            e.queued_at,
            e.started_at,
            e.finished_at,
            e.error_message
          FROM Sandbox_Executions e
          WHERE e.submission_id = s.submission_id
          ORDER BY e.queued_at DESC
        ) latest
        WHERE s.submission_id = @submission_id
          ${isAuthenticated ? 'AND (s.author_id = @user_id OR s.status = \'Published\')' : 'AND s.status = \'Published\''}
      `;

    const result = await pool.request()
      .input('submission_id', sql.INT, submissionId)
      .input('user_id', sql.INT, isAuthenticated ? req.user.userId : null)
      .query(query);

    const submission = result.recordset[0];
    if (!submission) {
      // If user is authenticated but submission not found withPublished filter, try without status filter
      // This allows viewing drafts/pending by the author even if not on the feed
      if (isAuthenticated) {
        const draftQuery = `
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
            u.reputation_score,
            a.file_name,
            a.file_size,
            a.file_type,
            a.md5_hash,
            a.sha256_hash,
            a.storage_path,
            a.is_quarantined,
            a.malware_family,
            a.malware_category,
            a.upload_time,
            latest.execution_id,
            latest.sandbox_status,
            latest.environment,
            latest.os_profile,
            latest.network_enabled,
            latest.timeout_seconds,
            latest.queued_at,
            latest.started_at,
            latest.finished_at,
            latest.error_message,
            (
              SELECT
                l.log_id,
                l.log_type,
                l.log_data,
                l.captured_at
              FROM Sandbox_Executions e
              INNER JOIN Behavioral_Logs l ON l.execution_id = e.execution_id
              WHERE e.submission_id = s.submission_id
              ORDER BY l.captured_at ASC
              FOR JSON PATH
            ) AS behavioral_logs
          FROM Analysis_Submissions s
          INNER JOIN Users u ON u.user_id = s.author_id
          LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
          OUTER APPLY (
            SELECT TOP 1
              e.execution_id,
              e.status AS sandbox_status,
              e.environment,
              e.os_profile,
              e.network_enabled,
              e.timeout_seconds,
              e.queued_at,
              e.started_at,
              e.finished_at,
              e.error_message
            FROM Sandbox_Executions e
            WHERE e.submission_id = s.submission_id
            ORDER BY e.queued_at DESC
          ) latest
          WHERE s.submission_id = @submission_id AND s.author_id = @user_id
        `;
        const draftResult = await pool.request()
          .input('submission_id', sql.INT, submissionId)
          .input('user_id', sql.INT, req.user.userId)
          .query(draftQuery);

        const draftSubmission = draftResult.recordset[0];
        if (draftSubmission) {
          return res.json({
            ...draftSubmission,
            behavioral_logs: draftSubmission.behavioral_logs ? JSON.parse(draftSubmission.behavioral_logs) : [],
          });
        }
      }

      return res.status(404).json({ error: 'Submission not found or not published' });
    }

    res.json({
      ...submission,
      behavioral_logs: submission.behavioral_logs ? JSON.parse(submission.behavioral_logs) : [],
    });
  }
  catch (err) {
    console.log("Failed to get submission:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Alias for backwards compatibility - uses protect middleware in routes
export const getSubmissionById = getSubmissionByIdPublic;

export const updateSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const submissionId = Number(req.params.id);
    const {
      title,
      content,
      status,
      artifact_id,
      version,
      template_type,
    } = req.body;

    if (!userId || !submissionId) {
      return res.status(400).json({ error: 'Submission id is required' });
    }

    const normalizedStatus = status && ['Draft', 'Pending', 'Published', 'Rejected', 'Archived'].includes(status)
      ? status
      : null;

    if (status && !normalizedStatus) {
      return res.status(400).json({ error: 'Invalid submission status' });
    }

    const result = await pool.request()
      .input('submission_id', sql.INT, submissionId)
      .input('user_id', sql.INT, userId)
      .input('title', sql.NVARCHAR(255), title ?? null)
      .input('content', sql.NVARCHAR(sql.MAX), content ?? null)
      .input('status', sql.NVARCHAR(20), normalizedStatus)
      .input('artifact_id', sql.INT, artifact_id ?? null)
      .input('version', sql.INT, version ?? null)
      .input('template_type', sql.NVARCHAR(50), template_type ?? null)
      .query(`
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
          AND author_id = @user_id
          AND status <> 'Archived'
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ message: 'Submission updated', submission: result.recordset[0] });
  } catch (err) {
    console.log("Failed to update submission:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const deleteSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const submissionId = Number(req.params.id);

    if (!userId || !submissionId) {
      return res.status(400).json({ error: 'Submission id is required' });
    }

    const result = await pool.request()
      .input('submission_id', sql.INT, submissionId)
      .input('user_id', sql.INT, userId)
      .query(`
        UPDATE Analysis_Submissions
        SET status = 'Archived', updated_at = GETDATE()
        OUTPUT INSERTED.submission_id, INSERTED.status
        WHERE submission_id = @submission_id
          AND author_id = @user_id
          AND status <> 'Archived'
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Submission not found or already archived' });
    }

    res.json({ message: 'Submission archived', submission: result.recordset[0] });
  } catch (err) {
    console.log("Failed to delete submission:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const postSubmission = async (req, res) => {
  try {
    const authorId = req.user.userId;
    const { artifact_id, title, content, status = 'Draft', version = 1, template_type = 'MALWARE_ANALYSIS' } = req.body;

    if (!authorId || !title || !content) {
      return res.status(400).json({ error: "Required fields missing" })
    }

    const normalizedStatus = ['Draft', 'Pending', 'Published', 'Rejected', 'Archived'].includes(status)
      ? status
      : 'Draft';

    try {
      const result = await pool.request()
        .input('author_id', sql.INT, authorId)
        .input('artifact_id', sql.INT, artifact_id || null)
        .input('title', sql.NVARCHAR(255), title)
        .input('content', sql.NVARCHAR(sql.MAX), content)
        .input('status', sql.NVARCHAR(20), normalizedStatus)
        .input('version', sql.INT, Number(version) || 1)
        .input('template_type', sql.NVARCHAR(50), template_type)
        .query(`
          INSERT INTO Analysis_Submissions(author_id, artifact_id, title, content, status, version, template_type)
          OUTPUT INSERTED.submission_id
          VALUES (@author_id, @artifact_id, @title, @content, @status, @version, @template_type)
        `);

      res.status(201).json({
        message: "Submission Created",
        submission_id: result.recordset[0].submission_id,
      });
    }
    catch (dbErr) {
      console.error("Failed to post submission: ", dbErr);
      res.status(500).json({ error: "DB constraint violated" });
    }

  }
  catch (err) {
    console.log("Failed to post submission:", err);
    res.status(400).json({ error: "Bad Request" });
  }
}

