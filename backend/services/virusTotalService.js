const VIRUSTOTAL_BASE_URL = 'https://www.virustotal.com/api/v3';

const getApiKey = () => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    const error = new Error('VirusTotal API key is not configured');
    error.statusCode = 500;
    throw error;
  }
  return apiKey;
};

const virustotalFetch = async (path) => {
  const response = await fetch(`${VIRUSTOTAL_BASE_URL}${path}`, {
    headers: {
      accept: 'application/json',
      'x-apikey': getApiKey(),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'VirusTotal request failed');
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
};

export const getFileReport = (hash) => virustotalFetch(`/files/${encodeURIComponent(hash)}`);

export const getBehaviorSummary = async (hash) => {
  try {
    return await virustotalFetch(`/files/${encodeURIComponent(hash)}/behaviour_summary`);
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 403) {
      return null;
    }
    throw error;
  }
};

export const normalizeVerdict = (fileReport) => {
  const attributes = fileReport?.data?.attributes || {};
  const stats = attributes.last_analysis_stats || {};
  const malicious = Number(stats.malicious || 0);
  const suspicious = Number(stats.suspicious || 0);
  const harmless = Number(stats.harmless || 0);
  const undetected = Number(stats.undetected || 0);
  const total = malicious + suspicious + harmless + undetected + Number(stats.timeout || 0);

  let severity = 'Low';
  if (malicious >= 10 || suspicious >= 10) severity = 'Critical';
  else if (malicious >= 5 || suspicious >= 5) severity = 'High';
  else if (malicious > 0 || suspicious > 0) severity = 'Medium';

  return {
    stats,
    severity,
    detectionRatio: `${malicious + suspicious}/${total || 0}`,
    reputation: attributes.reputation ?? null,
    suggestedThreatLabel: attributes.popular_threat_classification?.suggested_threat_label || null,
    tags: attributes.tags || [],
    lastAnalysisDate: attributes.last_analysis_date || null,
  };
};
