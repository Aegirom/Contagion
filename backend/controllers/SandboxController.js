import sql from "mssql";
import pool from "../config/db.js";
import {
  getBehaviorSummary,
  getFileReport,
  normalizeVerdict,
} from "../services/virusTotalService.js";
import { lookupHash } from "../services/abuseChService.js";
import {
  analyzeLocally,
  getStaticWarnings,
} from "../services/localAnalysisService.js";
import { getSha1Column } from "../services/artifactService.js";
import { createNotification } from "../services/notificationService.js";
import { performAiEvaluation } from "../services/aiEvaluationService.js";
import { saveAiEvaluationInternal } from "./AiEvaluationController.js";
import {
  get as cacheGet,
  set as cacheSet,
  invalidatePrefix,
  TTL,
} from "../services/cacheService.js";

const HASH_PATTERN = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
const ALLOWED_ENVIRONMENTS = new Set(["Docker", "VirtualBox", "KVM"]);

const assertSubmissionAccess = async (submissionId, userId) => {
  const result = await pool
    .request()
    .input("submission_id", sql.INT, submissionId)
    .input("user_id", sql.INT, userId).query(`
      SELECT submission_id, author_id, artifact_id, title
      FROM Analysis_Submissions
      WHERE submission_id = @submission_id
        AND (author_id = @user_id OR status IN ('Published', 'Pending'))
    `);

  return result.recordset[0] || null;
};

const getSubmissionHash = async (artifactId) => {
  if (!artifactId) return null;

  const result = await pool.request().input("artifact_id", sql.INT, artifactId)
    .query(`
      SELECT sha256_hash, md5_hash
      FROM Malware_Artifacts
      WHERE artifact_id = @artifact_id
    `);

  return (
    result.recordset[0]?.sha256_hash || result.recordset[0]?.md5_hash || null
  );
};

const getOrCreateArtifact = async (
  fileReport,
  uploaderId,
  abuseData,
  localArtifact,
) => {
  if (localArtifact) return localArtifact.artifact_id;

  const attributes = fileReport?.data?.attributes || {};
  const sha256 =
    attributes.sha256 || fileReport?.data?.id || abuseData?.sha256_hash;
  if (!sha256) {
    const error = new Error("File report did not include a valid SHA-256 hash");
    error.statusCode = 422;
    throw error;
  }

  const existing = await pool
    .request()
    .input("sha256_hash", sql.CHAR(64), sha256)
    .query(
      "SELECT artifact_id FROM Malware_Artifacts WHERE sha256_hash = @sha256_hash",
    );

  if (existing.recordset[0]) {
    return existing.recordset[0].artifact_id;
  }

  const sha1 = attributes.sha1 || abuseData?.sha1_hash;
  const md5 = attributes.md5 || abuseData?.md5_hash;
  const fileName =
    attributes.meaningful_name ||
    attributes.names?.[0] ||
    abuseData?.file_name ||
    `${sha256.slice(0, 12)}.bin`;
  const fileType =
    attributes.type_extension ||
    attributes.type_description ||
    abuseData?.file_type ||
    "unknown";
  const fileSize = attributes.size || abuseData?.file_size || 0;
  const family =
    attributes.popular_threat_classification?.suggested_threat_label ||
    abuseData?.malware_family ||
    null;
  const category = abuseData?.malware_category || "Other";

  const sha1Column = await getSha1Column();
  const storagePath = abuseData ? `abuse://${sha256}` : `cache://${sha256}`;

  const insertQuery = `
    INSERT INTO Malware_Artifacts (
      uploader_id, file_name, file_size, file_type,
      md5_hash, ${sha1Column}, sha256_hash, storage_path,
      malware_family, malware_category
    )
    OUTPUT INSERTED.artifact_id
    VALUES (
      @uploader_id, @file_name, @file_size, @file_type,
      @md5_hash, @sha1_hash, @sha256_hash, @storage_path,
      @malware_family, @malware_category
    )
  `;

  const result = await pool
    .request()
    .input("uploader_id", sql.INT, uploaderId)
    .input("file_name", sql.NVARCHAR(255), String(fileName).slice(0, 255))
    .input("file_size", sql.BIGINT, fileSize)
    .input("file_type", sql.NVARCHAR(50), String(fileType).slice(0, 50))
    .input("md5_hash", sql.CHAR(32), md5 || sha256.slice(0, 32))
    .input("sha1_hash", sql.CHAR(40), sha1 || sha256.slice(0, 40))
    .input("sha256_hash", sql.CHAR(64), sha256)
    .input("storage_path", sql.NVARCHAR(500), storagePath)
    .input("malware_family", sql.NVARCHAR(100), family?.slice(0, 100) || null)
    .input("malware_category", sql.NVARCHAR(50), category)
    .query(insertQuery);

  return result.recordset[0].artifact_id;
};

