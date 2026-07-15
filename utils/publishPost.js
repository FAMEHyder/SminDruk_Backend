import Post from "../models/post.model.js";
import { publishPostToFacebookPages } from "./facebookPublish.js";

/**
 * Executes publishing for a post document (Facebook Pages + future platforms).
 */
const executePublish = async (post) => {
  if (!post.media?.length || !post.media[0]?.url) {
    await post.populate("media");
  }

  const failures = [];

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

  const unsupported = post.platforms.filter((platform) => platform !== "facebook");
  if (unsupported.length > 0) {
    failures.push(`Not yet supported: ${unsupported.join(", ")}`);
  }

  post.status = failures.length && !post.platformPostIds.size ? "failed" : "published";
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
