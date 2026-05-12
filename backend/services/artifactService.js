import pool from '../config/db.js';

let cachedSha1Column = null;

export const getSha1Column = async () => {
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