const createExecution = async ({
  submissionId,
  artifactId,
  environment,
  osProfile,
  networkEnabled,
  timeoutSeconds,
}) => {
  const result = await pool
    .request()
    .input("submission_id", sql.INT, submissionId)
    .input("artifact_id", sql.INT, artifactId)
    .input("environment", sql.NVARCHAR(30), environment)
    .input("os_profile", sql.NVARCHAR(50), osProfile)
    .input("network_enabled", sql.BIT, networkEnabled)
    .input("timeout_seconds", sql.INT, timeoutSeconds)
    .query(
      "EXEC sp_CreateSandboxExecution @submission_id, @artifact_id, @environment, @os_profile, @network_enabled, @timeout_seconds",
    );

  return result.recordset[0].execution_id;
};

const updateExecution = async (executionId, status, errorMessage = null) => {
  await pool
    .request()
    .input("execution_id", sql.INT, executionId)
    .input("status", sql.NVARCHAR(20), status)
    .input("error_message", sql.NVARCHAR(sql.MAX), errorMessage)
    .query(
      "EXEC sp_CompleteSandboxExecution @execution_id, @status, @error_message",
    );
};

const insertLog = async (executionId, logType, logData) => {
  if (!logData || (Array.isArray(logData) && logData.length === 0)) return;

  await pool
    .request()
    .input("execution_id", sql.INT, executionId)
    .input("log_type", sql.NVARCHAR(30), logType)
    .input("log_data", sql.NVARCHAR(sql.MAX), JSON.stringify(logData)).query(`
      INSERT INTO Behavioral_Logs (execution_id, log_type, log_data)
      VALUES (@execution_id, @log_type, @log_data)
    `);
};

