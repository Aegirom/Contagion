import crypto from 'crypto';
import multer from 'multer';
import sql from 'mssql';
import pool from '../config/db.js';
import { createSignedR2DownloadUrl, uploadBufferToR2 } from '../services/r2Service.js';

const MAX_ARTIFACT_BYTES = 25 * 1024 * 1024;
const ALLOWED_CATEGORIES = new Set(['Ransomware', 'Trojan', 'Worm', 'APT', 'Rootkit', 'Spyware', 'Other']);

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ARTIFACT_BYTES,
    files: 1,
  },
});

let cachedSha1Column = null;

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

const sha = (algorithm, buffer) => crypto.createHash(algorithm).update(buffer).digest('hex');

const cleanFileName = (fileName) => String(fileName || 'artifact.bin')
  .replace(/[^\w.\-()+ ]/g, '_')
  .slice(0, 180);

const toCategory = (value) => (ALLOWED_CATEGORIES.has(value) ? value : 'Other');

const storageKeyFromPath = (storagePath) => {
  const match = /^r2:\/\/[^/]+\/(.+)$/.exec(storagePath || '');
  return match?.[1] || null;
};

export const uploadArtifact = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Artifact file is required' });
    }

    const md5 = sha('md5', req.file.buffer);
    const sha1 = sha('sha1', req.file.buffer);
    const sha256 = sha('sha256', req.file.buffer);
    const fileName = cleanFileName(req.file.originalname);
    const fileType = (req.file.mimetype || 'application/octet-stream').slice(0, 50);
    const malwareFamily = req.body.malware_family?.slice(0, 100) || null;
    const malwareCategory = toCategory(req.body.malware_category);

    const duplicate = await pool.request()
      .input('sha256_hash', sql.CHAR(64), sha256)
      .query(`
        SELECT artifact_id, file_name, file_size, file_type, md5_hash, sha256_hash, storage_path, malware_family, malware_category, upload_time
        FROM Malware_Artifacts
        WHERE sha256_hash = @sha256_hash
      `);

    if (duplicate.recordset[0]) {
      return res.status(200).json({
        artifact: duplicate.recordset[0],
        duplicate: true,
        message: 'Artifact already exists and was linked from quarantine storage',
      });
    }

    const r2Key = `artifacts/${req.user.userId}/${sha256}-${fileName}`;
    const r2Result = await uploadBufferToR2({
      buffer: req.file.buffer,
      key: r2Key,
      contentType: fileType,
    });

    const sha1Column = await getSha1Column();
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
        is_quarantined,
        malware_family,
        malware_category
      )
      OUTPUT INSERTED.artifact_id, INSERTED.file_name, INSERTED.file_size, INSERTED.file_type, INSERTED.md5_hash, INSERTED.sha256_hash, INSERTED.storage_path, INSERTED.malware_family, INSERTED.malware_category, INSERTED.upload_time
      VALUES (
        @uploader_id,
        @file_name,
        @file_size,
        @file_type,
        @md5_hash,
        @sha1_hash,
        @sha256_hash,
        @storage_path,
        1,
        @malware_family,
        @malware_category
      )
    `;

    const result = await pool.request()
      .input('uploader_id', sql.INT, req.user.userId)
      .input('file_name', sql.NVARCHAR(255), fileName)
      .input('file_size', sql.BIGINT, req.file.size)
      .input('file_type', sql.NVARCHAR(50), fileType)
      .input('md5_hash', sql.CHAR(32), md5)
      .input('sha1_hash', sql.CHAR(40), sha1)
      .input('sha256_hash', sql.CHAR(64), sha256)
      .input('storage_path', sql.NVARCHAR(500), r2Result.storagePath)
      .input('malware_family', sql.NVARCHAR(100), malwareFamily)
      .input('malware_category', sql.NVARCHAR(50), malwareCategory)
      .query(insertQuery);

    res.status(201).json({
      artifact: {
        ...result.recordset[0],
        sha1_hash: sha1,
        r2_etag: r2Result.etag,
      },
      duplicate: false,
      message: 'Artifact uploaded to quarantine storage',
    });
  } catch (error) {
    console.error('Artifact upload failed:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Artifact upload failed',
      details: error.details,
    });
  }
};

export const listArtifacts = async (req, res) => {
  try {
    const result = await pool.request()
      .input('user_id', sql.INT, req.user.userId)
      .query(`
        SELECT TOP 50
          artifact_id,
          file_name,
          file_size,
          file_type,
          md5_hash,
          sha256_hash,
          storage_path,
          is_quarantined,
          malware_family,
          malware_category,
          upload_time
        FROM Malware_Artifacts
        WHERE uploader_id = @user_id OR uploader_id IS NULL
        ORDER BY upload_time DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Failed to list artifacts:', error);
    res.status(500).json({ error: 'Failed to list artifacts' });
  }
};

export const getArtifact = async (req, res) => {
  try {
    const result = await pool.request()
      .input('artifact_id', sql.INT, Number(req.params.id))
      .input('user_id', sql.INT, req.user.userId)
      .query(`
        SELECT artifact_id, uploader_id, file_name, file_size, file_type, md5_hash, sha256_hash, storage_path, is_quarantined, malware_family, malware_category, upload_time
        FROM Malware_Artifacts
        WHERE artifact_id = @artifact_id
          AND (uploader_id = @user_id OR uploader_id IS NULL)
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Failed to get artifact:', error);
    res.status(500).json({ error: 'Failed to get artifact' });
  }
};

export const getArtifactDownload = async (req, res) => {
  try {
    const result = await pool.request()
      .input('artifact_id', sql.INT, Number(req.params.id))
      .input('user_id', sql.INT, req.user.userId)
      .query(`
        SELECT storage_path
        FROM Malware_Artifacts
        WHERE artifact_id = @artifact_id
          AND (uploader_id = @user_id OR uploader_id IS NULL)
      `);

    const artifact = result.recordset[0];
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    const key = storageKeyFromPath(artifact.storage_path);
    if (!key) {
      return res.status(409).json({ error: 'Artifact is not stored in R2' });
    }

    res.json({
      url: createSignedR2DownloadUrl({ key, expiresSeconds: 300 }),
      expires_in: 300,
    });
  } catch (error) {
    console.error('Failed to create artifact download URL:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create download URL' });
  }
};
