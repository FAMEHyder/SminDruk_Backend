import axios from "axios";
import crypto from "crypto";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt, encrypt } from "./encrypt.js";
import { getApiUrl, getEnv } from "./env.js";
import logger from "./logger.js";
import { isCronRefreshEligible, shouldRefreshBeforePublish } from "./tokenRefreshStatus.js";

const THREADS_AUTH_URL = "https://threads.net/oauth/authorize";
const THREADS_TOKEN_URL = "https://graph.threads.net/oauth/access_token";
const THREADS_GRAPH_BASE = "https://graph.threads.net";
const THREADS_GRAPH_API = "https://graph.threads.net/v1.0";
const THREADS_TOKEN_TTL_DAYS = 60;

const cleanEnvVal = (val) => (val ? String(val).replace(/^["']|["']$/g, "").trim() : "");

const getThreadsAppId = () =>
  cleanEnvVal(getEnv("THREADS_APP_ID", "Threads_app_ID", "THREADS_CLIENT_ID", "threads_app_id"));

const getThreadsAppSecret = () =>
  cleanEnvVal(getEnv("THREADS_APP_SECRET", "Threads_app_secret", "THREADS_CLIENT_SECRET", "threads_app_secret"));

const getThreadsCallbackUrl = () => {
  const fromEnv = cleanEnvVal(
    getEnv("THREADS_CALLBACK_URL", "threads_callback_url", "THREADS_REDIRECT_URI", "threads_redirect_uri")
  );
  if (fromEnv?.startsWith("http")) return fromEnv;
  return `${getApiUrl()}/api/v1/social-accounts/threads/callback`;
};

const stripThreadsAuthCode = (code) => String(code || "").replace(/#_$/, "").replace(/#.*$/, "").trim();

const threadsApiError = (error, fallback = "Threads request failed.") => {
  const data = error?.response?.data;
  if (typeof data?.error_message === "string" && data.error_message) return data.error_message;
  if (typeof data?.error?.message === "string" && data.error.message) return data.error.message;
  if (typeof data?.error_description === "string" && data.error_description) return data.error_description;
  if (typeof data?.error === "string" && data.error) return data.error;
  if (typeof data?.message === "string" && data.message) return data.message;
  return error?.message || fallback;
};

const createThreadsAuthorizationUrl = ({ clientId, redirectUri, state }) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "threads_basic,threads_content_publish",
    state,
  });
  return `${THREADS_AUTH_URL}?${params.toString()}`;
};

const exchangeThreadsCode = async ({ code, redirectUri }) => {
  const clientId = getThreadsAppId();
  const clientSecret = getThreadsAppSecret();
  if (!clientId || !clientSecret) {
    throw new Error("Threads App ID or App Secret is not configured in .env.");
  }

  const cleanCode = stripThreadsAuthCode(code);
  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code: cleanCode,
  });

  let shortPayload;
  try {
    const { data } = await axios.post(THREADS_TOKEN_URL, tokenBody.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    shortPayload = data;
  } catch (error) {
    throw new Error(threadsApiError(error, "Threads did not accept this authorization code."));
  }

  const shortToken = shortPayload?.access_token;
  const userId = String(shortPayload?.user_id || "");
  if (!shortToken) throw new Error("Threads did not return an access token.");

  let accessToken = shortToken;
  let expiresIn = THREADS_TOKEN_TTL_DAYS * 24 * 60 * 60;

  try {
    const longRes = await axios.get(`${THREADS_GRAPH_BASE}/access_token`, {
      params: {
        grant_type: "th_exchange_token",
        client_secret: clientSecret,
        access_token: shortToken,
      },
    });
    if (longRes.data?.access_token) {
      accessToken = longRes.data.access_token;
    }
    if (Number(longRes.data?.expires_in) > 0) {
      expiresIn = Number(longRes.data.expires_in);
    }
  } catch (error) {
    logger.warn(`Threads long-lived token exchange failed, using short token: ${threadsApiError(error, error.message)}`);
  }

  let profile;
  try {
    const { data } = await axios.get(`${THREADS_GRAPH_API}/me`, {
      params: {
        fields: "id,username,name,threads_profile_picture_url,threads_biography",
        access_token: accessToken,
      },
    });
    profile = data;
  } catch (error) {
    throw new Error(threadsApiError(error, "Threads did not return user profile."));
  }

  const accountId = String(profile?.id || userId);
  if (!accountId) throw new Error("Threads did not return a valid account ID.");

  return {
    accessToken,
    accountId,
    username: profile.username || "",
    accountName: profile.name || (profile.username ? `@${profile.username}` : "Threads account"),
    avatar: profile.threads_profile_picture_url || "",
    category: profile.threads_biography || "",
    expiresIn,
  };
};

