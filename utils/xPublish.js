import axios from "axios";
import Media from "../models/media.model.js";
import PagePost from "../models/pagePost.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import { X_API_URL, buildXPostLink, getUsableXAccount } from "./x.js";
import logger from "./logger.js";

const MAX_X_IMAGES = 4;
const MAX_X_VIDEO_BYTES = 512 * 1024 * 1024;

const xUploadError = async (response) => {
  const data = await response.json().catch(() => ({}));
  return data?.detail || data?.title || data?.errors?.[0]?.message || `X media upload failed (${response.status}).`;
};

const waitForXMediaProcessing = async ({ mediaId, token, processingInfo }) => {
  let info = processingInfo;
  for (let attempt = 0; info?.state === "pending" || info?.state === "in_progress"; attempt += 1) {
    if (attempt >= 12) throw new Error("X media processing timed out.");
    const delayMs = Math.max(1, Number(info.check_after_secs) || 2) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const response = await fetch(
      `${X_API_URL}/media/upload?command=STATUS&media_id=${encodeURIComponent(mediaId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(await xUploadError(response));
    const data = await response.json();
    info = data?.data?.processing_info || data?.processing_info;
  }
  if (info?.state === "failed") {
    throw new Error(info.error?.message || "X could not process this media.");
  }
};

const uploadMediaToX = async ({ media, token }) => {
  const download = await axios.get(media.url, { responseType: "arraybuffer" });
  const bytes = Buffer.from(download.data);
  const contentType = media.mimeType || download.headers["content-type"] || "application/octet-stream";
  const isVideo = media.fileType === "video";

  if (isVideo && bytes.length > MAX_X_VIDEO_BYTES) {
    throw new Error("X videos must be 512 MB or smaller.");
  }

  const form = new FormData();
  form.append("media", new Blob([bytes], { type: contentType }), media.fileName || "upload");
  form.append("media_category", isVideo ? "tweet_video" : "tweet_image");

  const response = await fetch(`${X_API_URL}/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) throw new Error(await xUploadError(response));

  const data = await response.json();
  const mediaId = data?.data?.id || data?.data?.media_id || data?.media_id;
  if (!mediaId) throw new Error("X did not return a media ID.");
  await waitForXMediaProcessing({
    mediaId: String(mediaId),
    token,
    processingInfo: data?.data?.processing_info || data?.processing_info,
  });
  return String(mediaId);
};

const publishPostToXAccounts = async (post) => {
  const accountIds = post.socialAccounts?.map((id) => String(id?._id || id)).filter(Boolean) || [];
  if (!accountIds.length) throw new Error("Select at least one X account for this post.");

  const accounts = await SocialAccount.find({
    _id: { $in: accountIds },
    workspace: post.workspace?._id ?? post.workspace,
    platform: "x",
    status: "connected",
  }).select("+accessToken +refreshToken");
  if (!accounts.length) throw new Error("Selected X accounts were not found or are disconnected.");

  const mediaIds = post.media?.map((item) => item?._id || item).filter(Boolean) || [];
  const media = mediaIds.length ? await Media.find({ _id: { $in: mediaIds } }) : [];
  const videos = media.filter((item) => item.fileType === "video");
  if (videos.length > 1 || (videos.length && media.length > 1)) {
    throw new Error("X supports one video or up to four images per post.");
  }
  if (!videos.length && media.length > MAX_X_IMAGES) {
    throw new Error("X supports up to four images per post.");
  }
  if (!post.content?.trim()) throw new Error("X posts need text content.");
  if (post.content.length > 280) throw new Error("X posts cannot exceed 280 characters.");

  const results = [];
  for (const account of accounts) {
    try {
      const { account: current, token } = await getUsableXAccount(account);
      const mediaIdsForX = await Promise.all(media.map((item) => uploadMediaToX({ media: item, token })));
      const { data } = await axios.post(
        `${X_API_URL}/tweets`,
        {
          text: post.content,
          ...(mediaIdsForX.length ? { media: { media_ids: mediaIdsForX } } : {}),
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      const tweetId = data?.data?.id;
      if (!tweetId) throw new Error("X did not return a post ID.");

      const username = current.username || current.accountName.replace(/^@/, "");
      const postLink = buildXPostLink(username, tweetId);
      await PagePost.findOneAndUpdate(
        { socialAccount: current._id, platformPostId: tweetId },
        {
          workspace: post.workspace,
          post: post._id,
          socialAccount: current._id,
          pageName: current.accountName,
          pageId: current.accountId,
          platform: "x",
          platformPostId: tweetId,
          postLink,
          postContent: post.content,
          profilePicture: current.avatar || "",
          success: true,
          error: undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ success: true, accountId: current._id, accountName: current.accountName, postId: tweetId, postLink });
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.title || error.message;
      logger.error(`X publish failed for ${account.accountName}: ${message}`);
      await PagePost.create({
        workspace: post.workspace,
        post: post._id,
        socialAccount: account._id,
        pageName: account.accountName,
        pageId: account.accountId,
        platform: "x",
        postContent: post.content || "",
        profilePicture: account.avatar || "",
        success: false,
        error: message,
      });
      results.push({ success: false, accountId: account._id, accountName: account.accountName, error: message });
    }
  }
  return { results };
};

export { publishPostToXAccounts };
