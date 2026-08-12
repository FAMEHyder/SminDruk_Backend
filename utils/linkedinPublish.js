import axios from "axios";
import PagePost from "../models/pagePost.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import { decrypt } from "./encrypt.js";
import logger from "./logger.js";

const LINKEDIN_API_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_VERSION = "202501";
const buildLinkedInPostLink = (postId) => `https://www.linkedin.com/feed/update/${decodeURIComponent(postId)}`;

const publishPostToLinkedInAccounts = async (post) => {
  const accountIds = post.socialAccounts?.map((id) => String(id?._id || id)).filter(Boolean) || [];
  if (!accountIds.length) throw new Error("Select at least one LinkedIn account for this post.");
  if (post.media?.length) throw new Error("LinkedIn media publishing is not enabled for this app yet. Publish text-only posts to LinkedIn.");

  const accounts = await SocialAccount.find({
    _id: { $in: accountIds },
    workspace: post.workspace?._id ?? post.workspace,
    platform: "linkedin",
    status: "connected",
  }).select("+accessToken");
  if (!accounts.length) throw new Error("Selected LinkedIn accounts were not found or are disconnected.");

  const results = [];
  for (const account of accounts) {
    try {
      const token = decrypt(account.accessToken);
      const { headers } = await axios.post(
        LINKEDIN_API_URL,
        {
          author: `urn:li:person:${account.accountId}`,
          commentary: post.content || "",
          visibility: "PUBLIC",
          distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Linkedin-Version": LINKEDIN_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
          },
        }
      );
      const postId = headers["x-restli-id"] || headers["x-linkedin-id"];
      if (!postId) throw new Error("LinkedIn did not return a published post ID.");
      const postLink = buildLinkedInPostLink(postId);

      await PagePost.findOneAndUpdate(
        { socialAccount: account._id, platformPostId: postId },
        {
          workspace: post.workspace,
          post: post._id,
          socialAccount: account._id,
          pageName: account.accountName,
          pageId: account.accountId,
          platform: "linkedin",
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
      const message = error.response?.data?.message || error.message;
      logger.error(`LinkedIn publish failed for ${account.accountName}: ${message}`);
      await PagePost.create({
        workspace: post.workspace,
        post: post._id,
        socialAccount: account._id,
        pageName: account.accountName,
        pageId: account.accountId,
        platform: "linkedin",
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

export { buildLinkedInPostLink, publishPostToLinkedInAccounts };