const storeBehaviorLogs = async (
  executionId,
  fileReport,
  behaviorSummary,
  verdict,
) => {
  const attributes = fileReport?.data?.attributes || {};
  const behavior = behaviorSummary?.data || {};

  await insertLog(executionId, "Memory", {
    verdict,
    hashes: {
      md5: attributes.md5,
      sha1: attributes.sha1,
      sha256: attributes.sha256 || fileReport?.data?.id,
    },
    names: attributes.names || [],
    type: attributes.type_description,
  });

  await insertLog(executionId, "API_Call", {
    calls_highlighted: behavior.calls_highlighted || [],
    tags: behavior.tags || [],
  });

  await insertLog(executionId, "File_System", {
    files_opened: behavior.files_opened || [],
    files_written: behavior.files_written || [],
    files_deleted: behavior.files_deleted || [],
    files_attribute_changed: behavior.files_attribute_changed || [],
  });

  await insertLog(executionId, "Registry", {
    registry_keys_opened: behavior.registry_keys_opened || [],
    registry_keys_set: behavior.registry_keys_set || [],
    registry_keys_deleted: behavior.registry_keys_deleted || [],
  });

  await insertLog(executionId, "Network", {
    contacted_domains: behavior.contacted_domains || [],
    contacted_ips: behavior.contacted_ips || [],
    dns_lookups: behavior.dns_lookups || [],
    http_conversations: behavior.http_conversations || [],
    ip_traffic: behavior.ip_traffic || [],
  });

  await insertLog(executionId, "Process", {
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

const storeLocalLogs = async (executionId, abuseData, verdict, warnings) => {
  await insertLog(executionId, "Memory", {
    verdict,
    hashes: abuseData
      ? {
          md5: abuseData.md5_hash,
          sha1: abuseData.sha1_hash,
          sha256: abuseData.sha256_hash,
        }
      : null,
    type: abuseData?.file_type || null,
    source: verdict?.source || "static-analysis",
  });

  await insertLog(executionId, "File_System", {
    risk_factors: warnings,
    tags: verdict?.tags || [],
    analysis_depth: "static",
  });

  if (abuseData?.signatures?.length) {
    await insertLog(executionId, "API_Call", {
      signatures: abuseData.signatures,
      delivery_method: abuseData.delivery_method,
    });
  }

  if (abuseData?.tags?.length) {
    await insertLog(executionId, "Network", {
      threat_tags: abuseData.tags,
      first_seen: abuseData.first_seen,
    });
  }
};

export const getSandboxSubmissions = async (req, res) => {
  try {
    const cacheKey = `sandbox:submissions:${req.user.userId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const sha1Column = await getSha1Column();
    const result = await pool
      .request()
      .input("user_id", sql.INT, req.user.userId).query(`
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

    cacheSet(cacheKey, result.recordset, TTL.SANDBOX_SUBMISSIONS);
    res.json(result.recordset);
  } catch (error) {
    console.error("Failed to load sandbox submissions:", error);
    res.status(500).json({ error: "Failed to load submissions" });
  }
};

export const listExecutions = async (req, res) => {
  try {
    const cacheKey = `sandbox:executions:${req.user.userId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool
      .request()
      .input("user_id", sql.INT, req.user.userId).query(`
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

    cacheSet(
      cacheKey,
      result.recordset.map(shapeExecutionRow),
      TTL.EXECUTIONS_LIST,
    );
    res.json(result.recordset.map(shapeExecutionRow));
  } catch (error) {
    console.error("Failed to list sandbox executions:", error);
    res.status(500).json({ error: "Failed to load sandbox executions" });
  }
};

export const evaluateFile = async (req, res) => {
  const {
    submission_id: submissionId,
    file_hash: requestedHash,
    environment = "Docker",
    os_profile: osProfile = "Windows10",
    network_enabled: networkEnabled = false,
    timeout_seconds: timeoutSeconds = 120,
  } = req.body;

  let executionId = null;

  try {
    if (!submissionId) {
      return res.status(400).json({ error: "submission_id is required" });
    }

    if (!ALLOWED_ENVIRONMENTS.has(environment)) {
      return res.status(400).json({ error: "Invalid sandbox environment" });
    }

    const submission = await assertSubmissionAccess(
      Number(submissionId),
      req.user.userId,
    );
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const existingArtifactHash = await getSubmissionHash(
      submission.artifact_id,
    );
    const hash = String(requestedHash || existingArtifactHash || "").trim();

    if (!HASH_PATTERN.test(hash)) {
      return res
        .status(400)
        .json({ error: "A valid MD5, SHA-1, or SHA-256 hash is required" });
    }

    let artifactId = submission.artifact_id;
    let localArtifact = null;

    if (artifactId) {
      const artResult = await pool
        .request()
        .input("artifact_id", sql.INT, artifactId)
        .query(
          "SELECT * FROM Malware_Artifacts WHERE artifact_id = @artifact_id",
        );
      localArtifact = artResult.recordset[0];
    }

    let fileReport = null;
    let abuseData = null;
    let vtData = false;
    let abuseFound = false;

    const results = await Promise.allSettled([
      getFileReport(hash).catch((err) =>
        err.statusCode === 404 ? null : Promise.reject(err),
      ),
      lookupHash(hash),
    ]);

    if (results[0].status === "fulfilled" && results[0].value) {
      fileReport = results[0].value;
      vtData = true;
    }
    if (results[1].status === "fulfilled" && results[1].value) {
      abuseData = results[1].value;
      abuseFound = true;
    }

    const localVerdict = analyzeLocally(
      localArtifact || {
        file_name: abuseData?.file_name,
        file_type: abuseData?.file_type,
        malware_family: abuseData?.malware_family,
        malware_category: abuseData?.malware_category,
        file_hash: hash,
      },
    );

    if (!artifactId) {
      artifactId = await getOrCreateArtifact(
        fileReport,
        req.user.userId,
        abuseData,
        localArtifact,
      );
    }

    if (!abuseFound && !vtData && !localArtifact) {
      return res.status(404).json({
        error: "File hash not found in any threat intelligence source",
        code: "HASH_NOT_FOUND",
      });
    }

    if (artifactId && !submission.artifact_id) {
      await pool
        .request()
        .input("submission_id", sql.INT, submission.submission_id)
        .input("artifact_id", sql.INT, artifactId).query(`
          UPDATE Analysis_Submissions
          SET artifact_id = @artifact_id, updated_at = GETDATE()
          WHERE submission_id = @submission_id
        `);
    }

    executionId = await createExecution({
      submissionId: submission.submission_id,
      artifactId: artifactId || localArtifact?.artifact_id,
      environment,
      osProfile,
      networkEnabled: Boolean(networkEnabled),
      timeoutSeconds: Number(timeoutSeconds) || 120,
    });

    let verdict = null;
    let behaviorSummary = null;
    let warnings = [];

    if (vtData && fileReport?.data?.attributes) {
      behaviorSummary = await getBehaviorSummary(
        fileReport.data.attributes.sha256 || fileReport.data.id,
      );
      verdict = normalizeVerdict(fileReport);
      await storeBehaviorLogs(
        executionId,
        fileReport,
        behaviorSummary,
        verdict,
      );
      await updateExecution(executionId, "Completed");
    } else if (abuseData) {
      verdict = {
        stats: {
          malicious: localVerdict?.stats?.malicious || 1,
          suspicious: localVerdict?.stats?.suspicious || 0,
          harmless: 0,
          undetected: 0,
        },
        severity: localVerdict?.severity || "Medium",
        detectionRatio: `${localVerdict?.stats?.malicious || 1}/1`,
        reputation: null,
        suggestedThreatLabel:
          abuseData.malware_family ||
          localVerdict?.suggestedThreatLabel ||
          null,
        tags: abuseData.tags || localVerdict?.tags || [],
        lastAnalysisDate: abuseData.first_seen || null,
        source: "abuse.ch",
      };
      warnings = localVerdict?.riskFactors || [];
      await storeLocalLogs(executionId, abuseData, verdict, warnings);
      await updateExecution(
        executionId,
        "Completed",
        "Analyzed via threat intelligence feed",
      );
    } else if (localArtifact) {
      verdict = {
        stats: localVerdict?.stats || {
          malicious: 0,
          suspicious: 0,
          harmless: 0,
          undetected: 1,
        },
        severity: localVerdict?.severity || "Low",
        detectionRatio: localVerdict?.detectionRatio || "0/1",
        reputation: null,
        suggestedThreatLabel:
          localArtifact.malware_family ||
          localVerdict?.suggestedThreatLabel ||
          null,
        tags: localVerdict?.tags || [],
        lastAnalysisDate: localArtifact.upload_time || null,
        source: "static-analysis",
      };
      warnings = localVerdict?.riskFactors || [];
      await storeLocalLogs(executionId, null, verdict, warnings);
      await updateExecution(executionId, "Completed", "Static analysis only");
    }

    const notifierResult = await pool
      .request()
      .input("userId", sql.INT, req.user.userId)
      .query("SELECT username FROM Users WHERE user_id = @userId");

    await createNotification({
      userId: req.user.userId,
      type: "sandbox",
      message: `Sandbox analysis completed for "${submission.title}"`,
      actorUsername: notifierResult.recordset[0]?.username || "System",
      relatedSubmissionId: submission.submission_id,
    });

    invalidatePrefix(`sandbox:submissions:${req.user.userId}`);
    invalidatePrefix(`sandbox:executions:${req.user.userId}`);

    // Trigger AI Evaluation automatically
    try {
        const aiEvalResult = await performAiEvaluation(hash, { 
            fileReport, 
            behaviorSummary, 
            localAnalysis: {
                ...localVerdict,
                file_size: localArtifact?.file_size || abuseData?.file_size || 0
            }
        });
        await saveAiEvaluationInternal(submission.submission_id, aiEvalResult);
    } catch (aiErr) {
        console.error("Automated AI evaluation failed (non-blocking):", aiErr);
    }

    res.status(201).json({
      execution_id: executionId,
      submission_id: submission.submission_id,
      artifact_id: artifactId || localArtifact?.artifact_id,
      status: "Completed",
      verdict,
      warnings,
      file: localArtifact
        ? {
            name: localArtifact.file_name,
            sha256: localArtifact.sha256_hash,
            type: localArtifact.file_type,
            size: localArtifact.file_size,
          }
        : fileReport
          ? {
              name:
                fileReport.data.attributes.meaningful_name ||
                fileReport.data.attributes.names?.[0] ||
                null,
              sha256: fileReport.data.attributes.sha256 || fileReport.data.id,
              type: fileReport.data.attributes.type_description || null,
              size: fileReport.data.attributes.size || 0,
            }
          : abuseData
            ? {
                name: abuseData.file_name,
                sha256: abuseData.sha256_hash,
                type: abuseData.file_type,
                size: abuseData.file_size,
              }
            : null,
      behavior: behaviorSummary?.data || null,
    });
  } catch (error) {
    console.error("Sandbox evaluation failed:", error);
    if (executionId) {
      await updateExecution(executionId, "Failed", error.message);
    }

    res.status(error.statusCode || 500).json({
      error: error.message || "Sandbox evaluation failed",
      details: error.details,
    });
  }
};
