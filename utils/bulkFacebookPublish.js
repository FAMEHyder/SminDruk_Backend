import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import ConnectedPage from "../models/connectedPage.model.js";
import PagePost from "../models/pagePost.model.js";
import Media from "../models/media.model.js";
import { decrypt } from "./encrypt.js";
import { buildFacebookPostLink } from "./facebookPostLink.js";
import logger from "./logger.js";

const FB_GRAPH_VERSION = "v19.0";

const waitBetweenPages = () =>
  new Promise((resolve) => setTimeout(resolve, 1500 + Math.floor(Math.random() * 1500)));

const publishConnectedPagePost = async ({ page, content, postType, mediaPath, mediaUrl }) => {
  const token = decrypt(page.pageAccessToken);
  const pageId = page.pageId;

  if ((postType === "photo" || postType === "story") && (mediaPath || mediaUrl)) {
    if (mediaPath) {
      const form = new FormData();
      form.append("source", fs.createReadStream(mediaPath));
      form.append("caption", content);
      form.append("access_token", token);
      const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/photos`, form, {
        headers: form.getHeaders(),
      });
      const postId = data.post_id || data.id;
      return { postId, postLink: buildFacebookPostLink(pageId, postId) };
    }

    const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/photos`, {
      url: mediaUrl,
      caption: content,
      access_token: token,
    });
    const postId = data.post_id || data.id;
    return { postId, postLink: buildFacebookPostLink(pageId, postId) };
  }

  if ((postType === "video" || postType === "reel") && (mediaPath || mediaUrl)) {
    if (mediaPath) {
      const form = new FormData();
      form.append("source", fs.createReadStream(mediaPath));
      form.append("access_token", token);
      const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/videos`, form, {
        headers: form.getHeaders(),
      });
      return { postId: data.id, postLink: buildFacebookPostLink(pageId, data.id) };
    }

    const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/videos`, {
      file_url: mediaUrl,
      description: content,
      access_token: token,
    });
    return { postId: data.id, postLink: buildFacebookPostLink(pageId, data.id) };
  }

  const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/feed`, {
    message: content,
    access_token: token,
  });
  return { postId: data.id, postLink: buildFacebookPostLink(pageId, data.id) };
};

/**
 * Publishes to ConnectedPage records in a page-number range (trending dataset).
 */
const executeBulkPublish = async ({
  workspaceId,
  secretKey,
  content,
  fromPage,
  toPage,
  postType = "text",
  mediaId,
  mediaPath,
}) => {
  const from = Number(fromPage);
  const to = Number(toPage);

  if (!secretKey?.trim()) throw new Error("Secret key is required.");
  if (!content?.trim()) throw new Error("Post content is required.");
  if (Number.isNaN(from) || Number.isNaN(to) || from < 1 || to < from) {
    throw new Error("Invalid page number range.");
  }

  let mediaUrl;
  if (mediaId) {
    const media = await Media.findById(mediaId);
    if (!media) throw new Error("Media file not found.");
    mediaUrl = media.url;
  }

  const pages = await ConnectedPage.find({
    workspace: workspaceId,
    status: "connected",
    pageNumber: { $gte: from, $lte: to },
  })
    .sort({ pageNumber: 1 })
    .select("+pageAccessToken");

  if (!pages.length) {
    throw new Error("No connected pages found in the selected page number range.");
  }

  const results = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    try {
      const { postId, postLink } = await publishConnectedPagePost({
        page,
        content,
        postType,
        mediaPath,
        mediaUrl,
      });

      await PagePost.create({
        workspace: workspaceId,
        connectedPage: page._id,
        secretKey: secretKey.trim(),
        pageNumber: page.pageNumber,
        pageName: page.pageName,
        pageId: page.pageId,
        profilePicture: page.profilePicture,
        platformPostId: postId,
        postLink,
        postContent: content,
        success: true,
      });

      results.push({
        success: true,
        pageNumber: page.pageNumber,
        pageName: page.pageName,
        postId,
        postLink,
      });
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      logger.error(`Bulk publish failed for page #${page.pageNumber}: ${message}`);

      await PagePost.create({
        workspace: workspaceId,
        connectedPage: page._id,
        secretKey: secretKey.trim(),
        pageNumber: page.pageNumber,
        pageName: page.pageName,
        pageId: page.pageId,
        profilePicture: page.profilePicture,
        postContent: content,
        success: false,
        error: message,
      });

      results.push({
        success: false,
        pageNumber: page.pageNumber,
        pageName: page.pageName,
        error: message,
      });
    }

    if (i < pages.length - 1) await waitBetweenPages();
  }

  const publishedCount = results.filter((item) => item.success).length;
  const failedCount = results.length - publishedCount;

  if (publishedCount === 0) {
    throw new Error(results[0]?.error || "Bulk publish failed for all selected pages.");
  }

  return { results, publishedCount, failedCount, total: results.length };
};

export { executeBulkPublish, publishConnectedPagePost };
