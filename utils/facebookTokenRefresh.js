import axios from "axios";
import SocialAccount from "../models/socialAccount.model.js";
import ConnectedPage from "../models/connectedPage.model.js";
import { decrypt, encrypt } from "./encrypt.js";
import logger from "./logger.js";
import {
  TOKEN_REFRESH_INTERVAL_DAYS,
  TOKEN_REFRESH_CRON_MAX_DAYS,
  TOKEN_REFRESH_EXPIRY_BUFFER_DAYS,
  isCronRefreshEligible,
  shouldRefreshBeforePublish,
} from "./tokenRefreshStatus.js";

const FB_GRAPH_VERSION = "v19.0";
const FB_PAGE_TOKEN_TTL_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getTokenRefreshDueBefore = () =>
  new Date(Date.now() - TOKEN_REFRESH_INTERVAL_DAYS * MS_PER_DAY);

const getTokenRefreshCronMaxBefore = () =>
  new Date(Date.now() - TOKEN_REFRESH_CRON_MAX_DAYS * MS_PER_DAY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isFatalMetaRefreshError = (error) => {
  const graphError = error?.response?.data?.error;
  const codes = [Number(graphError?.code), Number(graphError?.error_subcode)];
  return codes.some((code) => [102, 190, 458, 463, 467, 492].includes(code));
};

const withMetaRefreshRetries = async (fn) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isFatalMetaRefreshError(error) || attempt === 3) throw error;
      const status = Number(error?.response?.status);
      if (status && status < 500 && status !== 429) throw error;
      logger.warn(`Facebook token refresh retry ${attempt}/3: ${error.message}`);
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
};

const exchangeLongLivedUserToken = async (currentUserToken) => {
  const longTokenRes = await withMetaRefreshRetries(() =>
    axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        fb_exchange_token: currentUserToken,
      },
    })
  );

  const newLongUserToken = longTokenRes.data.access_token;
  if (!newLongUserToken) throw new Error("Facebook did not return a refreshed user token.");

  const expiresIn = Number(longTokenRes.data.expires_in);
  const tokenExpiresAt =
    expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000)
      : new Date(Date.now() + FB_PAGE_TOKEN_TTL_DAYS * MS_PER_DAY);

  return { newLongUserToken, tokenExpiresAt };
};

