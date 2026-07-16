import cron from "node-cron";
import Post from "../models/post.model.js";
import BulkPost from "../models/bulkPost.model.js";
import Notification from "../models/notification.model.js";
import { executePublish } from "./publishPost.js";
import { executeBulkPublish } from "./bulkFacebookPublish.js";
import { runFacebookTokenRefreshJob } from "./facebookTokenRefresh.js";
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
 * Publishes due bulk posts (trending dataset page-number range posts).
 */
const runScheduledBulkPostsJob = async () => {
  const now = new Date();

  const dueBulkPosts = await BulkPost.find({
    status: "scheduled",
    scheduledAt: { $lte: now },
  }).sort({ scheduledAt: 1 });

  for (const bulkPost of dueBulkPosts) {
    bulkPost.status = "publishing";
    await bulkPost.save();

    try {
      const result = await executeBulkPublish({
        workspaceId: bulkPost.workspace,
        secretKey: bulkPost.secretKey,
        content: bulkPost.content,
        fromPage: bulkPost.fromPage,
        toPage: bulkPost.toPage,
        postType: bulkPost.postType,
        mediaId: bulkPost.mediaId,
      });

      bulkPost.status = "published";
      bulkPost.publishedCount = result.publishedCount;
      bulkPost.failedCount = result.failedCount;
      await bulkPost.save();

      await Notification.create({
        user: bulkPost.createdBy,
        type: "publish_success",
        title: "Scheduled bulk post published",
        message: `Published to ${result.publishedCount} page(s).`,
        metadata: { bulkPostId: bulkPost._id, secretKey: bulkPost.secretKey },
      }).catch((error) => logger.warn(`Could not create bulk publish notification: ${error.message}`));

      logger.info(`Scheduled bulk post ${bulkPost._id} published successfully.`);
    } catch (error) {
      bulkPost.status = "failed";
      bulkPost.failureReason = error.message;
      await bulkPost.save();

      await Notification.create({
        user: bulkPost.createdBy,
        type: "publish_failed",
        title: "Scheduled bulk post failed",
        message: error.message,
        metadata: { bulkPostId: bulkPost._id, secretKey: bulkPost.secretKey },
      }).catch((notifyError) => logger.warn(`Could not create bulk failure notification: ${notifyError.message}`));

      logger.error(`Failed to publish scheduled bulk post ${bulkPost._id}: ${error.message}`);
    }
  }
};

/**
 * Registers cron jobs and runs an initial scheduled-post pass on startup.
 */
const startScheduler = () => {
  cron.schedule("* * * * *", () => {
    runScheduledPostsJob().catch((error) => logger.error(`Scheduler job crashed: ${error.message}`));
    runScheduledBulkPostsJob().catch((error) => logger.error(`Bulk scheduler job crashed: ${error.message}`));
  });

  const cronTimezone = process.env.CRON_TIMEZONE || "Asia/Karachi";
  const tokenRefreshCron = process.env.FB_TOKEN_REFRESH_CRON || "0 12 * * *";

  cron.schedule(
    tokenRefreshCron,
    () => {
      runFacebookTokenRefreshJob().catch((error) =>
        logger.error(`Facebook token refresh job crashed: ${error.message}`)
      );
    },
    { timezone: cronTimezone }
  );

  logger.info("Post scheduler started (running every minute).");
  logger.info(`Facebook token refresh scheduled daily at 12:00 PM (${cronTimezone}).`);

  runScheduledPostsJob().catch((error) =>
    logger.error(`Initial scheduler run failed: ${error.message}`)
  );
  runScheduledBulkPostsJob().catch((error) =>
    logger.error(`Initial bulk scheduler run failed: ${error.message}`)
  );
};

export { startScheduler, runScheduledPostsJob, runScheduledBulkPostsJob, runFacebookTokenRefreshJob };
