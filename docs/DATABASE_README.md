# Contagion Database Queries and Integrity Notes

This document explains the database queries currently used by the Contagion backend, how they relate to the schema, and why the foreign keys, constraints, and transactional patterns are used.

The current backend uses Azure SQL through the `mssql` driver. The project documentation mentions Azure MySQL in places, but the implemented schema and code use T-SQL features such as `IDENTITY`, `DATETIME2`, `GETDATE()`, `OUTPUT INSERTED`, `OUTER APPLY`, and `FOR JSON PATH`.

## Main Tables

`Users`
: Owns analyst accounts. Other tables reference `Users.user_id`.

`User_Profiles`
: One profile per user. `ON DELETE CASCADE` is appropriate because profiles have no meaning without their account.

`Malware_Artifacts`
: Stores metadata for uploaded files and R2 object paths. The actual file is stored in Cloudflare R2; the DB stores hashes, file metadata, quarantine status, and classification.

`Analysis_Submissions`
: Stores analyst reports. It links a report to the author and optionally to one malware artifact.

`Sandbox_Executions`
: Stores sandbox run metadata for a submission/artifact pair.

`Behavioral_Logs`
: Stores JSON behavioral logs linked to a sandbox execution.

`AI_Evaluations` and `Peer_Reviews`
: Store later evaluation/review workflows.

## Foreign Keys

### `User_Profiles.user_id -> Users.user_id`

Uses `ON DELETE CASCADE`.

Reason: profile rows should be removed automatically when a user account is deleted. This avoids orphan profile data.

### `Malware_Artifacts.uploader_id -> Users.user_id`

Uses `ON DELETE SET NULL`.

Reason: uploaded malware artifacts are security research records. If a user is removed, the artifact record may still be needed for submissions, sandbox history, or auditing. Setting the uploader to `NULL` preserves artifact integrity without retaining a hard dependency on the deleted user.

### `Analysis_Submissions.author_id -> Users.user_id`

Uses `ON DELETE CASCADE`.

Reason: submissions are authored content. If a user is deleted, their submissions can be deleted with the account. In the application UI, we currently archive submissions instead of physically deleting them.

### `Analysis_Submissions.artifact_id -> Malware_Artifacts.artifact_id`

Uses `ON DELETE SET NULL`.

Reason: a report can still exist even if the linked artifact is removed. The report content is preserved, but the artifact reference becomes `NULL`.

### `Sandbox_Executions.submission_id -> Analysis_Submissions.submission_id`

Uses `ON DELETE CASCADE`.

Reason: sandbox executions belong to a specific submission. If a submission is physically deleted, its execution history should be removed too.

### `Sandbox_Executions.artifact_id -> Malware_Artifacts.artifact_id`

Uses `ON DELETE NO ACTION`.

Reason: an execution record must always refer to the exact artifact it ran against. Deleting an artifact with existing execution history is blocked to preserve forensic traceability.

### `Behavioral_Logs.execution_id -> Sandbox_Executions.execution_id`

Uses `ON DELETE CASCADE`.

Reason: logs are child records of one sandbox execution. If the execution is deleted, logs should be deleted as well.

### `AI_Evaluations.submission_id -> Analysis_Submissions.submission_id`

Uses `ON DELETE CASCADE`.

Reason: an AI evaluation only makes sense for its submission.

### `Peer_Reviews.submission_id` and `Peer_Reviews.reviewer_id`

Use `ON DELETE NO ACTION`.

Reason: peer reviews are accountability records. Deleting a reviewed submission or reviewer should not silently remove review history.

## Constraints

### Role and expertise constraints

`Users.role` is limited to:

```sql
'Administrator', 'Moderator', 'Analyst', 'Observer'
```

`Users.expertise_level` is limited to:

```sql
'Beginner', 'Intermediate', 'Advanced', 'Expert'
```

Reason: these values drive authorization and UI display. A `CHECK` constraint prevents typo values from entering the database.

### Malware category constraint

`Malware_Artifacts.malware_category` is limited to:

```sql
'Ransomware', 'Trojan', 'Worm', 'APT', 'Rootkit', 'Spyware', 'Other'
```

Reason: the frontend filters and threat severity mapping depend on a known category set.

### Submission status constraint

`Analysis_Submissions.status` is limited to:

```sql
'Draft', 'Pending', 'Published', 'Rejected', 'Archived'
```

Reason: the application archives submissions instead of deleting them directly. `Archived` keeps linked records intact while hiding rows from active feed/dashboard lists.

### Sandbox status/environment constraints

`Sandbox_Executions.environment` is limited to:

```sql
'Docker', 'VirtualBox', 'KVM'
```

`Sandbox_Executions.status` is limited to:

```sql
'Queued', 'Running', 'Completed', 'Failed', 'Timeout'
```

Reason: sandbox orchestration expects predictable values for execution lifecycle and environment.

### Behavioral log type constraint

`Behavioral_Logs.log_type` is limited to:

```sql
'API_Call', 'File_System', 'Registry', 'Network', 'Process', 'Memory', 'Screenshot'
```

Reason: the report UI groups and summarizes logs by known categories.

## Important Backend Queries

### Feed query

Used by `GET /submissions/get`.

Purpose: fetch active submissions for the feed with user, artifact, and latest sandbox status.

Key query features:

