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
        u.role,
        a.file_name,
        a.file_size,
        a.file_type,
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
      WHERE s.status = 'Published'
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
  }
  catch (err) {
    console.log("Failed to fetch user submissions: ", err);
    return [];
  }
}

async function fetchUserStats(userId) {
  try {
    const totalResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query('SELECT COUNT(*) AS total FROM Analysis_Submissions WHERE author_id = @user_id AND status <> \'Archived\'');

    const completedResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query('SELECT COUNT(*) AS completed FROM Analysis_Submissions WHERE author_id = @user_id AND status = \'Published\'');

    const pendingResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query('SELECT COUNT(*) AS pending FROM Analysis_Submissions WHERE author_id = @user_id AND status IN (\'Draft\', \'Pending\', \'Archived\')');

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'contagion',
      });
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
          u.role,
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
      `;

    const result = await pool.request()
      .input('submission_id', sql.INT, submissionId)
      .query(query);

    const submission = result.recordset[0];
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const logs = await pool.request()
      .input('submission_id', sql.INT, submissionId)
      .query(`
        SELECT l.log_id, l.log_type, l.log_data, l.captured_at
        FROM Sandbox_Executions e
        INNER JOIN Behavioral_Logs l ON l.execution_id = e.execution_id
        WHERE e.submission_id = @submission_id
        ORDER BY l.captured_at ASC
      `);

    res.json({ ...submission, behavioral_logs: logs.recordset || [] });
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
    const userRole = req.user?.role;
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

    const isAdminOrMod = ['Administrator', 'Moderator'].includes(userRole);
    const authorFilter = isAdminOrMod ? '' : 'AND author_id = @user_id';

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

    const result = await pool.request()
      .input('submission_id', sql.INT, submissionId)
      .input('user_id', sql.INT, userId)
      .input('title', sql.NVARCHAR(255), title ?? null)
      .input('content', sql.NVARCHAR(sql.MAX), content ?? null)
      .input('status', sql.NVARCHAR(20), normalizedStatus)
      .input('artifact_id', sql.INT, artifact_id ?? null)
      .input('version', sql.INT, version ?? null)
      .input('template_type', sql.NVARCHAR(50), template_type ?? null)
      .query(query);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ message: 'Submission updated', submission: result.recordset[0] });
  } catch (err) {
    console.log("Failed to update submission:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const importSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const submissionId = Number(req.params.id);

    if (!userId || !submissionId) {
      return res.status(400).json({ error: 'Submission id is required' });
    }

    // Get original submission
    const original = await pool.request()
      .input('submission_id', sql.INT, submissionId)
      .query(`
        SELECT title, content, artifact_id, template_type
        FROM Analysis_Submissions
        WHERE submission_id = @submission_id
      `);

    if (!original.recordset[0]) {
      return res.status(404).json({ error: 'Original submission not found' });
    }

    const { title, content, artifact_id, template_type } = original.recordset[0];

    // Create new submission for current user
    const result = await pool.request()
      .input('author_id', sql.INT, userId)
      .input('artifact_id', sql.INT, artifact_id || null)
      .input('title', sql.NVARCHAR(255), `Imported: ${title}`)
      .input('content', sql.NVARCHAR(sql.MAX), content)
      .input('status', sql.NVARCHAR(20), 'Draft')
      .input('version', sql.INT, 1)
      .input('template_type', sql.NVARCHAR(50), template_type)
      .query(`
        INSERT INTO Analysis_Submissions(author_id, artifact_id, title, content, status, version, template_type)
        OUTPUT INSERTED.submission_id
        VALUES (@author_id, @artifact_id, @title, @content, @status, @version, @template_type)
      `);

    res.status(201).json({
      message: "Submission imported successfully",
      submission_id: result.recordset[0].submission_id
    });
  } catch (err) {
    console.log("Failed to import submission:", err);
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

export const getUserSavedSubmissions = async (req, res) => {
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
  }
  catch (err) {
    console.log("Failed to get user saved submissions: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const postSubmission = async (req, res) => {
  try {
    const authorId = req.user.userId;
    const userRole = req.user.role;
    const { artifact_id, title, content, status = 'Draft', version = 1, template_type = 'MALWARE_ANALYSIS' } = req.body;

    if (!authorId || !title || !content) {
      return res.status(400).json({ error: "Required fields missing" })
    }

    let finalStatus;
    if (userRole === 'Administrator' || userRole === 'Moderator') {
      finalStatus = ['Draft', 'Pending', 'Published', 'Rejected', 'Archived'].includes(status)
        ? status
        : 'Draft';
    } else {
      finalStatus = ['Draft', 'Pending'].includes(status)
        ? (status === 'Pending' ? 'Pending' : 'Draft')
        : 'Pending';
    }

    try {
      const result = await pool.request()
        .input('author_id', sql.INT, authorId)
        .input('artifact_id', sql.INT, artifact_id || null)
        .input('title', sql.NVARCHAR(255), title)
        .input('content', sql.NVARCHAR(sql.MAX), content)
        .input('status', sql.NVARCHAR(20), finalStatus)
        .input('version', sql.INT, Number(version) || 1)
        .input('template_type', sql.NVARCHAR(50), template_type)
        .query(`
          INSERT INTO Analysis_Submissions(author_id, artifact_id, title, content, status, version, template_type)
          OUTPUT INSERTED.submission_id, INSERTED.status
          VALUES (@author_id, @artifact_id, @title, @content, @status, @version, @template_type)
        `);

      // XP gain: +10 for creating a submission, +25 if published immediately
      const xpGain = finalStatus === 'Published' ? 25 : 10;
      await pool.request()
        .input('author_id', sql.INT, authorId)
        .input('xp', sql.INT, xpGain)
        .query('UPDATE Users SET reputation_score = reputation_score + @xp WHERE user_id = @author_id');

      res.status(201).json({
        message: "Submission Created",
        submission_id: result.recordset[0].submission_id,
        status: result.recordset[0].status,
        xp_gained: xpGain,
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

