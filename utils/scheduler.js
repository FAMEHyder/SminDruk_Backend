import cron from "node-cron";
import Post from "../models/post.model.js";
import logger from "./logger.js";

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Publishes a single post to its selected platforms.
 * Replace the body of this function with real platform API calls
 * (Facebook Graph API, Instagram Graph API, LinkedIn API, X API, etc.)
 */
const publishPostToPlatforms = async (post) => {
  logger.info(`Publishing post ${post._id} to: ${post.platforms.join(", ")}`);
  // TODO: integrate real social platform publishing APIs here.
  return { success: true };
};

/**
 * Cron job — runs every minute.
 * Finds posts with status "scheduled" whose scheduledAt time has passed,
 * attempts to publish them, and updates their status accordingly.
 */
const runScheduledPostsJob = async () => {
  const now = new Date();

  const duePosts = await Post.find({
    status: "scheduled",
    scheduledAt: { $lte: now },
    retryCount: { $lt: MAX_RETRY_ATTEMPTS },
  });

  for (const post of duePosts) {
    post.status = "publishing";
    await post.save();

    try {
      await publishPostToPlatforms(post);
      post.status = "published";
      post.publishedAt = new Date();
    } catch (error) {
      post.retryCount = (post.retryCount || 0) + 1;
      post.status = post.retryCount >= MAX_RETRY_ATTEMPTS ? "failed" : "scheduled";
      logger.error(`Failed to publish post ${post._id}: ${error.message}`);
    }

    await post.save();
  }
};

/**
 * Registers the "* * * * *" (every minute) cron job.
 * Call this once from index.js after the DB connection is established.
 */
const startScheduler = () => {
  cron.schedule("* * * * *", () => {
    runScheduledPostsJob().catch((error) => logger.error(`Scheduler job crashed: ${error.message}`));
  });
  logger.info("Post scheduler started (running every minute).");
};

export { startScheduler, runScheduledPostsJob };
