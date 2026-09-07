const TOKEN_REFRESH_INTERVAL_DAYS = Number(process.env.FB_TOKEN_REFRESH_INTERVAL_DAYS) || 7;
const TOKEN_REFRESH_AFTER_DAYS = Number(process.env.FB_TOKEN_REFRESH_AFTER_DAYS) || 45;
const TOKEN_REFRESH_CRON_MAX_DAYS = Number(process.env.FB_TOKEN_REFRESH_CRON_MAX_DAYS) || 60;
const TOKEN_REFRESH_EXPIRY_BUFFER_DAYS = Number(process.env.FB_TOKEN_REFRESH_EXPIRY_BUFFER_DAYS) || 20;
const TOKEN_REFRESH_PUBLISH_BUFFER_DAYS = Number(process.env.FB_TOKEN_REFRESH_PUBLISH_BUFFER_DAYS) || 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getReferenceDate = (tokenIssuedAt, createdAt) => {
  const ref = tokenIssuedAt || createdAt;
  return ref ? new Date(ref) : null;
};

const getDaysSinceIssued = (tokenIssuedAt, createdAt) => {
  const ref = getReferenceDate(tokenIssuedAt, createdAt);
  if (!ref) return 0;
  return Math.floor((Date.now() - ref.getTime()) / MS_PER_DAY);
};

/**
 * @returns {"healthy" | "refresh_due" | "cron_expired"}
 * - healthy: token younger than 45 days (cron still refreshes from day 7)
 * - refresh_due: 45–59 days — cron missed earlier refreshes, manual refresh available
 * - cron_expired: 60+ days — Meta cannot extend an expired token; reconnect required
 */
const getTokenRefreshStatus = (tokenIssuedAt, createdAt) => {
  const days = getDaysSinceIssued(tokenIssuedAt, createdAt);
  if (days < TOKEN_REFRESH_AFTER_DAYS) return "healthy";
  if (days < TOKEN_REFRESH_CRON_MAX_DAYS) return "refresh_due";
  return "cron_expired";
};

const isTokenExpiringSoon = (tokenExpiresAt, bufferDays = TOKEN_REFRESH_EXPIRY_BUFFER_DAYS) => {
  if (!tokenExpiresAt) return false;
  const expires = new Date(tokenExpiresAt).getTime();
  if (Number.isNaN(expires)) return false;
  const remaining = expires - Date.now();
  return remaining > 0 && remaining <= bufferDays * MS_PER_DAY;
};

const isWithinTokenCronLifetime = (tokenIssuedAt, createdAt) => {
  return getDaysSinceIssued(tokenIssuedAt, createdAt) < TOKEN_REFRESH_CRON_MAX_DAYS;
};

/** Cron refreshes from day 7 until day 60 so tokens never sit idle until expiry. */
const isCronRefreshEligible = (tokenIssuedAt, createdAt, tokenExpiresAt) => {
  if (!isWithinTokenCronLifetime(tokenIssuedAt, createdAt)) return false;
  const days = getDaysSinceIssued(tokenIssuedAt, createdAt);
  return days >= TOKEN_REFRESH_INTERVAL_DAYS || isTokenExpiringSoon(tokenExpiresAt);
};

const isManualRefreshAvailable = (tokenIssuedAt, createdAt) => {
  return getDaysSinceIssued(tokenIssuedAt, createdAt) >= TOKEN_REFRESH_INTERVAL_DAYS;
};

const needsTokenRefreshAttention = (tokenIssuedAt, createdAt) => {
  return getDaysSinceIssued(tokenIssuedAt, createdAt) >= TOKEN_REFRESH_AFTER_DAYS;
};

/** Extra safety net before publish if cron has not renewed the token yet. */
const shouldRefreshBeforePublish = (tokenIssuedAt, createdAt, tokenExpiresAt) => {
  if (!isWithinTokenCronLifetime(tokenIssuedAt, createdAt)) return false;
  const days = getDaysSinceIssued(tokenIssuedAt, createdAt);
  return days >= TOKEN_REFRESH_PUBLISH_BUFFER_DAYS || isTokenExpiringSoon(tokenExpiresAt);
};

const formatTokenRefreshMeta = (account) => ({
  tokenIssuedAt: account.tokenIssuedAt || account.createdAt,
  tokenExpiresAt: account.tokenExpiresAt || null,
  daysSinceIssued: getDaysSinceIssued(account.tokenIssuedAt, account.createdAt),
  refreshStatus: getTokenRefreshStatus(account.tokenIssuedAt, account.createdAt),
  cronEligible: isCronRefreshEligible(account.tokenIssuedAt, account.createdAt, account.tokenExpiresAt),
  manualRefreshAvailable: isManualRefreshAvailable(account.tokenIssuedAt, account.createdAt),
  lastTokenRefreshAttemptAt: account.lastTokenRefreshAttemptAt || null,
  lastTokenRefreshError: account.lastTokenRefreshError || null,
});

export {
  TOKEN_REFRESH_INTERVAL_DAYS,
  TOKEN_REFRESH_AFTER_DAYS,
  TOKEN_REFRESH_CRON_MAX_DAYS,
  TOKEN_REFRESH_EXPIRY_BUFFER_DAYS,
  TOKEN_REFRESH_PUBLISH_BUFFER_DAYS,
  getDaysSinceIssued,
  getTokenRefreshStatus,
  isTokenExpiringSoon,
  isWithinTokenCronLifetime,
  isCronRefreshEligible,
  isManualRefreshAvailable,
  needsTokenRefreshAttention,
  shouldRefreshBeforePublish,
  formatTokenRefreshMeta,
};
