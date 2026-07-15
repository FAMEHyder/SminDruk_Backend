import cron from "node-cron";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { executePublish } from "./publishPost.js";
import logger from "./logger.js";

const MAX_RETRY_ATTEMPTS = 3;
const STUCK_PUBLISHING_MS = 10 * 60 * 1000;

/**
 * Atomically claims one due post so multiple scheduler ticks cannot publish twice.
 */
const claimDuePost = async (postId, now, staleCutoff) => {
  return Post.findOneAndUpdate(
    {
      _id: postId,
      scheduledAt: { $lte: now, $ne: null },
      retryCount: { $lt: MAX_RETRY_ATTEMPTS },
      $or: [{ status: "scheduled" }, { status: "publishing", updatedAt: { $lte: staleCutoff } }],
    },
    { $set: { status: "publishing" } },
    { new: true }
  ).populate("media");
};

/**
 * Finds posts whose scheduled time has passed and publishes them to connected platforms.
 */
const runScheduledPostsJob = async () => {
  const now = new Date();
  const staleCutoff = new Date(Date.now() - STUCK_PUBLISHING_MS);

  const candidates = await Post.find({
    scheduledAt: { $lte: now, $ne: null },
    retryCount: { $lt: MAX_RETRY_ATTEMPTS },
    $or: [{ status: "scheduled" }, { status: "publishing", updatedAt: { $lte: staleCutoff } }],
  })
    .select("_id scheduledAt status")
    .sort({ scheduledAt: 1 });

  if (candidates.length > 0) {
    logger.info(`Scheduler found ${candidates.length} due post(s) at ${now.toISOString()}.`);
  }

  for (const candidate of candidates) {
    const post = await claimDuePost(candidate._id, now, staleCutoff);
    if (!post) continue;

    logger.info(
      `Publishing scheduled post ${post._id} (scheduled for ${post.scheduledAt?.toISOString?.() || post.scheduledAt}).`
    );

    try {
      if (post.platforms.includes("facebook") && (!post.socialAccounts || post.socialAccounts.length === 0)) {
        throw new Error("No Facebook pages selected for this scheduled post.");
      }

      await executePublish(post);

      await Notification.create({
        user: post.createdBy,
        type: "publish_success",
        title: "Scheduled post published",
        message: "Your scheduled post was published successfully.",
        metadata: { postId: post._id },
      }).catch((error) => logger.warn(`Could not create publish notification: ${error.message}`));

      logger.info(`Scheduled post ${post._id} published successfully.`);
    } catch (error) {
      const nextRetryCount = (post.retryCount || 0) + 1;
      const nextStatus = nextRetryCount >= MAX_RETRY_ATTEMPTS ? "failed" : "scheduled";

      await Post.findByIdAndUpdate(post._id, {
        $set: {
          status: nextStatus,
          failureReason: error.message,
        },
        $inc: { retryCount: 1 },
      });

      await Notification.create({
        user: post.createdBy,
        type: "publish_failed",
        title: "Scheduled post failed",
        message: error.message,
        metadata: { postId: post._id },
      }).catch((notifyError) => logger.warn(`Could not create failure notification: ${notifyError.message}`));

      logger.error(`Failed to publish scheduled post ${post._id}: ${error.message}`);
    }
  }
};

/**
 * Registers the every-minute cron job and runs one pass immediately on startup.
 */
const startScheduler = () => {
  cron.schedule("* * * * *", () => {
    runScheduledPostsJob().catch((error) => logger.error(`Scheduler job crashed: ${error.message}`));
  });

  logger.info("Post scheduler started (running every minute).");

  runScheduledPostsJob().catch((error) =>
    logger.error(`Initial scheduler run failed: ${error.message}`)
  );
};

export { startScheduler, runScheduledPostsJob };
