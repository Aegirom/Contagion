-- ============================================================
-- Contagion Stored Procedures and Transaction Helpers
-- Target: Azure SQL Database / T-SQL
-- Run in DBeaver or Azure Data Studio.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create a submission atomically and return submission_id.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_CreateAnalysisSubmission
    @author_id INT,
    @artifact_id INT = NULL,
    @title NVARCHAR(255),
    @content NVARCHAR(MAX),
    @status NVARCHAR(20) = N'Draft',
    @version INT = 1,
    @template_type NVARCHAR(50) = N'MALWARE_ANALYSIS'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @status NOT IN (N'Draft', N'Pending', N'Published', N'Rejected', N'Archived')
        THROW 51000, 'Invalid submission status.', 1;

    BEGIN TRANSACTION;

    INSERT INTO dbo.Analysis_Submissions (
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
        ISNULL(@version, 1),
        @template_type
    );

    COMMIT TRANSACTION;
END;
GO

-- ------------------------------------------------------------
-- 2. Archive a submission instead of physically deleting it.
--    This preserves FK-linked sandbox executions/logs.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_ArchiveSubmission
    @submission_id INT,
    @author_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    UPDATE dbo.Analysis_Submissions
    SET status = N'Archived',
        updated_at = GETDATE()
    OUTPUT INSERTED.submission_id, INSERTED.status
    WHERE submission_id = @submission_id
      AND author_id = @author_id
      AND status <> N'Archived';

    IF @@ROWCOUNT = 0
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 51001, 'Submission not found, not owned by user, or already archived.', 1;
    END;

    COMMIT TRANSACTION;
END;
GO

-- ------------------------------------------------------------
-- 3. Create a sandbox execution row in Queued state.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_QueueSandboxExecution
    @submission_id INT,
    @artifact_id INT,
    @environment NVARCHAR(30) = N'Docker',
    @os_profile NVARCHAR(50) = N'Windows10',
    @network_enabled BIT = 0,
    @timeout_seconds INT = 120
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @environment NOT IN (N'Docker', N'VirtualBox', N'KVM')
        THROW 51002, 'Invalid sandbox environment.', 1;

    BEGIN TRANSACTION;

    INSERT INTO dbo.Sandbox_Executions (
        submission_id,
        artifact_id,
        environment,
        os_profile,
        status,
        network_enabled,
        timeout_seconds
    )
    OUTPUT INSERTED.execution_id
    VALUES (
        @submission_id,
        @artifact_id,
        @environment,
        @os_profile,
        N'Queued',
        @network_enabled,
        @timeout_seconds
    );

    COMMIT TRANSACTION;
END;
GO

-- ------------------------------------------------------------
-- 4. Start a queued/running sandbox execution.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_StartSandboxExecution
    @execution_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    UPDATE dbo.Sandbox_Executions
    SET status = N'Running',
        started_at = ISNULL(started_at, GETDATE()),
        error_message = NULL
    OUTPUT INSERTED.execution_id, INSERTED.status, INSERTED.started_at
    WHERE execution_id = @execution_id
      AND status IN (N'Queued', N'Running');

    IF @@ROWCOUNT = 0
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 51003, 'Sandbox execution not found or cannot be started.', 1;
    END;

    COMMIT TRANSACTION;
END;
GO

-- ------------------------------------------------------------
-- 5. Insert one behavioral log safely.
--    Use this from backend loops if stored procedures are adopted.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_AddBehavioralLog
    @execution_id INT,
    @log_type NVARCHAR(30),
    @log_data NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @log_type NOT IN (N'API_Call', N'File_System', N'Registry', N'Network', N'Process', N'Memory', N'Screenshot')
        THROW 51004, 'Invalid behavioral log type.', 1;

    BEGIN TRANSACTION;

    INSERT INTO dbo.Behavioral_Logs (
        execution_id,
        log_type,
        log_data
    )
    VALUES (
        @execution_id,
        @log_type,
        @log_data
    );

    COMMIT TRANSACTION;
END;
GO

-- ------------------------------------------------------------
-- 6. Finish sandbox execution consistently.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_FinishSandboxExecution
    @execution_id INT,
    @status NVARCHAR(20),
    @error_message NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @status NOT IN (N'Completed', N'Failed', N'Timeout')
        THROW 51005, 'Invalid final sandbox status.', 1;

    BEGIN TRANSACTION;

    UPDATE dbo.Sandbox_Executions
    SET status = @status,
        finished_at = GETDATE(),
        error_message = @error_message
    OUTPUT INSERTED.execution_id, INSERTED.status, INSERTED.finished_at
    WHERE execution_id = @execution_id;

    IF @@ROWCOUNT = 0
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 51006, 'Sandbox execution not found.', 1;
    END;

    COMMIT TRANSACTION;
END;
GO