const fetchManagedPages = async (userToken, fields) => {
  const pagesRes = await withMetaRefreshRetries(() =>
    axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts`, {
      params: { access_token: userToken, fields },
    })
  );
  const pages = pagesRes.data.data || [];
  if (!pages.length) throw new Error("Facebook returned no manageable pages for this token.");
  return pages;
};

const connectionGroupKey = (doc) => `${doc.workspace}_${doc.connectedBy || doc._id}`;

/**
 * Refreshes the long-lived Meta user token and re-fetches Facebook Page and
 * linked Instagram professional-account tokens in the same connection group.
 */
const refreshFacebookTokensForAccount = async (accountId) => {
  const account = await SocialAccount.findById(accountId).select("+userAccessToken");
  if (!account) throw new Error("Social account not found.");
  if (!["facebook", "instagram"].includes(account.platform)) throw new Error("Token refresh is only supported for Meta accounts.");
  if (!account.userAccessToken) throw new Error("No stored Meta user token for this account.");

  let currentUserToken;
  try {
    currentUserToken = decrypt(account.userAccessToken);
  } catch {
    throw new Error("Failed to decrypt stored Facebook user token.");
  }

  const { newLongUserToken, tokenExpiresAt } = await exchangeLongLivedUserToken(currentUserToken);
  const pages = await fetchManagedPages(
    newLongUserToken,
    "id,name,category,picture{url},access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}"
  );

  const tokenIssuedAt = new Date();
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

    const instagram = page.instagram_business_account;
    if (instagram?.id) {
      await SocialAccount.findOneAndUpdate(
        { workspace: account.workspace, platform: "instagram", accountId: instagram.id, authSource: { $ne: "instagram_login" } },
        {
          accessToken: encrypt(page.access_token),
          userAccessToken: encryptedUserToken,
          tokenIssuedAt,
          tokenExpiresAt,
          accountName: instagram.username ? `@${instagram.username}` : instagram.name || "Instagram account",
          username: instagram.username || "",
          avatar: instagram.profile_picture_url || "",
          followersCount: instagram.followers_count || 0,
          status: "connected",
          authSource: "facebook_page",
          lastSyncedAt: tokenIssuedAt,
          lastTokenRefreshAttemptAt: tokenIssuedAt,
          lastTokenRefreshError: null,
        },
        { new: true }
      );
    }
  }

  logger.info(
    `Facebook token refresh succeeded for workspace ${account.workspace} (${pagesUpdated}/${pages.length} pages updated).`
  );

  return { pagesUpdated, totalPages: pages.length, tokenIssuedAt };
};

/**
 * Refreshes tokens for a trending dataset ConnectedPage group (same workspace + connectedBy).
 */
const refreshFacebookTokensForConnectedPage = async (pageId) => {
  const page = await ConnectedPage.findById(pageId).select("+userAccessToken");
  if (!page) throw new Error("Connected page not found.");
  if (!page.userAccessToken) throw new Error("No stored Facebook user token for this page.");

  let currentUserToken;
  try {
    currentUserToken = decrypt(page.userAccessToken);
  } catch {
    throw new Error("Failed to decrypt stored Facebook user token.");
  }

  const { newLongUserToken, tokenExpiresAt } = await exchangeLongLivedUserToken(currentUserToken);
  const pages = await fetchManagedPages(newLongUserToken, "id,name,category,picture{url},access_token");

  const tokenIssuedAt = new Date();
  const encryptedUserToken = encrypt(newLongUserToken);

  let pagesUpdated = 0;

  for (const fbPage of pages) {
    const updated = await ConnectedPage.findOneAndUpdate(
      { pageId: fbPage.id },
      {
        pageAccessToken: encrypt(fbPage.access_token),
        userAccessToken: encryptedUserToken,
        tokenIssuedAt,
        tokenExpiresAt,
        pageName: fbPage.name,
        category: fbPage.category || "",
        profilePicture: fbPage.picture?.data?.url || "",
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
    `Facebook token refresh succeeded for dataset pages (${pagesUpdated}/${pages.length} pages updated).`
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
      platform: { $in: ["facebook", "instagram"] },
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

const markConnectedPageTokenRefreshFailed = async (page, errorMessage) => {
  await ConnectedPage.updateMany(
    {
      workspace: page.workspace,
      connectedBy: page.connectedBy,
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

const cronEligibleDateFilter = () => {
  const dueBefore = getTokenRefreshDueBefore();
  const cronMaxBefore = getTokenRefreshCronMaxBefore();
  const expiringBefore = new Date(Date.now() + TOKEN_REFRESH_EXPIRY_BUFFER_DAYS * MS_PER_DAY);
  const now = new Date();
  return {
    $expr: {
      $and: [
        { $gt: [{ $ifNull: ["$tokenIssuedAt", "$createdAt"] }, cronMaxBefore] },
        {
          $or: [
            { $lte: [{ $ifNull: ["$tokenIssuedAt", "$createdAt"] }, dueBefore] },
            {
              $and: [
                { $ne: ["$tokenExpiresAt", null] },
                { $lte: ["$tokenExpiresAt", expiringBefore] },
                { $gt: ["$tokenExpiresAt", now] },
              ],
            },
          ],
        },
      ],
    },
  };
};

/**
 * Finds Facebook/Instagram page groups whose tokens are at least 7 days old
 * (or expiring within 20 days) and refreshes them. Failed groups retry every
 * 6 hours until success or 60 days pass.
 */
const runFacebookTokenRefreshJob = async () => {
  if (!process.env.FB_APP_ID?.trim() || !process.env.FB_APP_SECRET?.trim()) {
    logger.warn("Facebook token refresh skipped — FB_APP_ID or FB_APP_SECRET is not configured.");
    return { attempted: 0, succeeded: 0, failed: 0, manage: 0, dataset: 0 };
  }

  const dateFilter = cronEligibleDateFilter();

  const [dueManageAccounts, dueDatasetPages] = await Promise.all([
    SocialAccount.find({
      platform: { $in: ["facebook", "instagram"] },
      status: "connected",
      userAccessToken: { $exists: true, $ne: null },
      authSource: { $ne: "instagram_login" },
      ...dateFilter,
    }).select("_id workspace connectedBy accountName tokenIssuedAt"),
    ConnectedPage.find({
      status: "connected",
      userAccessToken: { $exists: true, $ne: null },
      ...dateFilter,
    }).select("_id workspace connectedBy pageName tokenIssuedAt"),
  ]);

  if (!dueManageAccounts.length && !dueDatasetPages.length) {
    logger.info("Facebook token refresh: no pages due for refresh (7–60 day window).");
    return { attempted: 0, succeeded: 0, failed: 0, manage: 0, dataset: 0 };
  }

  const manageGroups = new Map();
  for (const account of dueManageAccounts) {
    const key = connectionGroupKey(account);
    if (!manageGroups.has(key)) manageGroups.set(key, account);
  }

  const datasetGroups = new Map();
  for (const page of dueDatasetPages) {
    const key = connectionGroupKey(page);
    if (!datasetGroups.has(key)) datasetGroups.set(key, page);
  }

  logger.info(
    `Facebook token refresh: ${manageGroups.size} manage group(s), ${datasetGroups.size} dataset group(s) due.`
  );

  let succeeded = 0;
  let failed = 0;
  let manageSucceeded = 0;
  let datasetSucceeded = 0;

  for (const account of manageGroups.values()) {
    try {
      await refreshFacebookTokensForAccount(account._id);
      succeeded += 1;
      manageSucceeded += 1;
    } catch (error) {
      failed += 1;
      const message = error.response?.data?.error?.message || error.message;
      logger.error(
        `Facebook token refresh failed for manage page "${account.accountName}" (${account._id}): ${message}`
      );
      await markFacebookTokenRefreshFailed(account, message);
    }
  }

  for (const page of datasetGroups.values()) {
    try {
      await refreshFacebookTokensForConnectedPage(page._id);
      succeeded += 1;
      datasetSucceeded += 1;
    } catch (error) {
      failed += 1;
      const message = error.response?.data?.error?.message || error.message;
      logger.error(
        `Facebook token refresh failed for dataset page "${page.pageName}" (${page._id}): ${message}`
      );
      await markConnectedPageTokenRefreshFailed(page, message);
    }
  }

  const attempted = manageGroups.size + datasetGroups.size;
  logger.info(`Facebook token refresh finished — success: ${succeeded}, failed: ${failed}.`);
  return {
    attempted,
    succeeded,
    failed,
    manage: manageSucceeded,
    dataset: datasetSucceeded,
  };
};

const needsPrePublishRefresh = (doc) =>
  shouldRefreshBeforePublish(doc.tokenIssuedAt, doc.createdAt, doc.tokenExpiresAt) ||
  Boolean(doc.lastTokenRefreshError && isCronRefreshEligible(doc.tokenIssuedAt, doc.createdAt, doc.tokenExpiresAt));

const refreshMetaGroups = async ({ accounts = [], pages = [], force = false }) => {
  const manageGroups = new Map();
  for (const account of accounts) {
    const due = force
      ? isCronRefreshEligible(account.tokenIssuedAt, account.createdAt, account.tokenExpiresAt)
      : needsPrePublishRefresh(account);
    if (!due) continue;
    const key = connectionGroupKey(account);
    if (!manageGroups.has(key)) manageGroups.set(key, account);
  }

  const datasetGroups = new Map();
  for (const page of pages) {
    const due = force
      ? isCronRefreshEligible(page.tokenIssuedAt, page.createdAt, page.tokenExpiresAt)
      : needsPrePublishRefresh(page);
    if (!due) continue;
    const key = connectionGroupKey(page);
    if (!datasetGroups.has(key)) datasetGroups.set(key, page);
  }

  let succeeded = 0;
  let attempted = 0;

  for (const account of manageGroups.values()) {
    attempted += 1;
    try {
      await refreshFacebookTokensForAccount(account._id);
      succeeded += 1;
    } catch (error) {
      logger.warn(
        `Pre-publish Meta token refresh failed for "${account.accountName}" (${account._id}): ${error.message}`
      );
    }
  }

  for (const page of datasetGroups.values()) {
    attempted += 1;
    try {
      await refreshFacebookTokensForConnectedPage(page._id);
      succeeded += 1;
    } catch (error) {
      logger.warn(
        `Pre-publish dataset token refresh failed for "${page.pageName}" (${page._id}): ${error.message}`
      );
    }
  }

  return { attempted, succeeded };
};

const ensureFreshMetaTokensForAccountIds = async (accountIds, { force = false } = {}) => {
  if (!accountIds?.length) return { attempted: 0, succeeded: 0 };
  const ids = accountIds.map((id) => String(id?._id || id)).filter(Boolean);
  const [accounts, pages] = await Promise.all([
    SocialAccount.find({
      _id: { $in: ids },
      platform: { $in: ["facebook", "instagram"] },
      status: "connected",
      authSource: { $ne: "instagram_login" },
    }).select("workspace connectedBy accountName tokenIssuedAt createdAt tokenExpiresAt lastTokenRefreshError"),
    ConnectedPage.find({
      _id: { $in: ids },
      status: "connected",
    }).select("workspace connectedBy pageName tokenIssuedAt createdAt tokenExpiresAt lastTokenRefreshError"),
  ]);
  return refreshMetaGroups({ accounts, pages, force });
};

const ensureFreshDatasetTokensForPages = async (pages, { force = false } = {}) => {
  if (!pages?.length) return { attempted: 0, succeeded: 0 };
  return refreshMetaGroups({ pages, force });
};

export {
  TOKEN_REFRESH_INTERVAL_DAYS,
  TOKEN_REFRESH_CRON_MAX_DAYS,
  refreshFacebookTokensForAccount,
  refreshFacebookTokensForConnectedPage,
  runFacebookTokenRefreshJob,
  ensureFreshMetaTokensForAccountIds,
  ensureFreshDatasetTokensForPages,
  getTokenRefreshDueBefore,
  isCronRefreshEligible,
};