```sql
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
  latest.finished_at AS sandbox_finished_at
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
WHERE s.status <> 'Archived'
ORDER BY s.updated_at DESC;
```

Why `OUTER APPLY` is used:

`OUTER APPLY` lets the query attach only the newest sandbox execution to each submission. A normal join would return one row per execution and duplicate feed cards.

### My submissions query

Used by `GET /submissions/mine`.

Purpose: fetch active submissions for the authenticated user. It uses the same latest-sandbox pattern as the feed query, but filters by `author_id`.

Important predicate:

```sql
WHERE s.author_id = @user_id
  AND s.status <> 'Archived'
```

Why archived rows are filtered:

The delete button archives rows. This preserves audit/sandbox relationships while removing the item from active UI lists.

### Submission detail query

Used by `GET /submissions/:id`.

Purpose: fetch one report with artifact metadata and all behavioral logs.

Important access rule:

```sql
WHERE s.submission_id = @submission_id
  AND (s.author_id = @user_id OR s.status = 'Published')
```

Reason: private drafts/pending reports are visible only to their author. Published reports are visible to authenticated users.

Important log aggregation:

```sql
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
```

Why `FOR JSON PATH` is used:

It returns logs as one JSON array per submission, avoiding duplicate parent report rows.

### Create submission query

Used by `POST /submissions/post`.

```sql
INSERT INTO Analysis_Submissions (
  author_id,
  artifact_id,
  title,
  content,
  status,
  version,
  template_type
)
OUTPUT INSERTED.submission_id
VALUES (
  @author_id,
  @artifact_id,
  @title,
  @content,
  @status,
  @version,
  @template_type
);
```

Why `OUTPUT INSERTED.submission_id` is used:

The frontend redirects to the newly created report and optionally starts sandbox evaluation using this ID.

### Archive submission query

Used by `DELETE /submissions/:id`.

```sql
UPDATE Analysis_Submissions
SET status = 'Archived',
    updated_at = GETDATE()
OUTPUT INSERTED.submission_id, INSERTED.status
WHERE submission_id = @submission_id
  AND author_id = @user_id
  AND status <> 'Archived';
```

Why archive instead of physical delete:

Physical delete would cascade to sandbox executions and behavioral logs because of foreign keys. Archiving keeps the forensic trail and avoids breaking report/artifact history.

### Upload artifact query

Used by `POST /artifacts/upload`.

Flow:

1. Receive file with `multer`.
2. Hash the file in Node.js: MD5, SHA1, SHA256.
3. Check for duplicate artifact by SHA256.
4. Upload file to Cloudflare R2 quarantine storage.
5. Insert metadata into `Malware_Artifacts`.

Duplicate check:

```sql
SELECT artifact_id, file_name, file_size, file_type, md5_hash, sha256_hash,
       storage_path, malware_family, malware_category, upload_time
FROM Malware_Artifacts
WHERE sha256_hash = @sha256_hash;
```

Why SHA256 is used for duplicate detection:

SHA256 is collision-resistant enough for practical malware artifact identity and avoids storing duplicate samples.

Insert:

```sql
INSERT INTO Malware_Artifacts (
  uploader_id,
  file_name,
  file_size,
  file_type,
  md5_hash,
  sha1_hash,
  sha256_hash,
  storage_path,
  is_quarantined,
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
  1,
  @malware_family,
  @malware_category
);
```

Why `is_quarantined = 1`:

Uploaded files are malware research artifacts. They should be treated as quarantined by default.

### Sandbox execution query

Used by sandbox evaluation.

Create execution:

```sql
INSERT INTO Sandbox_Executions (
  submission_id,
  artifact_id,
  environment,
  os_profile,
  status,
  network_enabled,
  timeout_seconds,
  started_at
)
OUTPUT INSERTED.execution_id
VALUES (
  @submission_id,
  @artifact_id,
  @environment,
  @os_profile,
  'Running',
  @network_enabled,
  @timeout_seconds,
  GETDATE()
);
```

Insert behavioral logs:

```sql
INSERT INTO Behavioral_Logs (execution_id, log_type, log_data)
VALUES (@execution_id, @log_type, @log_data);
```

Finish execution:

```sql
UPDATE Sandbox_Executions
SET status = @status,
    finished_at = GETDATE(),
    error_message = @error_message
WHERE execution_id = @execution_id;
```

Why this should be transactional:

Execution status and logs should be consistent. If logs fail to insert after the execution row is created, the execution should be marked failed or rolled back. See `database/procedures.sql` for transaction-based stored procedure options.

## Recommended Procedures and Transactions

Stored procedures are optional for this project because the backend already uses parameterized SQL queries. They are still useful for operations that must be atomic:

1. Create a submission and return the ID.
2. Archive a submission by owner.
3. Create sandbox execution, insert logs, and mark completion/failure consistently.

The SQL script is in:

```text
database/procedures.sql
```

Run it in DBeaver or Azure Data Studio against the Contagion Azure SQL database.

## Security Notes

- All backend queries use parameterized inputs through `mssql`.
- File uploads are not served from the Node process directly. Files are uploaded to Cloudflare R2 and the database stores only metadata plus the R2 object path.
- Download access should use signed URLs and authenticated backend checks.
- The VirusTotal API key and R2 credentials must stay in `backend/.env`, not frontend code.
- `Archived` is used for user-facing deletes so the platform keeps forensic data and avoids accidental cascade deletion.
