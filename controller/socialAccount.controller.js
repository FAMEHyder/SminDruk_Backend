import { decrypt, encrypt } from "../utils/encrypt.js";
import { refreshFacebookTokensForAccount, runFacebookTokenRefreshJob } from "../utils/facebookTokenRefresh.js";
import { getAllowedOrigins, getApiUrl, getEnv, getFrontendUrl, trimTrailingSlash } from "../utils/env.js";
import axios from "axios";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import SocialAccount from "../models/socialAccount.model.js";
import ConnectedPage from "../models/connectedPage.model.js";
import { getNextPageNumbers } from "../utils/connectedPageNumbers.js";
import {
  createXAuthorizationUrl,
  exchangeXCode,
  getXFrontendUrl,
  refreshXTokensForAccount,
  runXTokenRefreshJob,
  syncXPostsForAccount,
} from "../utils/x.js";
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
const getInstagramRedirectUri = () =>
  getEnv("INSTAGRAM_CALLBACK_URI", "INSTAGRAM_CALLBACK_URL") ||
  `${getApiUrl()}/api/v1/social-accounts/instagram/callback`;
const getLinkedInRedirectUri = () =>
  getEnv("LINKEDIN_CALLBACK_URI", "LINKEDIN_CALLBACK_URL", "LINKEDIN_REDIRECT_URI") ||
  `${getApiUrl()}/api/v1/social-accounts/linkedin/callback`;

const getXErrorDetails = (error) => {
  const data = error?.response?.data;
  const raw = data ? JSON.stringify(data) : error?.message || "Unknown X OAuth error.";
  return {
    status: error?.response?.status || 500,
    message: data?.error_description || data?.detail || data?.title || data?.message || data?.error || error?.message || "Unknown X OAuth error.",
    raw,
  };
};

const getXErrorRedirect = (returnTo, error) => {
  const { status, message, raw } = getXErrorDetails(error);
  const url = new URL(getXFrontendUrl("error", returnTo));
  url.searchParams.set("reason", message);
  url.searchParams.set("xStatus", String(status));
  url.searchParams.set("xError", raw);
  return url.toString();
};

// GET /api/v1/social-accounts/x/connect?workspaceId=&userId=
const xConnectStart = (req, res) => {
  const { workspaceId, userId, returnTo } = req.query;
  if (!workspaceId || !userId) {
    throw ApiError.badRequest("workspaceId and userId are required to start the X connection.");
  }
  const frontendUrl = typeof returnTo === "string" ? trimTrailingSlash(returnTo) : "";
  const safeReturnTo = getAllowedOrigins().has(frontendUrl) ? frontendUrl : getFrontendUrl();
  return res.redirect(createXAuthorizationUrl({ workspaceId, userId, returnTo: safeReturnTo }));
};

// GET /api/v1/social-accounts/x/callback
const xConnectCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  let returnTo;
  if (error || !code || !state) {
    return res.redirect(
      getXErrorRedirect(undefined, {
        response: {
          status: 400,
          data: {
            error: typeof error === "string" ? error : "authorization_failed",
            error_description:
              typeof req.query.error_description === "string" ? req.query.error_description : "Authorization was cancelled.",
          },
        },
      })
    );
  }

  try {
    const { state: stateData, tokens } = await exchangeXCode({ code, state });
    returnTo = stateData.returnTo;
    const profileResponse = await axios.get("https://api.x.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      params: { "user.fields": "profile_image_url,public_metrics,description" },
    });
    const profile = profileResponse.data?.data;
    if (!profile?.id || !profile?.username) throw new Error("X did not return an account profile.");

    await SocialAccount.findOneAndUpdate(
      { workspace: stateData.workspaceId, platform: "x", accountId: profile.id },
      {
        workspace: stateData.workspaceId,
        connectedBy: stateData.userId,
        platform: "x",
        accountId: profile.id,
        accountName: `@${profile.username}`,
        username: profile.username,
        category: profile.description || "",
        avatar: profile.profile_image_url || "",
        followersCount: profile.public_metrics?.followers_count || 0,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenIssuedAt: new Date(),
        tokenExpiresAt: new Date(Date.now() + (tokens.expires_in || 7200) * 1000),
        status: "connected",
        connectSource: "manage",
        lastSyncedAt: new Date(),
        lastTokenRefreshAttemptAt: null,
        lastTokenRefreshError: null,
      },
      { upsert: true, new: true }
    );
    return res.redirect(getXFrontendUrl("connected", returnTo));
  } catch (connectError) {
    const { status, message } = getXErrorDetails(connectError);
    logger.error(`X connect callback failed (${status}): ${message}`);
    return res.redirect(getXErrorRedirect(returnTo, connectError));
  }
});

