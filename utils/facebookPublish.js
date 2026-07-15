import axios from "axios";
import SocialAccount from "../models/socialAccount.model.js";
import Media from "../models/media.model.js";
import PagePost from "../models/pagePost.model.js";
import { decrypt } from "./encrypt.js";
import logger from "./logger.js";

const FB_GRAPH_VERSION = "v19.0";

const waitBetweenPages = () =>
  new Promise((resolve) => setTimeout(resolve, 1500 + Math.floor(Math.random() * 1500)));

/**
 * Publishes content to a single Facebook Page using its encrypted page access token.
 */
const publishToFacebookPage = async ({ account, content, type, mediaUrls }) => {
  let token;
  try {
    token = decrypt(account.accessToken);
  } catch {
    throw new Error(`Token decrypt failed for page ${account.accountName}`);
  }

  const pageId = account.accountId;
  const hasMedia = mediaUrls.length > 0;

  if ((type === "video" || type === "reel") && hasMedia) {
    const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/videos`, {
      file_url: mediaUrls[0],
      description: content,
      access_token: token,
    });
    const postId = data.id;
    return { postId, postLink: postId ? `https://www.facebook.com/${postId}` : null };
  }

  if ((type === "image" || type === "story" || type === "carousel") && hasMedia) {
    const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/photos`, {
      url: mediaUrls[0],
      caption: content,
      access_token: token,
    });
    const postId = data.post_id || data.id;
    return { postId, postLink: postId ? `https://www.facebook.com/${postId}` : null };
  }

  const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/feed`, {
    message: content,
    access_token: token,
  });
  const postId = data.id;
  return { postId, postLink: postId ? `https://www.facebook.com/${postId}` : null };
};

/**
 * Publishes a workspace post to the selected Facebook Page social accounts.
 */
const publishPostToFacebookPages = async (post) => {
  const accountIds = post.socialAccounts?.map(String) || [];
  if (!accountIds.length) {
    throw new Error("No Facebook pages selected for this post.");
  }

  const accounts = await SocialAccount.find({
    _id: { $in: accountIds },
    workspace: post.workspace?._id ?? post.workspace,
    platform: "facebook",
    status: "connected",
  }).select("+accessToken");

  if (!accounts.length) {
    throw new Error("Selected Facebook pages were not found or are disconnected.");
  }

  let mediaDocs = post.media;
  if (mediaDocs?.length && !mediaDocs[0]?.url) {
    mediaDocs = await Media.find({ _id: { $in: post.media } });
  }
  const mediaUrls = (mediaDocs || []).map((item) => item.url).filter(Boolean);

  const results = [];

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    try {
      const { postId, postLink } = await publishToFacebookPage({
        account,
        content: post.content,
        type: post.type,
        mediaUrls,
      });

      await PagePost.create({
        workspace: post.workspace,
        post: post._id,
        socialAccount: account._id,
        pageName: account.accountName,
        pageId: account.accountId,
        platformPostId: postId,
        postLink,
        success: true,
      });

      results.push({
        success: true,
        accountId: account._id,
        pageId: account.accountId,
        pageName: account.accountName,
        postId,
        postLink,
      });
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      logger.error(`Facebook publish failed for page ${account.accountName}: ${message}`);

      await PagePost.create({
        workspace: post.workspace,
        post: post._id,
        socialAccount: account._id,
        pageName: account.accountName,
        pageId: account.accountId,
        success: false,
        error: message,
      });

      results.push({
        success: false,
        accountId: account._id,
        pageId: account.accountId,
        pageName: account.accountName,
        error: message,
      });
    }

    if (i < accounts.length - 1) {
      await waitBetweenPages();
    }
  }

  return { results };
};

export { publishToFacebookPage, publishPostToFacebookPages };
