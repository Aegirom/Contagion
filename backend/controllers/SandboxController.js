import sql from 'mssql';
import pool from '../config/db.js';
import { getBehaviorSummary, getFileReport, normalizeVerdict } from '../services/virusTotalService.js';

const HASH_PATTERN = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
const ALLOWED_ENVIRONMENTS = new Set(['Docker', 'VirtualBox', 'KVM']);
let cachedSha1Column = null;

const createNotification = async ({ userId, type, message, actorUsername, relatedSubmissionId }) => {
  try {
    console.log(`[Notification] Creating: user=${userId}, type=${type}, actor=${actorUsername}, submission=${relatedSubmissionId}`);
    const result = await pool.request()
      .input("userId", sql.Int, Number(userId))
      .input("type", sql.NVarChar(50), type)
      .input("message", sql.NVarChar(500), message)
      .input("actorUsername", sql.NVarChar(100), actorUsername)
      .input("relatedSubmissionId", sql.Int, relatedSubmissionId ? Number(relatedSubmissionId) : null)
      .query(`
        INSERT INTO Notifications (user_id, type, message, actor_username, related_submission_id, is_read)
        OUTPUT INSERTED.notification_id
        VALUES (@userId, @type, @message, @actorUsername, @relatedSubmissionId, 0)
      `);
    console.log(`[Notification] Created notification_id=${result.recordset[0].notification_id}`);
  } catch (error) {
    console.error("[Notification] Error creating notification:", error.message);
    console.error("[Notification] SQL details:", error);
  }
};

const getSha1Column = async () => {
  if (cachedSha1Column) return cachedSha1Column;

  const result = await pool.request().query(`
    SELECT name
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Malware_Artifacts')
      AND LOWER(name) LIKE 'sha1%'
  `);

  cachedSha1Column = result.recordset[0]?.name || 'sha1_hash';
  return cachedSha1Column;
};

const assertSubmissionAccess = async (submissionId, userId) => {
  const result = await pool.request()
    .input('submission_id', sql.INT, submissionId)
    .input('user_id', sql.INT, userId)
    .query(`
      SELECT submission_id, author_id, artifact_id, title
      FROM Analysis_Submissions
      WHERE submission_id = @submission_id
        AND (author_id = @user_id OR status IN ('Published', 'Pending'))
    `);

  return result.recordset[0] || null;
};

const getSubmissionHash = async (artifactId) => {
  if (!artifactId) return null;

  const result = await pool.request()
    .input('artifact_id', sql.INT, artifactId)
    .query(`
      SELECT sha256_hash, md5_hash
      FROM Malware_Artifacts
      WHERE artifact_id = @artifact_id
    `);

  return result.recordset[0]?.sha256_hash || result.recordset[0]?.md5_hash || null;
};

const getOrCreateArtifact = async (fileReport, uploaderId) => {
  const attributes = fileReport?.data?.attributes || {};
  const sha256 = attributes.sha256 || fileReport?.data?.id;
  const sha1 = attributes.sha1;
  const md5 = attributes.md5;

  if (!sha256 || !sha1 || !md5) {
    const error = new Error('VirusTotal report did not include complete file hashes');
    error.statusCode = 422;
    throw error;
  }

  const existing = await pool.request()
    .input('sha256_hash', sql.CHAR(64), sha256)
    .query('SELECT artifact_id FROM Malware_Artifacts WHERE sha256_hash = @sha256_hash');

  if (existing.recordset[0]) {
    return existing.recordset[0].artifact_id;
  }

  const sha1Column = await getSha1Column();
  const fileName = attributes.meaningful_name || attributes.names?.[0] || `${sha256.slice(0, 12)}.bin`;
  const fileType = attributes.type_extension || attributes.type_description || 'unknown';
  const storagePath = `virustotal://${sha256}`;
  const threatLabel = attributes.popular_threat_classification?.suggested_threat_label || null;
  const threatCategory = threatLabel ? 'Other' : null;

  const insertQuery = `
    INSERT INTO Malware_Artifacts (
      uploader_id,
      file_name,
      file_size,
      file_type,
      md5_hash,
      ${sha1Column},
      sha256_hash,
      storage_path,
      malware_family,
      malware_category
    )
    OUTPUT INSERTED.artifact_id
    VALUES (
      @uploader_id,
      @file_name,
      @file_size,
      @file_type,
      @md5_hash,
      @sha1_hash,
      @sha256_hash,
      @storage_path,
      @malware_family,
      @malware_category
    )
  `;

  const result = await pool.request()
    .input('uploader_id', sql.INT, uploaderId)
    .input('file_name', sql.NVARCHAR(255), fileName)
    .input('file_size', sql.BIGINT, attributes.size || 0)
    .input('file_type', sql.NVARCHAR(50), String(fileType).slice(0, 50))
    .input('md5_hash', sql.CHAR(32), md5)
    .input('sha1_hash', sql.CHAR(40), sha1)
    .input('sha256_hash', sql.CHAR(64), sha256)
    .input('storage_path', sql.NVARCHAR(500), storagePath)
    .input('malware_family', sql.NVARCHAR(100), threatLabel?.slice(0, 100) || null)
    .input('malware_category', sql.NVARCHAR(50), threatCategory)
    .query(insertQuery);

  return result.recordset[0].artifact_id;
};

