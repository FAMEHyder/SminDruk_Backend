import axios from "axios";
import Media from "../models/media.model.js";
import PagePost from "../models/pagePost.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt } from "./encrypt.js";
import logger from "./logger.js";
import { recordPagePost } from "./pagePostRecord.js";
import { publishErrorMessage } from "./publishError.js";
import {
  ensureFreshThreadsTokensForAccountIds,
  getThreadsPermalink,
  THREADS_GRAPH_API,
  waitForThreadsContainer,
} from "./threads.js";

const createThreadsMediaContainer = async ({
  accountId,
  accessToken,
  content,
  mediaItem,
  isCarouselItem = false,
}) => {
  const isVideo = mediaItem?.fileType === "video";
  const params = {
    access_token: accessToken,
    ...(isCarouselItem ? { is_carousel_item: true } : { text: content || undefined }),
    ...(isVideo
      ? { media_type: "VIDEO", video_url: mediaItem.url }
      : { media_type: "IMAGE", image_url: mediaItem.url }),
  };

  const { data } = await axios.post(`${THREADS_GRAPH_API}/${accountId}/threads`, params);
  if (!data?.id) throw new Error("Threads did not return a media container ID.");
  await waitForThreadsContainer(data.id, accessToken);
  return data.id;
};

const createThreadsTextContainer = async ({ accountId, accessToken, content }) => {
  if (!content?.trim()) {
    throw new Error("Threads text post requires content.");
  }
  const { data } = await axios.post(`${THREADS_GRAPH_API}/${accountId}/threads`, {
    access_token: accessToken,
    media_type: "TEXT",
    text: content,
  });
  if (!data?.id) throw new Error("Threads did not return a text container ID.");
  return data.id;
};

const publishToThreadsAccount = async ({ account, content, media }) => {
  if (!account?.accountId) {
    throw new Error(`Threads account "${account?.accountName || "selected"}" is missing an account ID. Please reconnect your account.`);
  }

  const accessToken = decrypt(account.accessToken);
  const accountId = account.accountId;
  let containerId;

  if (!media || media.length === 0) {
    // Text-only Threads post
    containerId = await createThreadsTextContainer({ accountId, accessToken, content });
  } else if (media.length === 1) {
    // Single media (image or video)
    containerId = await createThreadsMediaContainer({
      accountId,
      accessToken,
      content,
      mediaItem: media[0],
      isCarouselItem: false,
    });
  } else {
    // Carousel post (up to 10 items)
    if (media.length > 10) {
      throw new Error("Threads supports up to 10 items in a carousel.");
    }
    const children = await Promise.all(
      media.map((item) =>
        createThreadsMediaContainer({
          accountId,
          accessToken,
          content,
          mediaItem: item,
          isCarouselItem: true,
        })
      )
    );
    const { data } = await axios.post(`${THREADS_GRAPH_API}/${accountId}/threads`, {
      access_token: accessToken,
      media_type: "CAROUSEL",
      children: children.join(","),
      text: content || undefined,
    });
    if (!data?.id) throw new Error("Threads did not return a carousel container ID.");
    containerId = data.id;
    await waitForThreadsContainer(containerId, accessToken);
  }

  const { data } = await axios.post(`${THREADS_GRAPH_API}/${accountId}/threads_publish`, {
    access_token: accessToken,
    creation_id: containerId,
  });
  if (!data?.id) throw new Error("Threads did not return a published thread ID.");

  const postLink = (await getThreadsPermalink(data.id, accessToken)) || (account.username ? `https://www.threads.net/@${account.username}` : undefined);
  return { postId: data.id, postLink };
};

const publishPostToThreadsAccounts = async (post) => {
  const accountIds = post.socialAccounts?.map((id) => String(id?._id || id)).filter(Boolean) || [];
  if (!accountIds.length) throw new Error("Select at least one Threads account for this post.");

  await ensureFreshThreadsTokensForAccountIds(accountIds);

  const accounts = await SocialAccount.find({
    _id: { $in: accountIds },
    workspace: post.workspace?._id ?? post.workspace,
    platform: "threads",
    status: "connected",
  }).select("+accessToken");

  if (!accounts.length) throw new Error("Selected Threads accounts were not found or are disconnected.");

  let media = post.media;
  if (media?.length && !media[0]?.url) {
    media = await Media.find({ _id: { $in: post.media } });
  }

  const results = [];
  for (const account of accounts) {
    try {
      const { postId, postLink } = await publishToThreadsAccount({
        account,
        content: post.content || "",
        media: media || [],
      });

      await PagePost.findOneAndUpdate(
        { socialAccount: account._id, platformPostId: postId },
        {
          workspace: post.workspace,
          post: post._id,
          socialAccount: account._id,
          pageName: account.accountName,
          pageId: account.accountId,
          platform: "threads",
          platformPostId: postId,
          postLink,
          postContent: post.content || "",
          profilePicture: account.avatar || "",
          success: true,
          error: undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      results.push({
        success: true,
        accountId: account._id,
        accountName: account.accountName,
        postId,
        postLink,
      });
    } catch (error) {
      const message = publishErrorMessage(error, error.message);
      logger.error(`Threads publish failed for ${account.accountName}: ${message}`);
      await recordPagePost({
        filter: { post: post._id, socialAccount: account._id },
        data: {
          workspace: post.workspace,
          post: post._id,
          socialAccount: account._id,
          pageName: account.accountName,
          pageId: account.accountId,
          platform: "threads",
          postContent: post.content || "",
          profilePicture: account.avatar || "",
          success: false,
          error: message,
        },
      });
      results.push({
        success: false,
        accountId: account._id,
        accountName: account.accountName,
        error: message,
      });
    }
  }

  return { results };
};

export { publishPostToThreadsAccounts, publishToThreadsAccount };