const refreshThreadsToken = async (accountId) => {
  const account = await SocialAccount.findById(accountId).select("+accessToken");
  if (!account || account.platform !== "threads") {
    throw new Error("Threads account not found.");
  }
  const currentToken = decrypt(account.accessToken);

  let data;
  try {
    const response = await axios.get(`${THREADS_GRAPH_BASE}/refresh_access_token`, {
      params: {
        grant_type: "th_refresh_token",
        access_token: currentToken,
      },
    });
    data = response.data;
  } catch (error) {
    throw new Error(threadsApiError(error, "Threads token refresh failed."));
  }

  if (!data?.access_token) throw new Error("Threads did not return a refreshed token.");

  account.accessToken = encrypt(data.access_token);
  account.userAccessToken = encrypt(data.access_token);
  account.tokenIssuedAt = new Date();
  account.tokenExpiresAt = new Date(Date.now() + (Number(data.expires_in) || THREADS_TOKEN_TTL_DAYS * 24 * 60 * 60) * 1000);
  account.lastTokenRefreshAttemptAt = new Date();
  account.lastTokenRefreshError = undefined;
  account.status = "connected";
  await account.save();

  return account;
};

const runThreadsTokenRefreshJob = async () => {
  const accounts = await SocialAccount.find({
    platform: "threads",
    status: "connected",
  }).select("tokenIssuedAt createdAt tokenExpiresAt accountName");

  const due = accounts.filter((account) => isCronRefreshEligible(account.tokenIssuedAt, account.createdAt, account.tokenExpiresAt));
  let refreshed = 0;
  for (const account of due) {
    try {
      await refreshThreadsToken(account._id);
      refreshed += 1;
    } catch (error) {
      logger.error(`Threads token refresh failed for ${account.accountName}: ${error.message}`);
      await SocialAccount.updateOne(
        { _id: account._id },
        { $set: { lastTokenRefreshAttemptAt: new Date(), lastTokenRefreshError: error.message } }
      );
    }
  }
  if (due.length) logger.info(`Threads token refresh finished — success: ${refreshed}, failed: ${due.length - refreshed}.`);
  return { checked: due.length, refreshed };
};

const ensureFreshThreadsTokensForAccountIds = async (accountIds) => {
  if (!accountIds?.length) return { attempted: 0, succeeded: 0 };
  const ids = accountIds.map((id) => String(id?._id || id)).filter(Boolean);
  const accounts = await SocialAccount.find({
    _id: { $in: ids },
    platform: "threads",
    status: "connected",
  }).select("tokenIssuedAt createdAt tokenExpiresAt");

  const due = accounts.filter((account) =>
    shouldRefreshBeforePublish(account.tokenIssuedAt, account.createdAt, account.tokenExpiresAt)
  );
  const results = await Promise.allSettled(due.map((account) => refreshThreadsToken(account._id)));
  return {
    attempted: due.length,
    succeeded: results.filter((result) => result.status === "fulfilled").length,
  };
};

const waitForThreadsContainer = async (containerId, accessToken) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data } = await axios.get(`${THREADS_GRAPH_API}/${containerId}`, {
      params: { fields: "status,error_message", access_token: accessToken },
    });
    if (!data.status || data.status === "FINISHED" || data.status === "PUBLISHED") return;
    if (data.status === "ERROR" || data.status === "EXPIRED") {
      throw new Error(data.error_message || "Threads rejected this media.");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Threads took too long to process this media container. Please try again.");
};

const getThreadsPermalink = async (threadId, accessToken) => {
  try {
    const { data } = await axios.get(`${THREADS_GRAPH_API}/${threadId}`, {
      params: { fields: "permalink", access_token: accessToken },
    });
    return data.permalink || null;
  } catch {
    return null;
  }
};

const parseSignedRequest = (signedRequest, secret) => {
  if (!signedRequest || typeof signedRequest !== "string" || !signedRequest.includes(".")) {
    return null;
  }
  const [sigB64, payloadB64] = signedRequest.split(".");
  if (!payloadB64) return null;
  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const data = JSON.parse(jsonStr);
    if (secret && sigB64) {
      const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
      const actualSig = Buffer.from(sigB64, "base64url");
      if (actualSig.length === expectedSig.length && crypto.timingSafeEqual(actualSig, expectedSig)) {
        return data;
      }
    }
    return data;
  } catch {
    return null;
  }
};

export {
  THREADS_GRAPH_API,
  THREADS_TOKEN_TTL_DAYS,
  createThreadsAuthorizationUrl,
  ensureFreshThreadsTokensForAccountIds,
  exchangeThreadsCode,
  getThreadsAppId,
  getThreadsAppSecret,
  getThreadsCallbackUrl,
  getThreadsPermalink,
  parseSignedRequest,
  refreshThreadsToken,
  runThreadsTokenRefreshJob,
  stripThreadsAuthCode,
  threadsApiError,
  waitForThreadsContainer,
};
