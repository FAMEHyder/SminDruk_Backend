import axios from "axios";
import Media from "../models/media.model.js";
import PagePost from "../models/pagePost.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt } from "./encrypt.js";
import logger from "./logger.js";

const FB_GRAPH_VERSION = "v19.0";

const getInstagramPermalink = async (mediaId, accessToken) => {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${mediaId}`, {
      params: { fields: "permalink", access_token: accessToken },
    });
    return data.permalink || null;
  } catch {
    return null;
  }
};

const createContainer = async ({ accountId, accessToken, content, media, isCarouselItem = false }) => {
  const params = {
    access_token: accessToken,
    caption: isCarouselItem ? undefined : content,
    ...(media.fileType === "video"
      ? { media_type: "REELS", video_url: media.url }
      : { image_url: media.url }),
    ...(isCarouselItem ? { is_carousel_item: true } : {}),
  };
  const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${accountId}/media`, params);
  if (!data.id) throw new Error("Instagram did not return a media container ID.");
  return data.id;
};

const publishToInstagramAccount = async ({ account, content, media }) => {
  if (!media.length) throw new Error("Instagram posts require at least one image or video.");
  if (media.length > 10) throw new Error("Instagram supports up to 10 items in a carousel.");
  if (media.filter((item) => item.fileType === "video").length > 1 || (media.length > 1 && media.some((item) => item.fileType === "video"))) {
    throw new Error("Instagram supports one video or up to 10 images per post.");
  }

  const accessToken = decrypt(account.accessToken);
  let containerId;
  if (media.length === 1) {
    containerId = await createContainer({ accountId: account.accountId, accessToken, content, media: media[0] });
  } else {
    const children = await Promise.all(
      media.map((item) => createContainer({ accountId: account.accountId, accessToken, content, media: item, isCarouselItem: true }))
    );
    const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${account.accountId}/media`, {
      access_token: accessToken,
      media_type: "CAROUSEL",
      caption: content,
      children,
    });
    containerId = data.id;
  }

  const { data } = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${account.accountId}/media_publish`, {
    access_token: accessToken,
    creation_id: containerId,
  });
  if (!data.id) throw new Error("Instagram did not return a published media ID.");
  return { postId: data.id, postLink: await getInstagramPermalink(data.id, accessToken) };
};

const publishPostToInstagramAccounts = async (post) => {
  const accountIds = post.socialAccounts?.map((id) => String(id?._id || id)).filter(Boolean) || [];
  if (!accountIds.length) throw new Error("Select at least one Instagram account for this post.");

  const accounts = await SocialAccount.find({
    _id: { $in: accountIds },
    workspace: post.workspace?._id ?? post.workspace,
    platform: "instagram",
    status: "connected",
  }).select("+accessToken");
  if (!accounts.length) throw new Error("Selected Instagram accounts were not found or are disconnected.");

  let media = post.media;
  if (media?.length && !media[0]?.url) media = await Media.find({ _id: { $in: post.media } });

  const results = [];
  for (const account of accounts) {
    try {
      const { postId, postLink } = await publishToInstagramAccount({ account, content: post.content || "", media: media || [] });
      await PagePost.findOneAndUpdate(
        { socialAccount: account._id, platformPostId: postId },
        {
          workspace: post.workspace,
          post: post._id,
          socialAccount: account._id,
          pageName: account.accountName,
          pageId: account.accountId,
          platform: "instagram",
          platformPostId: postId,
          postLink,
          postContent: post.content || "",
          profilePicture: account.avatar || "",
          success: true,
          error: undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ success: true, accountId: account._id, accountName: account.accountName, postId, postLink });
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      logger.error(`Instagram publish failed for ${account.accountName}: ${message}`);
      await PagePost.create({
        workspace: post.workspace,
        post: post._id,
        socialAccount: account._id,
        pageName: account.accountName,
        pageId: account.accountId,
        platform: "instagram",
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

export { publishPostToInstagramAccounts };