const createExecution = async ({ submissionId, artifactId, environment, osProfile, networkEnabled, timeoutSeconds }) => {
  const result = await pool.request()
    .input('submission_id', sql.INT, submissionId)
    .input('artifact_id', sql.INT, artifactId)
    .input('environment', sql.NVARCHAR(30), environment)
    .input('os_profile', sql.NVARCHAR(50), osProfile)
    .input('network_enabled', sql.BIT, networkEnabled)
    .input('timeout_seconds', sql.INT, timeoutSeconds)
    .query('EXEC sp_CreateSandboxExecution @submission_id, @artifact_id, @environment, @os_profile, @network_enabled, @timeout_seconds');

  return result.recordset[0].execution_id;
};

const updateExecution = async (executionId, status, errorMessage = null) => {
  await pool.request()
    .input('execution_id', sql.INT, executionId)
    .input('status', sql.NVARCHAR(20), status)
    .input('error_message', sql.NVARCHAR(sql.MAX), errorMessage)
    .query('EXEC sp_CompleteSandboxExecution @execution_id, @status, @error_message');
};

const insertLog = async (executionId, logType, logData) => {
  if (!logData || (Array.isArray(logData) && logData.length === 0)) return;

  await pool.request()
    .input('execution_id', sql.INT, executionId)
    .input('log_type', sql.NVARCHAR(30), logType)
    .input('log_data', sql.NVARCHAR(sql.MAX), JSON.stringify(logData))
    .query(`
      INSERT INTO Behavioral_Logs (execution_id, log_type, log_data)
      VALUES (@execution_id, @log_type, @log_data)
    `);
};

const storeBehaviorLogs = async (executionId, fileReport, behaviorSummary, verdict) => {
  const attributes = fileReport?.data?.attributes || {};
  const behavior = behaviorSummary?.data || {};

  await insertLog(executionId, 'Memory', {
    verdict,
    hashes: {
      md5: attributes.md5,
      sha1: attributes.sha1,
      sha256: attributes.sha256 || fileReport?.data?.id,
    },
    names: attributes.names || [],
    type: attributes.type_description,
  });

  await insertLog(executionId, 'API_Call', {
    calls_highlighted: behavior.calls_highlighted || [],
    tags: behavior.tags || [],
  });

  await insertLog(executionId, 'File_System', {
    files_opened: behavior.files_opened || [],
    files_written: behavior.files_written || [],
    files_deleted: behavior.files_deleted || [],
    files_attribute_changed: behavior.files_attribute_changed || [],
  });

  await insertLog(executionId, 'Registry', {
    registry_keys_opened: behavior.registry_keys_opened || [],
    registry_keys_set: behavior.registry_keys_set || [],
    registry_keys_deleted: behavior.registry_keys_deleted || [],
  });

  await insertLog(executionId, 'Network', {
    contacted_domains: behavior.contacted_domains || [],
    contacted_ips: behavior.contacted_ips || [],
    dns_lookups: behavior.dns_lookups || [],
    http_conversations: behavior.http_conversations || [],
    ip_traffic: behavior.ip_traffic || [],
  });

  await insertLog(executionId, 'Process', {
    processes_created: behavior.processes_created || [],
    processes_terminated: behavior.processes_terminated || [],
    processes_tree: behavior.processes_tree || [],
    command_executions: behavior.command_executions || [],
  });
};

const shapeExecutionRow = (row) => ({
  ...row,
  logs: row.logs ? JSON.parse(row.logs) : [],
});

