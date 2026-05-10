// aiEvaluationService.js

// This service layer manages AI evaluation data
import { getAiEvaluation, triggerAiEvaluation } from './api';

/**
 * Fetch evaluation for a specific submission.
 */
export const fetchEvaluations = async (submissionId) => {
    try {
        const response = await getAiEvaluation(submissionId);
        return response.data;
    } catch (error) {
        console.error('Error fetching evaluation:', error);
        throw error;
    }
};

/**
 * Trigger a new AI evaluation.
 */
export const addEvaluation = async (submissionId) => {
    try {
        const response = await triggerAiEvaluation(submissionId);
        return response.data;
    } catch (error) {
        console.error('Error triggering AI evaluation:', error);
        throw error;
    }
};

// Update and Delete are not currently supported by the backend for AI evaluations
// as they are automated results.
