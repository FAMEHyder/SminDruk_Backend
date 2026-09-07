import axios from "axios";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt, encrypt } from "./encrypt.js";
import { getEnv } from "./env.js";
import logger from "./logger.js";
import { isCronRefreshEligible, shouldRefreshBeforePublish } from "./tokenRefreshStatus.js";

const FB_GRAPH_VERSION = "v19.0";
const FB_GRAPH = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;
const IG_GRAPH = "https://graph.instagram.com";
const IG_GRAPH_VERSION = "v21.0";
const IG_GRAPH_API = `${IG_GRAPH}/${IG_GRAPH_VERSION}`;
const FB_PAGE_TOKEN_TTL_DAYS = 60;

const getExplicitInstagramAppId = () => getEnv("INSTAGRAM_APP_ID", "IG_APP_ID");
const getInstagramAppId = () => getExplicitInstagramAppId() || getEnv("FB_APP_ID");
const getInstagramAppSecret = () => getEnv("INSTAGRAM_APP_SECRET", "IG_APP_SECRET") || getEnv("FB_APP_SECRET");

const instagramGraphBase = (account) =>
  account?.authSource === "instagram_login" ? IG_GRAPH_API : FB_GRAPH;

const stripInstagramAuthCode = (code) => String(code || "").replace(/#_$/, "").trim();

const instagramApiError = (error, fallback = "Instagram request failed.") => {
  const data = error?.response?.data;
  if (typeof data?.error_message === "string" && data.error_message) return data.error_message;
  if (typeof data?.error?.message === "string" && data.error.message) return data.error.message;
  if (typeof data?.error_description === "string" && data.error_description) return data.error_description;
  if (typeof data?.error === "string" && data.error) return data.error;
  return error?.message || fallback;
};

const fetchPagedGraph = async (url, params) => {
  const items = [];
  let nextUrl = url;
  let config = params ? { params } : undefined;
  while (nextUrl) {
    const { data } = await axios.get(nextUrl, config);
    items.push(...(data.data || []));
    nextUrl = data.paging?.next || "";
    config = undefined;
  }
  return items;
};

const listFacebookPagesWithInstagram = async (userToken) => {
  const pages = await fetchPagedGraph(`${FB_GRAPH}/me/accounts`, {
    access_token: userToken,
    fields:
      "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count},connected_instagram_account{id,username,name,profile_picture_url,followers_count}",
    limit: 100,
  });

  const linked = [];
  for (const page of pages) {
    if (!page?.id || !page.access_token) continue;
    let ig = page.instagram_business_account || page.connected_instagram_account;
    if (!ig?.id) {
      try {
        const { data } = await axios.get(`${FB_GRAPH}/${page.id}`, {
          params: {
            access_token: page.access_token,
            fields:
              "instagram_business_account{id,username,name,profile_picture_url,followers_count},connected_instagram_account{id,username,name,profile_picture_url,followers_count}",
          },
        });
        ig = data.instagram_business_account || data.connected_instagram_account;
      } catch (error) {
        logger.warn(`Instagram lookup failed for Facebook Page ${page.id}: ${instagramApiError(error, error.message)}`);
      }
    }
    if (ig?.id) linked.push({ page, ig });
  }
  return linked;
};

const exchangeFacebookInstagramCode = async ({ code, redirectUri }) => {
  const clientId = getEnv("FB_APP_ID");
  const clientSecret = getEnv("FB_APP_SECRET");
  if (!clientId || !clientSecret) throw new Error("Facebook app ID and secret are not configured.");

  let shortToken;
  try {
    const tokenRes = await axios.get(`${FB_GRAPH}/oauth/access_token`, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: stripInstagramAuthCode(code),
      },
    });
    shortToken = tokenRes.data?.access_token;
  } catch (error) {
    throw new Error(instagramApiError(error, "Facebook did not accept this Instagram authorization code."));
  }
  if (!shortToken) throw new Error("Facebook did not return an access token for Instagram.");

  let longUserToken = shortToken;
  let expiresIn = FB_PAGE_TOKEN_TTL_DAYS * 24 * 60 * 60;
  try {
    const longTokenRes = await axios.get(`${FB_GRAPH}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: shortToken,
      },
    });
    longUserToken = longTokenRes.data?.access_token || shortToken;
    if (Number(longTokenRes.data?.expires_in) > 0) expiresIn = Number(longTokenRes.data.expires_in);
  } catch (error) {
    logger.warn(`Instagram Facebook long-lived token exchange failed, using short-lived token: ${instagramApiError(error, error.message)}`);
  }

  const linked = await listFacebookPagesWithInstagram(longUserToken);
  return { longUserToken, linked, expiresIn };
};

const createInstagramLoginUrl = ({ clientId, redirectUri, state }) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_content_publish",
    state,
    enable_fb_login: "0",
    force_authentication: "1",
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
};

const fetchInstagramLoginProfile = async (accessToken) => {
  const params = {
    fields: "id,user_id,username,name,account_type,profile_picture_url,followers_count",
    access_token: accessToken,
  };
  try {
    const { data } = await axios.get(`${IG_GRAPH_API}/me`, { params });
    return data;
  } catch {
    const { data } = await axios.get(`${IG_GRAPH}/me`, { params });
    return data;
  }
};

const exchangeInstagramLoginCode = async ({ code, redirectUri }) => {
  const clientId = getInstagramAppId();
  const clientSecret = getInstagramAppSecret();
  if (!clientId || !clientSecret) throw new Error("Instagram app ID and secret are not configured.");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code: stripInstagramAuthCode(code),
  });

  let tokenPayload;
  try {
    const { data } = await axios.post("https://api.instagram.com/oauth/access_token", body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    tokenPayload = data;
  } catch (error) {
    throw new Error(instagramApiError(error, "Instagram did not accept this authorization code."));
  }

  if (tokenPayload?.error_message || tokenPayload?.error) {
    throw new Error(instagramApiError({ response: { data: tokenPayload } }, "Instagram token exchange failed."));
  }

  const shortLived = tokenPayload?.data?.[0] || tokenPayload;
  const shortToken = shortLived?.access_token;
  const userId = String(shortLived?.user_id || shortLived?.userId || "");
  if (!shortToken) throw new Error("Instagram did not return an access token.");

  let accessToken = shortToken;
  let expiresIn = FB_PAGE_TOKEN_TTL_DAYS * 24 * 60 * 60;
  try {
    const longRes = await axios.get(`${IG_GRAPH}/access_token`, {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: clientSecret,
        access_token: shortToken,
      },
    });
    accessToken = longRes.data.access_token || accessToken;
    if (Number(longRes.data.expires_in) > 0) expiresIn = Number(longRes.data.expires_in);
  } catch (error) {
    logger.warn(`Instagram long-lived token exchange failed, using short-lived token: ${instagramApiError(error, error.message)}`);
  }

  let profile;
  try {
    profile = await fetchInstagramLoginProfile(accessToken);
  } catch (error) {
    throw new Error(instagramApiError(error, "Instagram did not return an account profile."));
  }

  if (String(profile.account_type || "").toUpperCase() === "PERSONAL") {
    throw new Error("Convert this Instagram account to Professional (Business or Creator), then connect again.");
  }

  const accountId = String(profile.user_id || profile.id || userId);
  if (!accountId) throw new Error("Instagram did not return an account id.");

  return {
    accessToken,
    expiresIn,
    accountId,
    username: profile.username || "",
    name: profile.name || "",
    avatar: profile.profile_picture_url || "",
    followersCount: profile.followers_count || 0,
  };
};

const refreshInstagramLoginToken = async (accountId) => {
  const account = await SocialAccount.findById(accountId).select("+accessToken authSource");
  if (!account || account.platform !== "instagram" || account.authSource !== "instagram_login") {
    throw new Error("Instagram login account not found.");
  }
  const current = decrypt(account.accessToken);
  let data;
  try {
    const response = await axios.get(`${IG_GRAPH}/refresh_access_token`, {
      params: {
        grant_type: "ig_refresh_token",
        access_token: current,
      },
    });
    data = response.data;
  } catch (error) {
    throw new Error(instagramApiError(error, "Instagram token refresh failed."));
  }
  if (!data?.access_token) throw new Error("Instagram did not return a refreshed token.");
  account.accessToken = encrypt(data.access_token);
  account.userAccessToken = encrypt(data.access_token);
  account.tokenIssuedAt = new Date();
  account.tokenExpiresAt = new Date(Date.now() + (Number(data.expires_in) || FB_PAGE_TOKEN_TTL_DAYS * 24 * 60 * 60) * 1000);
  account.lastTokenRefreshAttemptAt = new Date();
  account.lastTokenRefreshError = undefined;
  account.status = "connected";
  await account.save();
  return account;
};

const runInstagramLoginTokenRefreshJob = async () => {
  const accounts = await SocialAccount.find({
    platform: "instagram",
    status: "connected",
    authSource: "instagram_login",
  }).select("tokenIssuedAt createdAt tokenExpiresAt accountName");

  const due = accounts.filter((account) => isCronRefreshEligible(account.tokenIssuedAt, account.createdAt, account.tokenExpiresAt));
  let refreshed = 0;
  for (const account of due) {
    try {
      await refreshInstagramLoginToken(account._id);
      refreshed += 1;
    } catch (error) {
      logger.error(`Instagram login token refresh failed for ${account.accountName}: ${error.message}`);
      await SocialAccount.updateOne(
        { _id: account._id },
        { $set: { lastTokenRefreshAttemptAt: new Date(), lastTokenRefreshError: error.message } }
      );
    }
  }
  if (due.length) logger.info(`Instagram login token refresh finished — success: ${refreshed}, failed: ${due.length - refreshed}.`);
  return { checked: due.length, refreshed };
};

const ensureFreshInstagramLoginTokensForAccountIds = async (accountIds) => {
  if (!accountIds?.length) return { attempted: 0, succeeded: 0 };
  const ids = accountIds.map((id) => String(id?._id || id)).filter(Boolean);
  const accounts = await SocialAccount.find({
    _id: { $in: ids },
    platform: "instagram",
    status: "connected",
    authSource: "instagram_login",
  }).select("tokenIssuedAt createdAt tokenExpiresAt");

  const due = accounts.filter((account) =>
    shouldRefreshBeforePublish(account.tokenIssuedAt, account.createdAt, account.tokenExpiresAt)
  );
  const results = await Promise.allSettled(due.map((account) => refreshInstagramLoginToken(account._id)));
  return {
    attempted: due.length,
    succeeded: results.filter((result) => result.status === "fulfilled").length,
  };
};

const waitForInstagramContainer = async (graphBase, containerId, accessToken) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await axios.get(`${graphBase}/${containerId}`, {
      params: { fields: "status_code,status", access_token: accessToken },
    });
    if (!data.status_code || data.status_code === "FINISHED" || data.status_code === "PUBLISHED") return;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error(data.status || "Instagram rejected this media.");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
};

export {
  FB_GRAPH,
  FB_GRAPH_VERSION,
  IG_GRAPH,
  IG_GRAPH_API,
  createInstagramLoginUrl,
  ensureFreshInstagramLoginTokensForAccountIds,
  exchangeFacebookInstagramCode,
  exchangeInstagramLoginCode,
  fetchPagedGraph,
  getExplicitInstagramAppId,
  getInstagramAppId,
  getInstagramAppSecret,
  instagramApiError,
  instagramGraphBase,
  listFacebookPagesWithInstagram,
  refreshInstagramLoginToken,
  runInstagramLoginTokenRefreshJob,
  stripInstagramAuthCode,
  waitForInstagramContainer,
};
