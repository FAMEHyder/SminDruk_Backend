const TOKEN_REFRESH_AFTER_DAYS = Number(process.env.FB_TOKEN_REFRESH_AFTER_DAYS) || 45;
const TOKEN_REFRESH_CRON_MAX_DAYS = Number(process.env.FB_TOKEN_REFRESH_CRON_MAX_DAYS) || 60;

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
 * - healthy: token younger than 45 days
 * - refresh_due: 45–59 days — cron retries daily + manual refresh available
 * - cron_expired: 60+ days — cron stops, manual refresh still required
 */
const getTokenRefreshStatus = (tokenIssuedAt, createdAt) => {
  const days = getDaysSinceIssued(tokenIssuedAt, createdAt);
  if (days < TOKEN_REFRESH_AFTER_DAYS) return "healthy";
  if (days < TOKEN_REFRESH_CRON_MAX_DAYS) return "refresh_due";
  return "cron_expired";
};

const isCronRefreshEligible = (tokenIssuedAt, createdAt) => {
  const days = getDaysSinceIssued(tokenIssuedAt, createdAt);
  return days >= TOKEN_REFRESH_AFTER_DAYS && days < TOKEN_REFRESH_CRON_MAX_DAYS;
};

const isManualRefreshAvailable = (tokenIssuedAt, createdAt) => {
  return getDaysSinceIssued(tokenIssuedAt, createdAt) >= TOKEN_REFRESH_AFTER_DAYS;
};

const needsTokenRefreshAttention = (tokenIssuedAt, createdAt) => {
  return isManualRefreshAvailable(tokenIssuedAt, createdAt);
};

const formatTokenRefreshMeta = (account) => ({
  tokenIssuedAt: account.tokenIssuedAt || account.createdAt,
  tokenExpiresAt: account.tokenExpiresAt || null,
  daysSinceIssued: getDaysSinceIssued(account.tokenIssuedAt, account.createdAt),
  refreshStatus: getTokenRefreshStatus(account.tokenIssuedAt, account.createdAt),
  cronEligible: isCronRefreshEligible(account.tokenIssuedAt, account.createdAt),
  manualRefreshAvailable: isManualRefreshAvailable(account.tokenIssuedAt, account.createdAt),
  lastTokenRefreshAttemptAt: account.lastTokenRefreshAttemptAt || null,
  lastTokenRefreshError: account.lastTokenRefreshError || null,
});

export {
  TOKEN_REFRESH_AFTER_DAYS,
  TOKEN_REFRESH_CRON_MAX_DAYS,
  getDaysSinceIssued,
  getTokenRefreshStatus,
  isCronRefreshEligible,
  isManualRefreshAvailable,
  needsTokenRefreshAttention,
  formatTokenRefreshMeta,
};
