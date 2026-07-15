import axios from "axios";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt, encrypt } from "./encrypt.js";
import logger from "./logger.js";

const FB_GRAPH_VERSION = "v19.0";
const FB_PAGE_TOKEN_TTL_DAYS = 60;
const TOKEN_REFRESH_AFTER_DAYS = Number(process.env.FB_TOKEN_REFRESH_AFTER_DAYS) || 45;

const getTokenRefreshDueBefore = () =>
  new Date(Date.now() - TOKEN_REFRESH_AFTER_DAYS * 24 * 60 * 60 * 1000);

/**
 * Refreshes the long-lived Facebook user token and re-fetches page tokens
 * for every page returned by /me/accounts in the same workspace connection group.
 */
const refreshFacebookTokensForAccount = async (accountId) => {
  const account = await SocialAccount.findById(accountId).select("+userAccessToken");
  if (!account) throw new Error("Social account not found.");
  if (account.platform !== "facebook") throw new Error("Token refresh is only supported for Facebook pages.");
  if (!account.userAccessToken) throw new Error("No stored Facebook user token for this page.");

  let currentUserToken;
  try {
    currentUserToken = decrypt(account.userAccessToken);
  } catch {
    throw new Error("Failed to decrypt stored Facebook user token.");
  }

  const longTokenRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: process.env.FB_APP_ID,
      client_secret: process.env.FB_APP_SECRET,
      fb_exchange_token: currentUserToken,
    },
  });

  const newLongUserToken = longTokenRes.data.access_token;
  if (!newLongUserToken) throw new Error("Facebook did not return a refreshed user token.");

  const pagesRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts`, {
    params: {
      access_token: newLongUserToken,
      fields: "id,name,category,picture{url},access_token",
    },
  });

  const pages = pagesRes.data.data || [];
  if (!pages.length) throw new Error("Facebook returned no manageable pages for this token.");

  const tokenIssuedAt = new Date();
  const tokenExpiresAt = new Date(Date.now() + FB_PAGE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const encryptedUserToken = encrypt(newLongUserToken);

  let pagesUpdated = 0;

  for (const page of pages) {
    const updated = await SocialAccount.findOneAndUpdate(
      { workspace: account.workspace, platform: "facebook", accountId: page.id },
      {
        accessToken: encrypt(page.access_token),
        userAccessToken: encryptedUserToken,
        tokenIssuedAt,
        tokenExpiresAt,
        accountName: page.name,
        category: page.category || "",
        avatar: page.picture?.data?.url || "",
        status: "connected",
        lastSyncedAt: tokenIssuedAt,
        lastTokenRefreshAttemptAt: tokenIssuedAt,
        lastTokenRefreshError: null,
      },
      { new: true }
    );

    if (updated) pagesUpdated += 1;
  }

  logger.info(
    `Facebook token refresh succeeded for workspace ${account.workspace} (${pagesUpdated}/${pages.length} pages updated).`
  );

  return { pagesUpdated, totalPages: pages.length, tokenIssuedAt };
};

/**
 * Marks a Facebook connection group as failed for today's refresh attempt.
 * tokenIssuedAt is left unchanged so the daily cron retries tomorrow at 12 PM.
 */
const markFacebookTokenRefreshFailed = async (account, errorMessage) => {
  await SocialAccount.updateMany(
    {
      workspace: account.workspace,
      connectedBy: account.connectedBy,
      platform: "facebook",
      status: "connected",
    },
    {
      $set: {
        lastTokenRefreshAttemptAt: new Date(),
        lastTokenRefreshError: errorMessage,
      },
    }
  );
};

/**
 * Finds Facebook page groups whose tokens are at least 45 days old and refreshes them.
 * Failed groups are retried every day at 12 PM until refresh succeeds.
 */
const runFacebookTokenRefreshJob = async () => {
  if (!process.env.FB_APP_ID?.trim() || !process.env.FB_APP_SECRET?.trim()) {
    logger.warn("Facebook token refresh skipped — FB_APP_ID or FB_APP_SECRET is not configured.");
    return { attempted: 0, succeeded: 0, failed: 0 };
  }

  const dueBefore = getTokenRefreshDueBefore();

  const dueAccounts = await SocialAccount.find({
    platform: "facebook",
    status: "connected",
    userAccessToken: { $exists: true, $ne: null },
    $expr: {
      $lte: [{ $ifNull: ["$tokenIssuedAt", "$createdAt"] }, dueBefore],
    },
  }).select("_id workspace connectedBy accountName tokenIssuedAt");

  if (!dueAccounts.length) {
    logger.info("Facebook token refresh: no pages due for refresh.");
    return { attempted: 0, succeeded: 0, failed: 0 };
  }

  const groupRepresentatives = new Map();
  for (const account of dueAccounts) {
    const key = `${account.workspace}_${account.connectedBy}`;
    if (!groupRepresentatives.has(key)) {
      groupRepresentatives.set(key, account);
    }
  }

  logger.info(`Facebook token refresh: ${groupRepresentatives.size} connection group(s) due.`);

  let succeeded = 0;
  let failed = 0;

  for (const account of groupRepresentatives.values()) {
    try {
      await refreshFacebookTokensForAccount(account._id);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      const message = error.response?.data?.error?.message || error.message;
      logger.error(
        `Facebook token refresh failed for page "${account.accountName}" (${account._id}): ${message}`
      );
      await markFacebookTokenRefreshFailed(account, message);
    }
  }

  logger.info(`Facebook token refresh finished — success: ${succeeded}, failed: ${failed}.`);
  return { attempted: groupRepresentatives.size, succeeded, failed };
};

export {
  TOKEN_REFRESH_AFTER_DAYS,
  refreshFacebookTokensForAccount,
  runFacebookTokenRefreshJob,
  getTokenRefreshDueBefore,
};
