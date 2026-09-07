import axios from "axios";
import { decrypt } from "./encrypt.js";
import logger from "./logger.js";

const FB_GRAPH_VERSION = "v19.0";

const waitBetweenPages = () =>
  new Promise((resolve) => setTimeout(resolve, 1500 + Math.floor(Math.random() * 1500)));

const normalizePermalink = (pageId, liveVideoId, permalinkUrl) => {
  if (permalinkUrl) {
    if (permalinkUrl.startsWith("http")) return permalinkUrl;
    return `https://www.facebook.com${permalinkUrl.startsWith("/") ? "" : "/"}${permalinkUrl}`;
  }
  if (liveVideoId) return `https://www.facebook.com/${pageId}/videos/${liveVideoId}`;
  return null;
};

const createFacebookLiveOnPage = async ({
  pageId,
  encryptedToken,
  title,
  description,
  broadcastStatus = "LIVE_NOW",
  scheduledAt,
}) => {
  const token = decrypt(encryptedToken);
  const params = {
    access_token: token,
    status: broadcastStatus,
    title: title?.trim() || "Live video",
    description: description?.trim() || "",
  };
  if (broadcastStatus === "SCHEDULED_UNPUBLISHED" && scheduledAt) {
    params.planned_start_time = Math.floor(new Date(scheduledAt).getTime() / 1000);
  }

  const { data } = await axios.post(
    `https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/live_videos`,
    null,
    { params }
  );
  const liveVideoId = data.id;
  if (!liveVideoId) throw new Error("Facebook did not return a live video ID.");

  let details = {};
  try {
    const detailRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${liveVideoId}`, {
      params: {
        access_token: token,
        fields: "id,stream_url,secure_stream_url,permalink_url,status",
      },
    });
    details = detailRes.data || {};
  } catch (error) {
    logger.warn(`Could not fetch live video details for ${liveVideoId}: ${error.message}`);
  }

  return {
    liveVideoId,
    streamUrl: details.stream_url || data.stream_url || "",
    secureStreamUrl: details.secure_stream_url || data.secure_stream_url || "",
    permalink: normalizePermalink(pageId, liveVideoId, details.permalink_url),
  };
};

const liveErrorMessage = (error) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.error_description ||
  error?.response?.data?.message ||
  error?.message ||
  "Could not start this live video.";

export { createFacebookLiveOnPage, liveErrorMessage, waitBetweenPages };
