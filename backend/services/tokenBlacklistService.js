const blacklist = new Set();

const BLACKLIST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const addToBlacklist = (jti) => {
  blacklist.add(jti);
  setTimeout(() => blacklist.delete(jti), BLACKLIST_TTL_MS);
};

export const isBlacklisted = (jti) => {
  return blacklist.has(jti);
};