// GET /api/v1/social-accounts/x-error
// This public diagnostic response is intentionally called by the frontend after
// an OAuth redirect so the exact X error is visible in browser DevTools > Network.
const xErrorDiagnostic = (req, res) => {
  const xStatus = Number(req.query.xStatus);
  const xError = typeof req.query.xError === "string" ? req.query.xError : "No X error payload was returned.";
  return res.status(200).json({
    success: false,
    statusCode: Number.isInteger(xStatus) ? xStatus : 500,
    message: "X OAuth connection failed.",
    xError,
  });
};

// GET /api/v1/social-accounts/instagram/connect?workspaceId=&userId=&returnTo=
const instagramConnectStart = (req, res) => {
  const { workspaceId, userId, returnTo } = req.query;
  if (!workspaceId || !userId) {
    throw ApiError.badRequest("workspaceId and userId are required to start the Instagram connection.");
  }

  const frontendUrl = typeof returnTo === "string" ? trimTrailingSlash(returnTo) : "";
  const safeReturnTo = getAllowedOrigins().has(frontendUrl) ? frontendUrl : getFrontendUrl();
  const state = encodeURIComponent(JSON.stringify({ workspaceId, userId, returnTo: safeReturnTo, nonce: crypto.randomUUID() }));
  const scopes = ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement", "business_management"];
  const url =
    `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth` +
    `?client_id=${process.env.FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(getInstagramRedirectUri())}` +
    `&scope=${scopes.join(",")}` +
    `&response_type=code` +
    `&state=${state}`;

  return res.redirect(url);
};

