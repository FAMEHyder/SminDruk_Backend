import axios from "axios";
import Analytics from "../models/analytics.model.js";
import PagePost from "../models/pagePost.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import ConnectedPage from "../models/connectedPage.model.js";
import { decrypt } from "./encrypt.js";
import logger from "./logger.js";

const FB_GRAPH_VERSION = "v19.0";

const startOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

async function resolvePageToken(workspaceId, pagePost) {
  if (pagePost.socialAccount) {
    const account = await SocialAccount.findById(pagePost.socialAccount).select("+accessToken");
    if (account?.accessToken) return decrypt(account.accessToken);
  }

  if (pagePost.connectedPage) {
    const page = await ConnectedPage.findById(pagePost.connectedPage).select("+pageAccessToken");
    if (page?.pageAccessToken) return decrypt(page.pageAccessToken);
  }

  const account = await SocialAccount.findOne({
    workspace: workspaceId,
    platform: "facebook",
    accountId: pagePost.pageId,
    status: "connected",
  }).select("+accessToken");
  if (account?.accessToken) return decrypt(account.accessToken);

  const connected = await ConnectedPage.findOne({
    workspace: workspaceId,
    pageId: pagePost.pageId,
    status: "connected",
  }).select("+pageAccessToken");
  if (connected?.pageAccessToken) return decrypt(connected.pageAccessToken);

  return null;
}

function normalizeFacebookObjectId(pageId, platformPostId) {
  if (!platformPostId) return null;
  if (String(platformPostId).includes("_")) return String(platformPostId);
  if (pageId) return `${pageId}_${platformPostId}`;
  return String(platformPostId);
}

/**
 * Pulls live Facebook engagement for published page posts and upserts Analytics rows.
 */
export async function syncWorkspaceFacebookAnalytics(workspaceId, { limit = 40 } = {}) {
  const pagePosts = await PagePost.find({
    workspace: workspaceId,
    success: true,
    platformPostId: { $exists: true, $nin: [null, ""] },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  let synced = 0;

  for (const pagePost of pagePosts) {
    try {
      const token = await resolvePageToken(workspaceId, pagePost);
      if (!token) continue;

      const objectId = normalizeFacebookObjectId(pagePost.pageId, pagePost.platformPostId);
      if (!objectId) continue;

      const { data } = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${objectId}`, {
        params: {
          fields: "reactions.summary(true),comments.summary(true),shares",
          access_token: token,
        },
        timeout: 12000,
      });

      const likes = data.reactions?.summary?.total_count || 0;
      const comments = data.comments?.summary?.total_count || 0;
      const shares = data.shares?.count || 0;
      const engagement = likes + comments + shares;

      await Analytics.findOneAndUpdate(
        {
          workspace: workspaceId,
          platform: "facebook",
          period: "daily",
          date: startOfDay(pagePost.createdAt),
          post: pagePost.post || pagePost._id,
        },
        {
          $set: {
            socialAccount: pagePost.socialAccount || undefined,
            metrics: {
              likes,
              shares,
              comments,
              reach: engagement,
              impressions: engagement,
              clicks: 0,
              followers: 0,
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      synced += 1;
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      logger.warn(`Facebook insights sync failed for pagePost ${pagePost._id}: ${message}`);
    }
  }

  return { synced, scanned: pagePosts.length };
}
