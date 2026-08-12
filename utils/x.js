import axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Analytics from "../models/analytics.model.js";
import PagePost from "../models/pagePost.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt, encrypt } from "./encrypt.js";
import { getEnv, getFrontendUrl, getJwtSecret } from "./env.js";

const X_API_URL = "https://api.x.com/2";
const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const REFRESH_AHEAD_MS = 10 * 24 * 60 * 60 * 1000;

const getXConfig = () => {
  const clientId = getEnv("X_CLIENT_ID");
  const clientSecret = getEnv("X_CLIENT_SECRET");
  const callbackUrl = getEnv("X_CALLBACK_URL");

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("X OAuth is not configured. Set X_CLIENT_ID, X_CLIENT_SECRET, and X_CALLBACK_URL.");
  }

  return { clientId, clientSecret, callbackUrl };
};

// HTTP Basic authentication requires RFC 4648 Base64, not the URL-safe
// Base64URL encoding used by PKCE/JWT values.
const basicAuth = (value) => Buffer.from(value).toString("base64");
const createCodeVerifier = () => crypto.randomBytes(48).toString("base64url");
const createCodeChallenge = (verifier) => crypto.createHash("sha256").update(verifier).digest("base64url");
const buildXPostLink = (username, postId) => (username && postId ? `https://x.com/${username.replace(/^@/, "")}/status/${postId}` : null);

const createXAuthorizationUrl = ({ workspaceId, userId, returnTo, connectMode = "manage" }) => {
  const { clientId, callbackUrl } = getXConfig();
  const codeVerifier = createCodeVerifier();
  const state = jwt.sign({ workspaceId, userId, returnTo, connectMode, codeVerifier }, getJwtSecret(), { expiresIn: "10m" });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "tweet.read tweet.write media.write users.read offline.access",
    state,
    code_challenge: createCodeChallenge(codeVerifier),
    code_challenge_method: "S256",
  });
  return `${X_AUTHORIZE_URL}?${params.toString()}`;
};

const exchangeXCode = async ({ code, state }) => {
  const { clientId, clientSecret, callbackUrl } = getXConfig();
  const payload = jwt.verify(state, getJwtSecret());
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: callbackUrl,
    code_verifier: payload.codeVerifier,
  });
  const tokenResponse = await axios.post("https://api.x.com/2/oauth2/token", body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth(`${clientId}:${clientSecret}`)}`,
    },
  });
  return { state: payload, tokens: tokenResponse.data };
};

const refreshXTokensForAccount = async (accountId) => {
  const account = await SocialAccount.findById(accountId).select("+accessToken +refreshToken");
  if (!account || account.platform !== "x") throw new Error("X account not found.");
  if (!account.refreshToken) throw new Error("X account has no refresh token. Reconnect the account.");

  const { clientId, clientSecret } = getXConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: decrypt(account.refreshToken),
    client_id: clientId,
  });

  try {
    const { data } = await axios.post("https://api.x.com/2/oauth2/token", body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth(`${clientId}:${clientSecret}`)}`,
      },
    });
    account.accessToken = encrypt(data.access_token);
    if (data.refresh_token) account.refreshToken = encrypt(data.refresh_token);
    account.tokenIssuedAt = new Date();
    account.tokenExpiresAt = new Date(Date.now() + (data.expires_in || 7200) * 1000);
    account.lastTokenRefreshAttemptAt = new Date();
    account.lastTokenRefreshError = undefined;
    account.status = "connected";
    await account.save();
    return account;
  } catch (error) {
    account.lastTokenRefreshAttemptAt = new Date();
    account.lastTokenRefreshError = error.response?.data?.detail || error.response?.data?.title || error.message;
    await account.save();
    throw error;
  }
};

const getUsableXAccount = async (account) => {
  const needsRefresh = !account.tokenExpiresAt || account.tokenExpiresAt.getTime() <= Date.now() + REFRESH_AHEAD_MS;
  const current = needsRefresh ? await refreshXTokensForAccount(account._id) : account;
  return { account: current, token: decrypt(current.accessToken) };
};

const syncXPostsForAccount = async (accountId) => {
  const account = await SocialAccount.findById(accountId).select("+accessToken +refreshToken");
  if (!account || account.platform !== "x") throw new Error("X account not found.");
  const { account: current, token } = await getUsableXAccount(account);
  const username = current.username || current.accountName.replace(/^@/, "");

  const { data } = await axios.get(`${X_API_URL}/users/${current.accountId}/tweets`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { max_results: 100, "tweet.fields": "created_at,public_metrics" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followers = current.followersCount || 0;

  for (const tweet of data.data || []) {
    const metrics = tweet.public_metrics || {};
    const pagePost = await PagePost.findOneAndUpdate(
      { socialAccount: current._id, platformPostId: tweet.id },
      {
        workspace: current.workspace,
        socialAccount: current._id,
        pageName: current.accountName,
        pageId: current.accountId,
        platform: "x",
        platformPostId: tweet.id,
        postLink: buildXPostLink(username, tweet.id),
        postContent: tweet.text || "",
        profilePicture: current.avatar || "",
        success: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Analytics.findOneAndUpdate(
      { workspace: current.workspace, socialAccount: current._id, post: pagePost.post, platform: "x", period: "daily", date: today },
      {
        workspace: current.workspace,
        socialAccount: current._id,
        post: pagePost.post,
        platform: "x",
        period: "daily",
        date: today,
        metrics: {
          likes: metrics.like_count || 0,
          shares: (metrics.retweet_count || 0) + (metrics.quote_count || 0),
          comments: metrics.reply_count || 0,
          impressions: metrics.impression_count || 0,
          followers,
        },
      },
      { new: true, upsert: true }
    );
  }

  current.lastSyncedAt = new Date();
  await current.save();
  return data.data || [];
};

const runXTokenRefreshJob = async () => {
  const cutoff = new Date(Date.now() + REFRESH_AHEAD_MS);
  const accounts = await SocialAccount.find({
    platform: "x",
    status: "connected",
    $or: [{ tokenExpiresAt: { $lte: cutoff } }, { tokenExpiresAt: null }],
  }).select("+accessToken +refreshToken");

  const results = await Promise.allSettled(accounts.map((account) => refreshXTokensForAccount(account._id)));
  return { checked: accounts.length, refreshed: results.filter((result) => result.status === "fulfilled").length };
};

const getXFrontendUrl = (status, frontendUrl = getFrontendUrl()) =>
  `${frontendUrl}/dashboard/connect-channels?x=${status}`;

export {
  X_API_URL,
  buildXPostLink,
  createXAuthorizationUrl,
  exchangeXCode,
  getUsableXAccount,
  getXFrontendUrl,
  refreshXTokensForAccount,
  runXTokenRefreshJob,
  syncXPostsForAccount,
};
