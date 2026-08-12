import Post from "../models/post.model.js";
import { publishPostToFacebookPages } from "./facebookPublish.js";
import { publishPostToInstagramAccounts } from "./instagramPublish.js";
import { publishPostToLinkedInAccounts } from "./linkedinPublish.js";
import { publishPostToXAccounts } from "./xPublish.js";

/**
 * Executes publishing for a post document (Facebook Pages + future platforms).
 */
const executePublish = async (post) => {
  if (!post.media?.length || !post.media[0]?.url) {
    await post.populate("media");
  }

  const failures = [];

  // Ensure Map exists even if document was loaded oddly.
  if (!post.platformPostIds || typeof post.platformPostIds.set !== "function") {
    post.platformPostIds = new Map();
  }

  if (post.platforms.includes("facebook")) {
    const { results } = await publishPostToFacebookPages(post);

    for (const result of results) {
      if (result.success && result.postId) {
        post.platformPostIds.set(`facebook_${result.pageId}`, result.postId);
      } else if (!result.success) {
        failures.push(`${result.pageName}: ${result.error}`);
      }
    }

    if (results.length > 0 && results.every((result) => !result.success)) {
      throw new Error(failures[0] || "Facebook publish failed for all selected pages.");
    }
  }

  if (post.platforms.includes("instagram")) {
    const { results } = await publishPostToInstagramAccounts(post);
    for (const result of results) {
      if (result.success && result.postId) {
        post.platformPostIds.set(`instagram_${result.accountId}`, result.postId);
      } else if (!result.success) {
        failures.push(`${result.accountName}: ${result.error}`);
      }
    }
    if (results.length > 0 && results.every((result) => !result.success)) {
      throw new Error(failures[0] || "Instagram publish failed for all selected accounts.");
    }
  }

  if (post.platforms.includes("linkedin")) {
    const { results } = await publishPostToLinkedInAccounts(post);
    for (const result of results) {
      if (result.success && result.postId) {
        post.platformPostIds.set(`linkedin_${result.accountId}`, result.postId);
      } else if (!result.success) {
        failures.push(`${result.accountName}: ${result.error}`);
      }
    }
    if (results.length > 0 && results.every((result) => !result.success)) {
      throw new Error(failures[0] || "LinkedIn publish failed for all selected accounts.");
    }
  }

  if (post.platforms.includes("x")) {
    const { results } = await publishPostToXAccounts(post);
    for (const result of results) {
      if (result.success && result.postId) {
        post.platformPostIds.set(`x_${result.accountId}`, result.postId);
      } else if (!result.success) {
        failures.push(`${result.accountName}: ${result.error}`);
      }
    }
    if (results.length > 0 && results.every((result) => !result.success)) {
      throw new Error(failures[0] || "X publish failed for all selected accounts.");
    }
  }

  const unsupported = post.platforms.filter((platform) => !["facebook", "instagram", "linkedin", "x"].includes(platform));
  if (unsupported.length > 0) {
    failures.push(`Not yet supported: ${unsupported.join(", ")}`);
  }

  const publishedIds = post.platformPostIds?.size || 0;
  post.status = failures.length && !publishedIds ? "failed" : "published";
  post.publishedAt = new Date();
  post.failureReason = failures.length ? failures.join("; ") : undefined;
  await post.save();

  if (post.status === "failed") {
    throw new Error(post.failureReason || "Publish failed.");
  }

  return post;
};

const executePublishById = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found.");
  return executePublish(post);
};

export { executePublish, executePublishById };