// GET /api/v1/social-accounts/instagram/callback
const instagramConnectCallback = asyncHandler(async (req, res) => {
  const { code, state, error: instagramError } = req.query;
  let returnTo = getFrontendUrl();

  if (instagramError || !code || !state) {
    const reason = typeof req.query.error_description === "string" ? req.query.error_description : "Instagram authorization was cancelled.";
    return res.redirect(`${returnTo}/dashboard/connect-channels?ig=error&reason=${encodeURIComponent(reason)}`);
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(state));
    const requestedReturnTo = trimTrailingSlash(parsed.returnTo);
    returnTo = getAllowedOrigins().has(requestedReturnTo) ? requestedReturnTo : returnTo;

    const tokenRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`, {
      params: {
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        redirect_uri: getInstagramRedirectUri(),
        code,
      },
    });
    const longTokenRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        fb_exchange_token: tokenRes.data.access_token,
      },
    });
    const longUserToken = longTokenRes.data.access_token;
    const pagesRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts`, {
      params: {
        access_token: longUserToken,
        fields: "id,access_token",
      },
    });

    const pages = pagesRes.data.data || [];
    const accounts = (
      await Promise.all(
        pages
          .filter((page) => page.id && page.access_token)
          .map(async (page) => {
            const { data } = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${page.id}`, {
              params: {
                access_token: page.access_token,
                fields: "instagram_business_account{id,username,name,profile_picture_url,followers_count}",
              },
            });
            return { ...page, instagram_business_account: data.instagram_business_account };
          })
      )
    ).filter((page) => page.instagram_business_account?.id);
    if (!accounts.length) {
      return res.redirect(
        `${returnTo}/dashboard/connect-channels?ig=error&reason=${encodeURIComponent(
          "No Instagram professional account linked to a Facebook Page was found."
        )}`
      );
    }

    const tokenIssuedAt = new Date();
    const tokenExpiresAt = new Date(Date.now() + FB_PAGE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    for (const page of accounts) {
      const instagram = page.instagram_business_account;
      await SocialAccount.findOneAndUpdate(
        { workspace: parsed.workspaceId, platform: "instagram", accountId: instagram.id },
        {
          workspace: parsed.workspaceId,
          connectedBy: parsed.userId,
          platform: "instagram",
          accountId: instagram.id,
          accountName: instagram.username ? `@${instagram.username}` : instagram.name || "Instagram account",
          username: instagram.username || "",
          avatar: instagram.profile_picture_url || "",
          followersCount: instagram.followers_count || 0,
          accessToken: encrypt(page.access_token),
          userAccessToken: encrypt(longUserToken),
          tokenIssuedAt,
          tokenExpiresAt,
          status: "connected",
          connectSource: "manage",
          lastSyncedAt: new Date(),
          lastTokenRefreshAttemptAt: null,
          lastTokenRefreshError: null,
        },
        { upsert: true, new: true }
      );
    }

    return res.redirect(`${returnTo}/dashboard/connect-channels?ig=connected`);
  } catch (connectError) {
    const reason = connectError.response?.data?.error?.message || connectError.message;
    logger.error(`Instagram connect callback failed: ${reason}`);
    return res.redirect(`${returnTo}/dashboard/connect-channels?ig=error&reason=${encodeURIComponent(reason)}`);
  }
});

// GET /api/v1/social-accounts/linkedin/connect?workspaceId=&userId=&returnTo=
const linkedInConnectStart = (req, res) => {
  const { workspaceId, userId, returnTo } = req.query;
  const clientId = getEnv("LINKEDIN_CLIENT_ID");
  if (!workspaceId || !userId) throw ApiError.badRequest("workspaceId and userId are required to start the LinkedIn connection.");
  if (!clientId) throw ApiError.badRequest("LinkedIn OAuth is not configured.");

  const frontendUrl = typeof returnTo === "string" ? trimTrailingSlash(returnTo) : "";
  const safeReturnTo = getAllowedOrigins().has(frontendUrl) ? frontendUrl : getFrontendUrl();
  const state = encodeURIComponent(JSON.stringify({ workspaceId, userId, returnTo: safeReturnTo, nonce: crypto.randomUUID() }));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getLinkedInRedirectUri(),
    scope: "openid profile email w_member_social",
    state,
  });
  return res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
};

// GET /api/v1/social-accounts/linkedin/callback
const linkedInConnectCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  let returnTo = getFrontendUrl();
  if (error || !code || !state) {
    const reason = typeof req.query.error_description === "string" ? req.query.error_description : "LinkedIn authorization was cancelled.";
    return res.redirect(`${returnTo}/dashboard/connect-channels?linkedin=error&reason=${encodeURIComponent(reason)}`);
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(state));
    const requestedReturnTo = trimTrailingSlash(parsed.returnTo);
    returnTo = getAllowedOrigins().has(requestedReturnTo) ? requestedReturnTo : returnTo;
    const clientId = getEnv("LINKEDIN_CLIENT_ID");
    const clientSecret = getEnv("LINKEDIN_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("LinkedIn OAuth is not configured.");

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: getLinkedInRedirectUri(),
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data: tokens } = await axios.post("https://www.linkedin.com/oauth/v2/accessToken", tokenBody.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const { data: profile } = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profile?.sub) throw new Error("LinkedIn did not return an account profile.");

    await SocialAccount.findOneAndUpdate(
      { workspace: parsed.workspaceId, platform: "linkedin", accountId: profile.sub },
      {
        workspace: parsed.workspaceId,
        connectedBy: parsed.userId,
        platform: "linkedin",
        accountId: profile.sub,
        accountName: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || "LinkedIn account",
        username: profile.email || "",
        avatar: profile.picture || "",
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
        tokenIssuedAt: new Date(),
        tokenExpiresAt: new Date(Date.now() + (tokens.expires_in || 5184000) * 1000),
        status: "connected",
        connectSource: "manage",
        lastSyncedAt: new Date(),
        lastTokenRefreshAttemptAt: null,
        lastTokenRefreshError: null,
      },
      { upsert: true, new: true }
    );
    return res.redirect(`${returnTo}/dashboard/connect-channels?linkedin=connected`);
  } catch (connectError) {
    const reason = connectError.response?.data?.error_description || connectError.response?.data?.message || connectError.message;
    logger.error(`LinkedIn connect callback failed: ${reason}`);
    return res.redirect(`${returnTo}/dashboard/connect-channels?linkedin=error&reason=${encodeURIComponent(reason)}`);
  }
});

// GET /api/v1/social-accounts/facebook/connect?workspaceId=&userId=&connectMode=
const facebookConnectStart = (req, res) => {
  const { workspaceId, userId, connectMode = "manage" } = req.query;

  if (!workspaceId || !userId) {
    throw ApiError.badRequest("workspaceId and userId are required to start the Facebook connection.");
  }

  const mode = connectMode === "trending" ? "trending" : "manage";

  const stateData = encodeURIComponent(
    JSON.stringify({
      workspaceId,
      userId,
      connectMode: mode,
      nonce: crypto.randomUUID(),
    })
  );

  const scopes = ["pages_read_engagement", "public_profile", "pages_manage_posts", "pages_show_list"];

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
  let connectMode = "manage";
  try {
    const parsed = JSON.parse(decodeURIComponent(state));
    workspaceId = parsed.workspaceId;
    userId = parsed.userId;
    connectMode = parsed.connectMode === "trending" ? "trending" : "manage";
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

    // 4) Store separately by purpose:
    // - manage  → SocialAccount (connectSource: manage) for Create Post / schedule
    // - trending/dataset → ConnectedPage (admin dataset + bulk) AND SocialAccount
    //   (connectSource: dataset) so the owner can still post/schedule their own pages.
    //   Dataset SocialAccounts are excluded from admin "manage" counts.
    const tokenIssuedAt = new Date();
    const tokenExpiresAt = new Date(Date.now() + FB_PAGE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    if (connectMode === "trending") {
      const pageNumbers = await getNextPageNumbers(pages);

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        await ConnectedPage.findOneAndUpdate(
          { pageId: page.id },
          {
            workspace: workspaceId,
            connectedBy: userId,
            pageId: page.id,
            pageName: page.name,
            pageNumber: pageNumbers[i],
            profilePicture: page.picture?.data?.url || "",
            category: page.category || "",
            pageAccessToken: encrypt(page.access_token),
            userAccessToken: encrypt(longUserToken),
            tokenIssuedAt,
            tokenExpiresAt,
            status: "connected",
            lastSyncedAt: new Date(),
            lastTokenRefreshAttemptAt: null,
            lastTokenRefreshError: null,
          },
          { upsert: true, new: true }
        );

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
            connectSource: "dataset",
            lastSyncedAt: new Date(),
            lastTokenRefreshAttemptAt: null,
            lastTokenRefreshError: null,
          },
          { upsert: true, new: true }
        );
      }

      return res.redirect(`${frontendUrl}/dashboard/connect-channels?fb=connected&mode=trending`);
    }

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
          connectSource: "manage",
          lastSyncedAt: new Date(),
          lastTokenRefreshAttemptAt: null,
          lastTokenRefreshError: null,
        },
        { upsert: true, new: true }
      );
    }

    return res.redirect(`${frontendUrl}/dashboard/connect-channels?fb=connected&mode=manage`);
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
// Returns manage + dataset-owned pages so Create Post / schedule always works for the owner.
const listAccounts = asyncHandler(async (req, res) => {
  const workspaceId = req.query.workspaceId;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");

  const [accounts, datasetPages] = await Promise.all([
    SocialAccount.find({ workspace: workspaceId }).select("+accessToken -refreshToken -userAccessToken"),
    ConnectedPage.find({ workspace: workspaceId, status: "connected" }).select(
      "pageId pageName profilePicture category status lastSyncedAt createdAt updatedAt workspace connectedBy"
    ),
  ]);

  // Older Facebook connections may have been saved without an avatar. Fetch the
  // Page picture once with its encrypted page token, then persist it for later requests.
  await Promise.all(
    accounts
      .filter((account) => account.platform === "facebook" && !account.avatar && account.accessToken)
      .map(async (account) => {
        try {
          const { data } = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${account.accountId}/picture`, {
            params: { access_token: decrypt(account.accessToken), redirect: false, type: "large" },
          });
          const avatar = data?.data?.url;
          if (avatar) {
            account.avatar = avatar;
            await account.save();
          }
        } catch (error) {
          logger.warn(`Could not fetch Facebook Page picture for ${account.accountName}: ${error.message}`);
        }
      })
  );

  const accountPageIds = new Set(accounts.map((a) => a.accountId));

  // Older dataset-only connects may lack a SocialAccount row — still expose them for posting UI.
  const datasetOnly = datasetPages
    .filter((page) => !accountPageIds.has(page.pageId))
    .map((page) => ({
      _id: page._id,
      workspace: page.workspace,
      connectedBy: page.connectedBy,
      platform: "facebook",
      accountId: page.pageId,
      accountName: page.pageName,
      category: page.category || "",
      avatar: page.profilePicture || "",
      status: page.status,
      connectSource: "dataset",
      lastSyncedAt: page.lastSyncedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      source: "connectedPage",
    }));

  const safeAccounts = accounts.map((account) => {
    const safeAccount = account.toObject();
    delete safeAccount.accessToken;
    delete safeAccount.refreshToken;
    delete safeAccount.userAccessToken;
    return safeAccount;
  });

  return new ApiResponse(200, "Social accounts fetched successfully.", [...safeAccounts, ...datasetOnly]).send(res);
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

  if (account.platform === "x") {
    const result = await refreshXTokensForAccount(account._id);
    return new ApiResponse(200, "X account tokens refreshed successfully.", result).send(res);
  }
  if (account.platform !== "facebook") {
    throw ApiError.badRequest("Manual token refresh is only supported for Facebook and X accounts.");
  }

  const result = await refreshFacebookTokensForAccount(account._id);
  return new ApiResponse(200, "Facebook page tokens refreshed successfully.", result).send(res);
});

