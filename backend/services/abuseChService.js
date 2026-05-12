const MALWAREBAZAAR_URL = 'https://mb-api.abuse.ch/api/v1/';

const getApiKey = () => {
  const key = process.env.ABUSECH_API_KEY;
  if (!key) return null;
  return key;
};

export const lookupHash = async (hash) => {
  const apiKey = getApiKey();
  const body = new URLSearchParams({ query: 'get_info', hash });
  if (apiKey) body.set('key', apiKey);

  const response = await fetch(MALWAREBAZAAR_URL, {
    method: 'POST',
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (payload.query_status === 'hash_not_found') return null;
  if (payload.query_status !== 'ok') return null;

  const entry = payload.data?.[0];
  if (!entry) return null;

  return {
    sha256_hash: entry.sha256_hash,
    md5_hash: entry.md5_hash,
    sha1_hash: entry.sha1_hash,
    file_name: entry.file_name,
    file_type: entry.file_type,
    file_size: entry.file_size,
    malware_family: entry.signature || null,
    malware_category: entry.tags?.find(t => ['Ransomware', 'Trojan', 'Worm', 'APT', 'Rootkit', 'Spyware'].includes(t)) || null,
    tags: entry.tags || [],
    first_seen: entry.first_seen,
    delivery_method: entry.delivery_method || null,
    vendor_intel: entry.intel_feed || null,
    confidence: entry.confidence_level || null,
    signatures: entry.signature ? [entry.signature] : [],
    source: 'abuse.ch',
  };
};
