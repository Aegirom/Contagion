const store = new Map();

const TTL = {
  VIRUSTOTAL_REPORT: 3600,
  VIRUSTOTAL_BEHAVIOR: 3600,
  ABUSECH_LOOKUP: 3600,
  SUBMISSIONS_FEED: 30,
  SUBMISSION_OVERVIEW: 15,
  LEADERBOARD: 60,
  USER_POSITION: 60,
  ACTIVITY_FEED: 30,
  ANALYST_REPUTATION: 30,
  ADMIN_STATS: 60,
  ALL_USERS: 30,
  SANDBOX_SUBMISSIONS: 30,
  EXECUTIONS_LIST: 30,
};

export const get = (key) => {
  const item = store.get(key);
  if (!item) return null;
  if (item.expiry < Date.now()) {
    store.delete(key);
    return null;
  }
  return item.value;
};

export const set = (key, value, ttlSeconds) => {
  store.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
};

export const del = (key) => {
  store.delete(key);
};

export const clear = () => {
  store.clear();
};

export const invalidatePrefix = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
};

export { TTL };
