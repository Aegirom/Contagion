import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFileReport, getBehaviorSummary } from './virusTotalService.js';
import { lookupHash } from './abuseChService.js';
import { analyzeLocally } from './localAnalysisService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts features for the AI model from either VirusTotal, Abuse.ch, or local analysis data.
 */
export const extractFeatures = (fileReport, behaviorSummary, localAnalysis = null, abuseData = null) => {
    const attributes = fileReport?.data?.attributes || {};
    const stats = attributes.last_analysis_stats || localAnalysis?.stats || {};
    const tags = [
        ...(attributes.tags || []), 
        ...(localAnalysis?.tags || []),
        ...(abuseData?.tags || [])
    ];
    
    // Normalize tags to unique lowercase strings
    const uniqueTags = [...new Set(tags.map(t => String(t).toLowerCase()))];

    // Behavior can come from VT or we can mock it from Abuse signatures
    const behavior = behaviorSummary?.data || behaviorSummary || {};
    const contactedDomains = behavior.contacted_domains || [];
    const contactedIps = behavior.contacted_ips || [];
    const sandboxVerdicts = behavior.sandbox_verdicts || (localAnalysis ? { "LocalAnalysis": { "verdict": localAnalysis.severity } } : {});

    const malicious = Number(stats.malicious || 0);
    const suspicious = Number(stats.suspicious || 0);
    const harmless = Number(stats.harmless || 0);
    const undetected = Number(stats.undetected || 0);
    const total = malicious + suspicious + harmless + undetected + Number(stats.timeout || 0);

    const fileSize = attributes.size || localAnalysis?.file_size || abuseData?.file_size || 0;

    return {
        file_size: fileSize,
        file_size_log: Math.log1p(fileSize),
        malicious_count: malicious,
        suspicious_count: suspicious,
        undetected_count: undetected,
        detection_ratio: (malicious + suspicious) / (total || 1),
        tag_trojan: uniqueTags.some(t => t.includes('trojan')) ? 1 : 0,
        tag_ransomware: uniqueTags.some(t => t.includes('ransomware')) ? 1 : 0,
        tag_worm: uniqueTags.some(t => t.includes('worm')) ? 1 : 0,
        tag_packed: uniqueTags.some(t => t.includes('packed')) ? 1 : 0,
        tag_obfuscated: uniqueTags.some(t => t.includes('obfuscated')) ? 1 : 0,
        tag_encrypted: uniqueTags.some(t => t.includes('encrypted')) ? 1 : 0,
        contacted_domains: contactedDomains.length,
        contacted_ips: contactedIps.length,
        sandbox_verdicts: Object.keys(sandboxVerdicts).length
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
 * Performs full AI evaluation for a given file hash, using pre-fetched data if available.
 */
export const performAiEvaluation = async (hash, preFetched = {}) => {
    try {
        let { fileReport, behaviorSummary, localAnalysis, abuseData } = preFetched;

        if (!fileReport && hash) {
            try {
                fileReport = await getFileReport(hash);
            } catch (error) {
                if (error.statusCode !== 404) throw error;
            }
        }

        if (!behaviorSummary && hash && fileReport) {
            behaviorSummary = await getBehaviorSummary(hash);
        }

        if (!abuseData && hash) {
            abuseData = await lookupHash(hash);
        }

        if (!fileReport && !localAnalysis && !abuseData) {
            throw new Error(`Insufficient data for AI Evaluation of hash ${hash}. No VirusTotal report, local analysis, or threat intel available.`);
        }

        const features = extractFeatures(fileReport, behaviorSummary, localAnalysis, abuseData);
        const predictions = await runInference(features);

        // Map predictions to meaningful labels
        const aiScore = Math.min(100, Math.max(0, predictions[0] * 100));
        const evasionScore = Math.min(100, Math.max(0, predictions[1] * 100));
        const impactScore = Math.min(100, Math.max(0, predictions[2] * 100));

        let threatLevel = 'Normal';
        if (aiScore > 80) threatLevel = 'Critical';
        else if (aiScore > 60) threatLevel = 'High';
        else if (aiScore > 40) threatLevel = 'Elevated';
        else if (aiScore > 20) threatLevel = 'Medium';

        const family = fileReport?.data?.attributes?.popular_threat_classification?.suggested_threat_label 
                    || localAnalysis?.suggestedThreatLabel 
                    || 'Unknown';

        return {
            aiScorePercentage: `${Math.round(aiScore)}%`,
            evasionScore: `${Math.round(evasionScore)}%`,
            impactScore: `${Math.round(impactScore)}%`,
            threatLevel,
            family,
            summary: `Neural analysis identifies this sample as ${threatLevel.toLowerCase()} risk. ` +
                     `It shows a confidence level of ${Math.round(aiScore)}% in its malicious behavior patterns. ` +
                     `The evasion capability is rated at ${Math.round(evasionScore)}%, and potential impact at ${Math.round(impactScore)}%.`,
            date: new Date().toISOString().split('T')[0],
            features,
            localAnalysis,
            abuseData
        };
    } catch (error) {
        console.error('AI Evaluation Service Error:', error);
        throw error;
    }
};

