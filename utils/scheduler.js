import cron from "node-cron";
import Post from "../models/post.model.js";
import BulkPost from "../models/bulkPost.model.js";
import Notification from "../models/notification.model.js";
import { executePublish } from "./publishPost.js";
import { executeBulkPublish } from "./bulkFacebookPublish.js";
import { runFacebookTokenRefreshJob } from "./facebookTokenRefresh.js";
import logger from "./logger.js";

const STUCK_PUBLISHING_MS = 10 * 60 * 1000;
/** Notify on first failure, then every N retries (avoid spam while never giving up). */
const FAILURE_NOTIFY_EVERY = 10;

/**
 * Atomically claims one due post so multiple scheduler ticks cannot publish twice.
 * Scheduled posts are never abandoned — no retry cap.
 */
const claimDuePost = async (postId, now, staleCutoff) => {
  return Post.findOneAndUpdate(
    {
      _id: postId,
      scheduledAt: { $lte: now, $ne: null },
      $or: [{ status: "scheduled" }, { status: "publishing", updatedAt: { $lte: staleCutoff } }],
    },
    { $set: { status: "publishing" } },
    { new: true }
  ).populate("media");
};

/**
 * Re-queue previously failed scheduled posts so they publish after fixes
 * (e.g. token decrypt key mismatch) instead of staying failed forever.
 */
const requeueFailedScheduledPosts = async () => {
  const result = await Post.updateMany(
    {
      status: "failed",
      scheduledAt: { $ne: null },
    },
    {
      $set: { status: "scheduled", retryCount: 0 },
      $unset: { failureReason: 1 },
    }
  );

  if (result.modifiedCount > 0) {
    logger.info(`Re-queued ${result.modifiedCount} failed scheduled post(s) for retry.`);
  }
};

/**
 * Finds posts whose scheduled time has passed and publishes them to connected platforms.
 * On error: keeps status "scheduled" and retries next minute — never marks failed permanently.
 */
const runScheduledPostsJob = async () => {
  await requeueFailedScheduledPosts();

  const now = new Date();
  const staleCutoff = new Date(Date.now() - STUCK_PUBLISHING_MS);

  const candidates = await Post.find({
    scheduledAt: { $lte: now, $ne: null },
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

      // Never mark scheduled posts as failed — keep retrying every minute.
      await Post.findByIdAndUpdate(post._id, {
        $set: {
          status: "scheduled",
          failureReason: error.message,
        },
        $inc: { retryCount: 1 },
      });

      if (nextRetryCount === 1 || nextRetryCount % FAILURE_NOTIFY_EVERY === 0) {
        await Notification.create({
          user: post.createdBy,
          type: "publish_failed",
          title: "Scheduled post retrying",
          message: `Publish attempt failed (${error.message}). Will keep retrying automatically.`,
          metadata: { postId: post._id, retryCount: nextRetryCount },
        }).catch((notifyError) =>
          logger.warn(`Could not create failure notification: ${notifyError.message}`)
        );
      }

      logger.error(`Failed to publish scheduled post ${post._id} (retry ${nextRetryCount}): ${error.message}`);
    }
  }
};

/**
 * Publishes due bulk posts (trending dataset page-number range posts).
 * On error: stays scheduled and retries — never permanent fail.
 */
const runScheduledBulkPostsJob = async () => {
  const now = new Date();

  await BulkPost.updateMany(
    { status: "failed", scheduledAt: { $ne: null } },
    { $set: { status: "scheduled" }, $unset: { failureReason: 1 } }
  );

  const dueBulkPosts = await BulkPost.find({
    status: { $in: ["scheduled", "publishing"] },
    scheduledAt: { $lte: now },
  }).sort({ scheduledAt: 1 });

  for (const bulkPost of dueBulkPosts) {
    if (bulkPost.status === "publishing") {
      // Skip fresh publishing locks; only reclaim if stuck > 10 min via updatedAt.
      const ageMs = Date.now() - new Date(bulkPost.updatedAt).getTime();
      if (ageMs < STUCK_PUBLISHING_MS) continue;
    }

    bulkPost.status = "publishing";
    await bulkPost.save();

    try {
      const result = await executeBulkPublish({
        workspaceId: bulkPost.workspace,
        secretKey: bulkPost.secretKey,
        content: bulkPost.content,
        fromPage: bulkPost.fromPage,
        toPage: bulkPost.toPage,
        category: bulkPost.category || "",
        postType: bulkPost.postType,
        mediaId: bulkPost.mediaId,
      });

      bulkPost.status = "published";
      bulkPost.publishedCount = result.publishedCount;
      bulkPost.failedCount = result.failedCount;
      bulkPost.failureReason = undefined;
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
      bulkPost.status = "scheduled";
      bulkPost.failureReason = error.message;
      await bulkPost.save();

      await Notification.create({
        user: bulkPost.createdBy,
        type: "publish_failed",
        title: "Scheduled bulk post retrying",
        message: `Publish attempt failed (${error.message}). Will keep retrying automatically.`,
        metadata: { bulkPostId: bulkPost._id, secretKey: bulkPost.secretKey },
      }).catch((notifyError) =>
        logger.warn(`Could not create bulk failure notification: ${notifyError.message}`)
      );

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
