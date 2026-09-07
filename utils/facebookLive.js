import axios from "axios";
import { decrypt } from "./encrypt.js";
import logger from "./logger.js";

const FB_GRAPH_VERSION = "v21.0";
const LIVE_FIELDS = "id,stream_url,secure_stream_url,permalink_url,status";

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

const graphPost = (url, payload, params) =>
  axios.post(url, new URLSearchParams(payload).toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    params,
  });

const fetchLiveFromPageList = async (pageId, liveVideoId, token) => {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/live_videos`, {
      params: {
        access_token: token,
        fields: LIVE_FIELDS,
        broadcast_status: '["UNPUBLISHED","LIVE_NOW","LIVE","SCHEDULED_UNPUBLISHED"]',
      },
    });
    return (data.data || []).find((item) => String(item.id) === String(liveVideoId)) || {};
  } catch (error) {
    logger.warn(`Could not list live videos for page ${pageId}: ${error.message}`);
    return {};
  }
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
  const payload = {
    access_token: token,
    status: broadcastStatus,
    title: title?.trim() || "Live video",
    description: description?.trim() || "",
  };
  if (broadcastStatus === "SCHEDULED_UNPUBLISHED" && scheduledAt) {
    payload.planned_start_time = String(Math.floor(new Date(scheduledAt).getTime() / 1000));
  }

  // Page live uses the Page token + pages_manage_posts / pages_read_engagement.
  // Do not GET /{live-id} afterward — that endpoint asks for publish_video, which Live-mode apps
  // cannot grant even to app admins until App Review.
  const { data } = await graphPost(
    `https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/live_videos`,
    payload,
    { fields: LIVE_FIELDS }
  );
  const liveVideoId = data.id;
  if (!liveVideoId) throw new Error("Facebook did not return a live video ID.");

  let details = data;
  if (!details.secure_stream_url && !details.stream_url) {
    details = { ...details, ...(await fetchLiveFromPageList(pageId, liveVideoId, token)) };
  }

  return {
    liveVideoId,
    streamUrl: details.stream_url || data.stream_url || "",
    secureStreamUrl: details.secure_stream_url || data.secure_stream_url || "",
    permalink: normalizePermalink(pageId, liveVideoId, details.permalink_url),
  };
};

const liveErrorMessage = (error) => {
  const graphError = error?.response?.data?.error;
  const subcode = Number(graphError?.error_subcode);
  if (typeof graphError?.error_user_msg === "string" && graphError.error_user_msg.trim()) {
    return graphError.error_user_msg.trim();
  }
  if (subcode === 1363120) {
    return "This Facebook Page cannot go live yet. The Page must be at least 60 days old.";
  }
  if (subcode === 1363144) {
    return "This Facebook Page needs at least 100 followers before it can go live.";
  }

  const message = graphError?.message || error?.response?.data?.message || error?.message || "";
  const text = String(message).toLowerCase();
  if (
    text.includes("publish_video") ||
    text.includes("live video api") ||
    text.includes("(#10)") ||
    Number(graphError?.code) === 10 ||
    (Number(graphError?.code) === 200 && text.includes("permission"))
  ) {
    return "Facebook Page live uses your existing Page posting permission. If this still fails, add Live Video API in Meta App Dashboard. Live-mode apps block that product for everyone, including admins, until it is approved; Development mode allows app admins without App Review.";
  }

  return message || "Could not start this live video.";
};

export { createFacebookLiveOnPage, liveErrorMessage, waitBetweenPages };
