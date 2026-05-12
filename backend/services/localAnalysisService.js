const SEVERITY_THRESHOLDS = {
  CRITICAL_FAMILIES: ['Dridex', 'TrickBot', 'Emotet', 'Ryuk', 'LockBit', 'Conti', 'REvil', 'BlackMatter', 'CobaltStrike'],
  HIGH_FAMILIES: ['AgentTesla', 'FormBook', 'Lokibot', 'RedLine', 'QakBot', 'IcedID', 'Bumblebee', 'Ursnif'],
  MEDIUM_FAMILIES: ['Remcos', 'NetWire', 'DarkComet', 'njRAT', 'AsyncRAT'],
};

const CRITICAL_EXTENSIONS = ['.exe', '.dll', '.scr', '.ps1', '.vbs', '.bat', '.cmd', '.js', '.vba', '.vbe', '.docm', '.xlsm', '.pptm'];
const HIGH_EXTENSIONS = ['.jar', '.msi', '.wsf', '.hta', '.ole', '.com', '.cpl', '.jse'];
const SUSPICIOUS_EXTENSIONS = ['.doc', '.xls', '.ppt', '.pdf', '.rtf', '.zip', '.rar', '.7z'];

const SUSPICIOUS_NAMES = ['invoice', 'payment', 'receipt', 'order', 'document', 'resume', 'cv', 'report', 'download', 'setup', 'install', 'update', 'crack', 'keygen', 'patch'];

export const analyzeLocally = (artifact) => {
  if (!artifact) return null;

  const fileName = (artifact.file_name || '').toLowerCase();
  const fileType = (artifact.file_type || '').toLowerCase();
  const malwareFamily = (artifact.malware_family || '');
  const malwareCategory = (artifact.malware_category || '');
  const extension = fileName.slice(fileName.lastIndexOf('.')) || '';

  let malicious = 0;
  let suspicious = 0;
  let harmless = 0;
  let undetected = 1;
  let severity = 'Low';
  let tags = [];
  let riskFactors = [];

  // Check malware family severity
  if (SEVERITY_THRESHOLDS.CRITICAL_FAMILIES.some(f => malwareFamily.includes(f))) {
    malicious += 8;
    severity = 'Critical';
    tags.push('family:known-threat');
    riskFactors.push(`Known malware family: ${malwareFamily}`);
  } else if (SEVERITY_THRESHOLDS.HIGH_FAMILIES.some(f => malwareFamily.includes(f))) {
    malicious += 5;
    severity = 'High';
    tags.push('family:known-threat');
    riskFactors.push(`Known malware family: ${malwareFamily}`);
  } else if (SEVERITY_THRESHOLDS.MEDIUM_FAMILIES.some(f => malwareFamily.includes(f))) {
    malicious += 3;
    severity = 'Medium';
    tags.push('family:known-threat');
  }

  // Check malware category
  const highThreatCategories = ['Ransomware', 'APT', 'Rootkit'];
  const medThreatCategories = ['Trojan', 'Worm', 'Spyware'];

  if (highThreatCategories.includes(malwareCategory)) {
    malicious += 5;
    if (severity === 'Low') severity = 'High';
    riskFactors.push(`High threat category: ${malwareCategory}`);
  } else if (medThreatCategories.includes(malwareCategory)) {
    malicious += 2;
    suspicious += 1;
    if (severity === 'Low') severity = 'Medium';
    riskFactors.push(`Threat category: ${malwareCategory}`);
  }

  // Check file extension
  if (CRITICAL_EXTENSIONS.includes(extension)) {
    malicious += 3;
    suspicious += 1;
    tags.push('executable');
    if (severity === 'Low') severity = 'Medium';
    riskFactors.push(`Executable extension: ${extension}`);
  } else if (HIGH_EXTENSIONS.includes(extension)) {
    suspicious += 3;
    tags.push('executable');
    riskFactors.push(`Suspicious extension: ${extension}`);
  } else if (SUSPICIOUS_EXTENSIONS.includes(extension)) {
    suspicious += 1;
    tags.push('document');
  }

  // Check file type hints
  if (fileType.includes('pe32') || fileType.includes('pe64') || fileType.includes('pe32+')) {
    malicious += 2;
    tags.push('pe-file');
    riskFactors.push('Windows PE executable');
  }
  if (fileType.includes('powershell') || fileType.includes('shell script')) {
    suspicious += 2;
    tags.push('script');
    riskFactors.push('Executable script');
  }

  // Check suspicious naming patterns
  for (const pattern of SUSPICIOUS_NAMES) {
    if (fileName.includes(pattern)) {
      suspicious += 1;
      tags.push('suspicious-name');
      riskFactors.push(`Suspicious filename pattern: "${pattern}"`);
      break;
    }
  }

  // Recalculate severity
  const totalScore = malicious + suspicious;
  if (totalScore >= 10) severity = 'Critical';
  else if (totalScore >= 5) severity = 'High';
  else if (totalScore >= 2) severity = 'Medium';

  // Build stats
  const stats = { malicious, suspicious, harmless, undetected };

  return {
    stats,
    severity,
    detectionRatio: `${malicious + suspicious}/${Object.values(stats).reduce((a, b) => a + b, 0)}`,
    reputation: null,
    suggestedThreatLabel: malwareFamily || riskFactors[0] || null,
    tags,
    lastAnalysisDate: null,
    riskFactors,
    source: 'static-analysis',
  };
};

export const getStaticWarnings = (artifact) => {
  if (!artifact) return [];
  const verdict = analyzeLocally(artifact);
  return verdict?.riskFactors || [];
};
