import axios from "axios";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt, encrypt } from "./encrypt.js";
import { getEnv } from "./env.js";
import logger from "./logger.js";
import { isTokenExpiringSoon, isWithinTokenCronLifetime, TOKEN_REFRESH_INTERVAL_DAYS, getDaysSinceIssued } from "./tokenRefreshStatus.js";

const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const REFRESH_AHEAD_MS = 10 * 24 * 60 * 60 * 1000;

const getLinkedInConfig = () => {
  const clientId = getEnv("LINKEDIN_CLIENT_ID");
  const clientSecret = getEnv("LINKEDIN_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("LinkedIn OAuth is not configured.");
  return { clientId, clientSecret };
};

const refreshLinkedInTokensForAccount = async (accountId) => {
  const account = await SocialAccount.findById(accountId).select("+accessToken +refreshToken");
  if (!account || account.platform !== "linkedin") throw new Error("LinkedIn account not found.");
  if (!account.refreshToken) throw new Error("LinkedIn account has no refresh token. Reconnect the account.");

  const { clientId, clientSecret } = getLinkedInConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: decrypt(account.refreshToken),
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const { data } = await axios.post(LINKEDIN_TOKEN_URL, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!data?.access_token) throw new Error("LinkedIn did not return a refreshed access token.");
    account.accessToken = encrypt(data.access_token);
    if (data.refresh_token) account.refreshToken = encrypt(data.refresh_token);
    account.tokenIssuedAt = new Date();
    account.tokenExpiresAt = new Date(Date.now() + (data.expires_in || 5184000) * 1000);
    account.lastTokenRefreshAttemptAt = new Date();
    account.lastTokenRefreshError = undefined;
    account.status = "connected";
    await account.save();
    return account;
  } catch (error) {
    account.lastTokenRefreshAttemptAt = new Date();
    account.lastTokenRefreshError =
      error.response?.data?.error_description || error.response?.data?.error || error.message;
    await account.save();
    throw error;
  }
};

const getUsableLinkedInAccount = async (account) => {
  const expiresSoon = !account.tokenExpiresAt || account.tokenExpiresAt.getTime() <= Date.now() + REFRESH_AHEAD_MS;
  if (expiresSoon && account.refreshToken) {
    try {
      const current = await refreshLinkedInTokensForAccount(account._id);
      return { account: current, token: decrypt(current.accessToken) };
    } catch (error) {
      logger.warn(`LinkedIn pre-publish refresh failed for ${account.accountName}: ${error.message}`);
    }
  }
  const current = (await SocialAccount.findById(account._id).select("+accessToken")) || account;
  return { account: current, token: decrypt(current.accessToken) };
};

const runLinkedInTokenRefreshJob = async () => {
  if (!getEnv("LINKEDIN_CLIENT_ID") || !getEnv("LINKEDIN_CLIENT_SECRET")) {
    logger.info("LinkedIn token refresh skipped — LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET is not configured.");
    return { checked: 0, refreshed: 0 };
  }

  const cutoff = new Date(Date.now() + REFRESH_AHEAD_MS);
  const intervalBefore = new Date(Date.now() - TOKEN_REFRESH_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  const accounts = await SocialAccount.find({
    platform: "linkedin",
    status: "connected",
    refreshToken: { $exists: true, $ne: null },
    $or: [{ tokenExpiresAt: { $lte: cutoff } }, { tokenExpiresAt: null }, { tokenIssuedAt: { $lte: intervalBefore } }],
  }).select("+accessToken +refreshToken");

  const due = accounts.filter((account) => isWithinTokenCronLifetime(account.tokenIssuedAt, account.createdAt));
  const results = await Promise.allSettled(due.map((account) => refreshLinkedInTokensForAccount(account._id)));
  const refreshed = results.filter((result) => result.status === "fulfilled").length;
  if (due.length) {
    logger.info(`LinkedIn token refresh finished — success: ${refreshed}, failed: ${due.length - refreshed}.`);
  }
  return { checked: due.length, refreshed };
};

export { refreshLinkedInTokensForAccount, getUsableLinkedInAccount, runLinkedInTokenRefreshJob };
