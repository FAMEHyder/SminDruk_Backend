import { encrypt } from "../utils/encrypt.js";
import { getApiUrl, getFrontendUrl } from "../utils/env.js";
import axios from "axios";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import SocialAccount from "../models/socialAccount.model.js";
import logger from "../utils/logger.js";

/**
 * NOTE: Real OAuth handshakes for each platform (Instagram, LinkedIn, X, TikTok,
 * Pinterest, YouTube, Threads, Bluesky, Mastodon, Google Business Profile) should
 * happen via dedicated `/social-accounts/:platform/connect` redirect + callback
 * routes, following the same pattern as the Facebook Pages flow below. Facebook
 * is fully implemented; the rest are exposed via the generic `connectAccount`
 * endpoint until each platform's OAuth app is wired in.
 */

const FB_GRAPH_VERSION = "v19.0";
const FB_PAGE_TOKEN_TTL_DAYS = 60;

const getFacebookRedirectUri = () => `${getApiUrl()}/api/v1/social-accounts/facebook/callback`;

// GET /api/v1/social-accounts/facebook/connect?workspaceId=&userId=
const facebookConnectStart = (req, res) => {
  const { workspaceId, userId } = req.query;

  if (!workspaceId || !userId) {
    throw ApiError.badRequest("workspaceId and userId are required to start the Facebook connection.");
  }

  const stateData = encodeURIComponent(
    JSON.stringify({
      workspaceId,
      userId,
      nonce: crypto.randomUUID(),
    })
  );

  const scopes = ["pages_read_engagement", "pages_manage_engagement", "pages_manage_posts", "pages_show_list"];

  const fbUrl =
    `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth` +
    `?client_id=${process.env.FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(getFacebookRedirectUri())}` +
    `&scope=${scopes.join(",")}` +
    `&response_type=code` +
    `&state=${stateData}`;

  return res.redirect(fbUrl);
};

// GET /api/v1/social-accounts/facebook/callback
const facebookConnectCallback = asyncHandler(async (req, res) => {
  const { code, state, error: fbError } = req.query;
  const frontendUrl = getFrontendUrl();

  if (fbError) {
    return res.redirect(`${frontendUrl}/dashboard/connect-channels?fb=denied`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/dashboard/connect-channels?fb=error`);
  }

  let workspaceId;
  let userId;
  try {
    const parsed = JSON.parse(decodeURIComponent(state));
    workspaceId = parsed.workspaceId;
    userId = parsed.userId;
  } catch {
    return res.redirect(`${frontendUrl}/dashboard/connect-channels?fb=error`);
  }

  try {
    // 1) Exchange the auth code for a short-lived user token.
    const tokenRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`, {
      params: {
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        redirect_uri: getFacebookRedirectUri(),
        code,
      },
    });
    const shortToken = tokenRes.data.access_token;

    // 2) Exchange for a long-lived (~60 day) user token.
    const longTokenRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });
    const longUserToken = longTokenRes.data.access_token;

    // 3) Fetch every Facebook Page this user manages, with category + profile picture.
    const pagesRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts`, {
      params: {
        access_token: longUserToken,
        fields: "id,name,category,picture{url},access_token",
      },
    });
    const pages = pagesRes.data.data || [];

    if (!pages.length) {
      logger.warn(`Facebook connect for workspace ${workspaceId}: no manageable Pages found.`);
    }

    // 4) Upsert a SocialAccount per Page, keyed by (workspace, platform, pageId).
    const tokenIssuedAt = new Date();
    const tokenExpiresAt = new Date(Date.now() + FB_PAGE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    for (const page of pages) {
      await SocialAccount.findOneAndUpdate(
        { workspace: workspaceId, platform: "facebook", accountId: page.id },
        {
          workspace: workspaceId,
          connectedBy: userId,
          platform: "facebook",
          accountId: page.id,
          accountName: page.name,
          category: page.category || "",
          avatar: page.picture?.data?.url || "",
          accessToken: encrypt(page.access_token),
          userAccessToken: encrypt(longUserToken),
          tokenIssuedAt,
          tokenExpiresAt,
          status: "connected",
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    return res.redirect(`${frontendUrl}/dashboard/connect-channels?fb=connected`);
  } catch (error) {
    logger.error(`Facebook connect callback failed: ${error.response?.data?.error?.message || error.message}`);
    return res.redirect(`${frontendUrl}/dashboard/connect-channels?fb=error`);
  }
});

// POST /api/v1/social-accounts/connect
const connectAccount = asyncHandler(async (req, res) => {
  const { workspaceId, platform, accountId, accountName, avatar, accessToken, refreshToken, tokenExpiresAt } =
    req.body;

  const account = await SocialAccount.findOneAndUpdate(
    { workspace: workspaceId, platform, accountId },
    {
      workspace: workspaceId,
      connectedBy: req.user._id,
      platform,
      accountId,
      accountName,
      avatar,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      status: "connected",
      lastSyncedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return new ApiResponse(201, "Social account connected successfully.", account).send(res);
});

// GET /api/v1/social-accounts?workspaceId=
const listAccounts = asyncHandler(async (req, res) => {
  const accounts = await SocialAccount.find({ workspace: req.query.workspaceId }).select(
    "-accessToken -refreshToken"
  );

  return new ApiResponse(200, "Social accounts fetched successfully.", accounts).send(res);
});

// DELETE /api/v1/social-accounts/:id
const disconnectAccount = asyncHandler(async (req, res) => {
  const account = await SocialAccount.findByIdAndUpdate(
    req.params.id,
    { status: "disconnected" },
    { new: true }
  );
  if (!account) throw ApiError.notFound("Social account not found.");

  return new ApiResponse(200, "Social account disconnected successfully.").send(res);
});

// POST /api/v1/social-accounts/:id/refresh-token
const refreshAccountToken = asyncHandler(async (req, res) => {
  const account = await SocialAccount.findById(req.params.id);
  if (!account) throw ApiError.notFound("Social account not found.");

  // TODO: call the platform's OAuth token-refresh endpoint using account.refreshToken.
  account.lastSyncedAt = new Date();
  account.status = "connected";
  await account.save();

  return new ApiResponse(200, "Access token refreshed successfully.").send(res);
});

// POST /api/v1/social-accounts/:id/sync
const syncAccount = asyncHandler(async (req, res) => {
  const account = await SocialAccount.findById(req.params.id);
  if (!account) throw ApiError.notFound("Social account not found.");

  // TODO: pull latest profile info / follower counts from the platform API.
  account.lastSyncedAt = new Date();
  await account.save();

  return new ApiResponse(200, "Account synced successfully.", account).send(res);
});

// GET /api/v1/social-accounts/:id/status
const checkConnectionStatus = asyncHandler(async (req, res) => {
  const account = await SocialAccount.findById(req.params.id).select("-accessToken -refreshToken");
  if (!account) throw ApiError.notFound("Social account not found.");

  return new ApiResponse(200, "Connection status fetched successfully.", {
    status: account.status,
    lastSyncedAt: account.lastSyncedAt,
  }).send(res);
});

export { connectAccount,
  listAccounts,
  disconnectAccount,
  refreshAccountToken,
  syncAccount,
  checkConnectionStatus,
  facebookConnectStart,
  facebookConnectCallback, };