// POST /api/v1/social-accounts/:id/sync
const syncAccount = asyncHandler(async (req, res) => {
  const account = await SocialAccount.findById(req.params.id);
  if (!account) throw ApiError.notFound("Social account not found.");

  if (account.platform === "x") {
    const posts = await syncXPostsForAccount(account._id);
    return new ApiResponse(200, "X posts and engagement synced successfully.", { posts }).send(res);
  }

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
    tokenIssuedAt: account.tokenIssuedAt,
    tokenExpiresAt: account.tokenExpiresAt,
    lastTokenRefreshAttemptAt: account.lastTokenRefreshAttemptAt,
    lastTokenRefreshError: account.lastTokenRefreshError,
  }).send(res);
});

// POST /api/v1/social-accounts/cron/refresh-tokens — daily job backup (X-Cron-Secret header)
const cronRefreshTokens = asyncHandler(async (req, res) => {
  const secret = process.env.CRON_SECRET?.trim();
  const provided = req.headers["x-cron-secret"];

  if (!secret || provided !== secret) {
    throw ApiError.unauthorized("Invalid cron secret.");
  }

  const [facebook, x] = await Promise.all([runFacebookTokenRefreshJob(), runXTokenRefreshJob()]);
  return new ApiResponse(200, "Social token refresh job completed.", { facebook, x }).send(res);
});

export {
  connectAccount,
  listAccounts,
  disconnectAccount,
  refreshAccountToken,
  syncAccount,
  checkConnectionStatus,
  facebookConnectStart,
  facebookConnectCallback,
  instagramConnectStart,
  instagramConnectCallback,
  linkedInConnectStart,
  linkedInConnectCallback,
  xConnectStart,
  xConnectCallback,
  xErrorDiagnostic,
  cronRefreshTokens,
};