export const getSandboxSubmissions = async (req, res) => {
  try {
    const sha1Column = await getSha1Column();
    const result = await pool.request()
      .input('user_id', sql.INT, req.user.userId)
      .query(`
        SELECT
          s.submission_id,
          s.title,
          s.status,
          s.artifact_id,
          a.file_name,
          a.file_size,
          a.file_type,
          a.md5_hash,
          a.${sha1Column} AS sha1_hash,
          a.sha256_hash,
          a.storage_path,
          a.malware_family,
          a.malware_category,
          a.upload_time,
          a.is_quarantined
        FROM Analysis_Submissions s
        LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
        WHERE s.author_id = @user_id
        ORDER BY s.updated_at DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Failed to load sandbox submissions:', error);
    res.status(500).json({ error: 'Failed to load submissions' });
  }
};

export const listExecutions = async (req, res) => {
  try {
    const result = await pool.request()
      .input('user_id', sql.INT, req.user.userId)
      .query(`
        SELECT TOP 25
          e.execution_id,
          e.submission_id,
          e.artifact_id,
          e.environment,
          e.os_profile,
          e.status,
          e.network_enabled,
          e.timeout_seconds,
          e.queued_at,
          e.started_at,
          e.finished_at,
          e.error_message,
          s.title AS submission_title,
          a.file_name,
          a.sha256_hash,
          (
            SELECT
              l.log_id,
              l.log_type,
              l.log_data,
              l.captured_at
            FROM Behavioral_Logs l
            WHERE l.execution_id = e.execution_id
            ORDER BY l.captured_at ASC
            FOR JSON PATH
          ) AS logs
        FROM Sandbox_Executions e
        INNER JOIN Analysis_Submissions s ON s.submission_id = e.submission_id
        INNER JOIN Malware_Artifacts a ON a.artifact_id = e.artifact_id
        WHERE s.author_id = @user_id
        ORDER BY e.queued_at DESC
      `);

    res.json(result.recordset.map(shapeExecutionRow));
  } catch (error) {
    console.error('Failed to list sandbox executions:', error);
    res.status(500).json({ error: 'Failed to load sandbox executions' });
  }
};

export const evaluateFile = async (req, res) => {
  const {
    submission_id: submissionId,
    file_hash: requestedHash,
    environment = 'Docker',
    os_profile: osProfile = 'Windows10',
    network_enabled: networkEnabled = false,
    timeout_seconds: timeoutSeconds = 120,
  } = req.body;

  let executionId = null;

  try {
    if (!submissionId) {
      return res.status(400).json({ error: 'submission_id is required' });
    }

    if (!ALLOWED_ENVIRONMENTS.has(environment)) {
      return res.status(400).json({ error: 'Invalid sandbox environment' });
    }

    const submission = await assertSubmissionAccess(Number(submissionId), req.user.userId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const existingArtifactHash = await getSubmissionHash(submission.artifact_id);
    const hash = String(requestedHash || existingArtifactHash || '').trim();

    if (!HASH_PATTERN.test(hash)) {
      return res.status(400).json({ error: 'A valid MD5, SHA-1, or SHA-256 hash is required' });
    }

    const fileReport = await getFileReport(hash);
    const artifactId = await getOrCreateArtifact(fileReport, req.user.userId);

    if (!submission.artifact_id) {
      await pool.request()
        .input('submission_id', sql.INT, submission.submission_id)
        .input('artifact_id', sql.INT, artifactId)
        .query(`
          UPDATE Analysis_Submissions
          SET artifact_id = @artifact_id, updated_at = GETDATE()
          WHERE submission_id = @submission_id
        `);
    }

    executionId = await createExecution({
      submissionId: submission.submission_id,
      artifactId,
      environment,
      osProfile,
      networkEnabled: Boolean(networkEnabled),
      timeoutSeconds: Number(timeoutSeconds) || 120,
    });

    const behaviorSummary = await getBehaviorSummary(fileReport.data.attributes.sha256 || fileReport.data.id);
    const verdict = normalizeVerdict(fileReport);

    await storeBehaviorLogs(executionId, fileReport, behaviorSummary, verdict);
    await updateExecution(executionId, 'Completed');

    const notifierResult = await pool.request()
      .input('userId', sql.INT, req.user.userId)
      .query('SELECT username FROM Users WHERE user_id = @userId');

    await createNotification({
      userId: req.user.userId,
      type: 'sandbox',
      message: `Sandbox analysis completed for "${submission.title}"`,
      actorUsername: notifierResult.recordset[0]?.username || 'System',
      relatedSubmissionId: submission.submission_id,
    });

    res.status(201).json({
      execution_id: executionId,
      submission_id: submission.submission_id,
      artifact_id: artifactId,
      status: 'Completed',
      verdict,
      file: {
        name: fileReport.data.attributes.meaningful_name || fileReport.data.attributes.names?.[0] || null,
        sha256: fileReport.data.attributes.sha256 || fileReport.data.id,
        type: fileReport.data.attributes.type_description || null,
        size: fileReport.data.attributes.size || 0,
      },
      behavior: behaviorSummary?.data || null,
    });
  } catch (error) {
    console.error('Sandbox evaluation failed:', error);
    if (executionId) {
      await updateExecution(executionId, 'Failed', error.message);
    }

    res.status(error.statusCode || 500).json({
      error: error.message || 'Sandbox evaluation failed',
      details: error.details,
    });
  }
};
