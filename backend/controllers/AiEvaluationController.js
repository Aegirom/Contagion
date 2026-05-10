import sql from 'mssql';
import pool from '../config/db.js';
import { performAiEvaluation } from '../services/aiEvaluationService.js';

/**
 * Ensures the AI_Evaluations table exists.
 */
const ensureTableExists = async () => {
    try {
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AI_Evaluations]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[AI_Evaluations] (
                    [evaluation_id] INT IDENTITY(1,1) PRIMARY KEY,
                    [submission_id] INT NOT NULL,
                    [ai_score_percentage] NVARCHAR(10),
                    [evasion_score] NVARCHAR(10),
                    [impact_score] NVARCHAR(10),
                    [threat_level] NVARCHAR(20),
                    [family] NVARCHAR(100),
                    [summary] NVARCHAR(MAX),
                    [evaluation_date] DATETIME DEFAULT GETDATE(),
                    [features_json] NVARCHAR(MAX),
                    CONSTRAINT FK_AI_Evaluations_Submission FOREIGN KEY (submission_id) REFERENCES Analysis_Submissions(submission_id) ON DELETE CASCADE
                )
            END
        `);
    } catch (err) {
        console.error('Failed to ensure AI_Evaluations table exists:', err);
    }
};

export const getAiEvaluation = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const result = await pool.request()
            .input('submission_id', sql.INT, submissionId)
            .query(`
                SELECT TOP 1 * FROM AI_Evaluations 
                WHERE submission_id = @submission_id 
                ORDER BY evaluation_date DESC
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'AI Evaluation not found for this submission' });
        }

        const evalData = result.recordset[0];
        res.json({
            id: evalData.evaluation_id,
            submissionId: evalData.submission_id,
            aiScorePercentage: evalData.ai_score_percentage,
            evasionScore: evalData.evasion_score,
            impactScore: evalData.impact_score,
            threatLevel: evalData.threat_level,
            family: evalData.family,
            summary: evalData.summary,
            date: evalData.evaluation_date.toISOString().split('T')[0]
        });
    } catch (err) {
        console.error('Failed to fetch AI evaluation:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const triggerAiEvaluation = async (req, res) => {
    try {
        const { submissionId } = req.params;

        // 1. Get submission and its hash
        const subResult = await pool.request()
            .input('submission_id', sql.INT, submissionId)
            .query(`
                SELECT s.submission_id, a.sha256_hash, a.md5_hash
                FROM Analysis_Submissions s
                LEFT JOIN Malware_Artifacts a ON a.artifact_id = s.artifact_id
                WHERE s.submission_id = @submission_id
            `);

        const submission = subResult.recordset[0];
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const hash = submission.sha256_hash || submission.md5_hash;
        if (!hash) {
            return res.status(400).json({ error: 'Submission has no associated artifact or hash' });
        }

        // 2. Perform AI Evaluation
        const evalResult = await performAiEvaluation(hash);

        // 3. Store result in DB
        await ensureTableExists();
        await pool.request()
            .input('submission_id', sql.INT, submissionId)
            .input('ai_score', sql.NVARCHAR(10), evalResult.aiScorePercentage)
            .input('evasion_score', sql.NVARCHAR(10), evalResult.evasionScore)
            .input('impact_score', sql.NVARCHAR(10), evalResult.impactScore)
            .input('threat_level', sql.NVARCHAR(20), evalResult.threatLevel)
            .input('family', sql.NVARCHAR(100), evalResult.family)
            .input('summary', sql.NVARCHAR(sql.MAX), evalResult.summary)
            .input('features', sql.NVARCHAR(sql.MAX), JSON.stringify(evalResult.features))
            .query(`
                INSERT INTO AI_Evaluations (
                    submission_id, ai_score_percentage, evasion_score, impact_score, 
                    threat_level, family, summary, features_json
                )
                VALUES (
                    @submission_id, @ai_score, @evasion_score, @impact_score, 
                    @threat_level, @family, @summary, @features
                )
            `);

        res.status(201).json(evalResult);
    } catch (err) {
        console.error('Failed to trigger AI evaluation:', err);
        res.status(500).json({ 
            error: 'AI Evaluation failed', 
            details: err.message 
        });
    }
};
