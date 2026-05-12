import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFileReport, getBehaviorSummary } from './virusTotalService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts features for the AI model from VirusTotal data.
 */
const extractFeatures = (fileReport, behaviorSummary) => {
    const attributes = fileReport?.data?.attributes || {};
    const stats = attributes.last_analysis_stats || {};
    const tags = attributes.tags || [];
    const behavior = behaviorSummary?.data || {};

    const malicious = Number(stats.malicious || 0);
    const suspicious = Number(stats.suspicious || 0);
    const harmless = Number(stats.harmless || 0);
    const undetected = Number(stats.undetected || 0);
    const total = malicious + suspicious + harmless + undetected + Number(stats.timeout || 0);

    const fileSize = attributes.size || 0;

    return {
        file_size: fileSize,
        file_size_log: Math.log1p(fileSize),
        malicious_count: malicious,
        suspicious_count: suspicious,
        undetected_count: undetected,
        detection_ratio: (malicious + suspicious) / (total || 1),
        tag_trojan: tags.includes('trojan') ? 1 : 0,
        tag_ransomware: tags.includes('ransomware') ? 1 : 0,
        tag_worm: tags.includes('worm') ? 1 : 0,
        tag_packed: tags.includes('packed') ? 1 : 0,
        tag_obfuscated: tags.includes('obfuscated') ? 1 : 0,
        tag_encrypted: tags.includes('encrypted') ? 1 : 0,
        contacted_domains: (behavior.contacted_domains || []).length,
        contacted_ips: (behavior.contacted_ips || []).length,
        sandbox_verdicts: Object.keys(behavior.sandbox_verdicts || {}).length
    };
};

/**
 * Calls the Python inference script.
 */
export const runInference = (features) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
            path.join(__dirname, 'aiInference.py'),
            JSON.stringify(features)
        ]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`AI Inference process exited with code ${code}`);
                console.error(`Stderr: ${stderr}`);
                return reject(new Error('AI Inference failed'));
            }

            try {
                const result = JSON.parse(stdout);
                if (result.status === 'success') {
                    resolve(result.predictions);
                } else {
                    reject(new Error(result.message || 'AI Inference failed'));
                }
            } catch (e) {
                console.error('Failed to parse AI Inference output:', stdout);
                reject(new Error('Failed to parse AI Inference output'));
            }
        });
    });
};

/**
 * Performs full AI evaluation for a given file hash.
 */
export const performAiEvaluation = async (hash) => {
    try {
        let fileReport;
        try {
            fileReport = await getFileReport(hash);
        } catch (error) {
            if (error.statusCode === 404) {
                throw new Error(`File hash ${hash} not found in VirusTotal. Please ensure the sample has been scanned on VirusTotal first to provide behavioral data for analysis.`);
            }
            throw error;
        }

        const behaviorSummary = await getBehaviorSummary(hash);

        const features = extractFeatures(fileReport, behaviorSummary);
        const predictions = await runInference(features);

        // Map predictions to meaningful labels
        // The model returns values between 0 and 1, so we scale them to 0-100
        const aiScore = Math.min(100, Math.max(0, predictions[0] * 100));
        const evasionScore = Math.min(100, Math.max(0, predictions[1] * 100));
        const impactScore = Math.min(100, Math.max(0, predictions[2] * 100));

        let threatLevel = 'Normal';
        if (aiScore > 80) threatLevel = 'Critical';
        else if (aiScore > 60) threatLevel = 'High';
        else if (aiScore > 40) threatLevel = 'Elevated';
        else if (aiScore > 20) threatLevel = 'Medium';

        return {
            aiScorePercentage: `${Math.round(aiScore)}%`,
            evasionScore: `${Math.round(evasionScore)}%`,
            impactScore: `${Math.round(impactScore)}%`,
            threatLevel,
            family: fileReport.data.attributes.popular_threat_classification?.suggested_threat_label || 'Unknown',
            summary: `Neural analysis identifies this sample as ${threatLevel.toLowerCase()} risk. ` +
                     `It shows a confidence level of ${Math.round(aiScore)}% in its malicious behavior patterns. ` +
                     `The evasion capability is rated at ${Math.round(evasionScore)}%, and potential impact at ${Math.round(impactScore)}%.`,
            date: new Date().toISOString().split('T')[0],
            features // Returning features might be useful for debugging
        };
    } catch (error) {
        console.error('AI Evaluation Service Error:', error);
        throw error;
    }
};
