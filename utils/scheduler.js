import cron from "node-cron";
import Post from "../models/post.model.js";
import { executePublish } from "./publishPost.js";
import logger from "./logger.js";

const MAX_RETRY_ATTEMPTS = 3;

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
      await executePublish(post);
      logger.info(`Scheduled post ${post._id} published successfully.`);
    } catch (error) {
      post.retryCount = (post.retryCount || 0) + 1;
      post.status = post.retryCount >= MAX_RETRY_ATTEMPTS ? "failed" : "scheduled";
      post.failureReason = error.message;
      logger.error(`Failed to publish scheduled post ${post._id}: ${error.message}`);
      await post.save();
    }
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
