const store = new Map();

export const TTL = {
  DEFAULT: 30000,
  LEADERBOARD: 60000,
  SUBMISSIONS_FEED: 15000,
  SUBMISSION_OVERVIEW: 10000,
  DASHBOARD: 15000,
  ADMIN_STATS: 30000,
  NOTIFICATIONS: 10000,
  PROFILE: 60000,
  ARTIFACTS: 30000,
};

const getTTL = (url) => {
  if (url.includes("/leaderboard")) return TTL.LEADERBOARD;
  if (url.includes("/overview")) return TTL.SUBMISSION_OVERVIEW;
  if (url.includes("/submissions/get")) return TTL.SUBMISSIONS_FEED;
  if (url.includes("/dashboard")) return TTL.DASHBOARD;
  if (url.includes("/admin/stats")) return TTL.ADMIN_STATS;
  if (url.includes("/notifications")) return TTL.NOTIFICATIONS;
  if (url.includes("/auth/profile") || url.includes("/auth/me"))
    return TTL.PROFILE;
  if (url.includes("/artifacts")) return TTL.ARTIFACTS;
  return TTL.DEFAULT;
};

const cacheKey = (config) => {
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${config.method}:${config.url}:${params}`;
};

export const get = (config) => {
  const key = cacheKey(config);
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiry < Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.data;
};

export const set = (config, data) => {
  const key = cacheKey(config);
  store.set(key, {
    data,
    expiry: Date.now() + getTTL(config.url),
  });
};

export const bust = (url) => {
  const normalized = url.split("?")[0];
  for (const key of store.keys()) {
    if (key.includes(normalized)) {
      store.delete(key);
    }
  }
};

export const clear = () => store.clear();
