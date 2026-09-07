import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import FacebookLive from "../models/facebookLive.model.js";
import PagePost from "../models/pagePost.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import ConnectedPage from "../models/connectedPage.model.js";
import Subscription from "../models/subscription.model.js";
import Workspace from "../models/workspace.model.js";
import { getPlan, getFacebookLiveLimit } from "../utils/subscriptionPlans.js";
import { createFacebookLiveOnPage, liveErrorMessage, waitBetweenPages } from "../utils/facebookLive.js";
import { ensureFreshMetaTokensForAccountIds, ensureFreshDatasetTokensForPages } from "../utils/facebookTokenRefresh.js";

const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const ensureActiveSubscription = async (workspaceId) => {
  const subscription = await Subscription.findOne({ workspace: workspaceId });
  if (!subscription) throw ApiError.badRequest("A subscription is required before going live.");

  const isTrialExpired = subscription.status === "trialing" && subscription.trialEndsAt && subscription.trialEndsAt <= new Date();
  const isPaidPeriodExpired =
    subscription.status === "active" && subscription.currentPeriodEnd && subscription.currentPeriodEnd <= new Date();
  if (isTrialExpired || isPaidPeriodExpired) {
    subscription.status = "expired";
    subscription.plan = "free";
    subscription.limits = getPlan("free").limits;
    await subscription.save();
    await Workspace.findByIdAndUpdate(workspaceId, { plan: "free" });
  }

  if (subscription.status === "expired" || subscription.status === "cancelled") {
    throw ApiError.forbidden("Your plan has expired. Choose a plan to continue going live.");
  }
  return subscription;
};

const countLiveVideosThisMonth = async (workspaceId) => {
  const rows = await FacebookLive.aggregate([
    {
      $match: {
        workspace: new mongoose.Types.ObjectId(String(workspaceId)),
        createdAt: { $gte: monthStart() },
      },
    },
    { $unwind: "$results" },
    { $match: { "results.success": true } },
    { $count: "used" },
  ]);
  return rows[0]?.used || 0;
};

const assertLiveQuota = async (subscription, needed) => {
  const plan = getPlan(subscription.plan);
  const limit = getFacebookLiveLimit(subscription.plan);
  const used = await countLiveVideosThisMonth(subscription.workspace);
  const remaining = Math.max(0, limit - used);
  if (needed > remaining) {
    throw ApiError.forbidden(
      `Your ${plan.name} plan includes ${limit} Facebook live videos this month (${used} used, ${remaining} left). Reduce the number of pages or upgrade.`
    );
  }
  return { limit, used, remaining };
};

const persistPagePost = async ({ workspaceId, result, secretKey, description }) => {
  if (!result.success || !result.liveVideoId) return;
  try {
    await PagePost.create({
      workspace: workspaceId,
      socialAccount: result.socialAccount,
      connectedPage: result.connectedPage,
      secretKey: secretKey || undefined,
      pageNumber: result.pageNumber,
      pageName: result.pageName,
      pageId: result.pageId,
      platform: "facebook",
      platformPostId: result.liveVideoId,
      postLink: result.permalink,
      postContent: description || "",
      success: true,
    });
  } catch {
    // Live already started; missing the archive row should not fail the request.
  }
};

const createManageLives = asyncHandler(async (req, res) => {
  const { workspaceId, socialAccountIds, title, description, scheduledAt } = req.body;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");
  if (!Array.isArray(socialAccountIds) || socialAccountIds.length === 0) {
    throw ApiError.badRequest("Select at least one connected Facebook page.");
  }

  const subscription = await ensureActiveSubscription(workspaceId);
  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  const isScheduled = parsedScheduledAt && parsedScheduledAt.getTime() > Date.now() + 30_000;
  const broadcastStatus = isScheduled ? "SCHEDULED_UNPUBLISHED" : "LIVE_NOW";

  const accounts = await SocialAccount.find({
    _id: { $in: socialAccountIds },
    workspace: workspaceId,
    platform: "facebook",
    status: "connected",
  }).select("+accessToken accountId accountName pageNumber avatar");
  if (!accounts.length) throw ApiError.badRequest("Selected Facebook pages were not found or are disconnected.");

  await assertLiveQuota(subscription, accounts.length);
  await ensureFreshMetaTokensForAccountIds(accounts.map((account) => account._id));
  const freshAccounts = await SocialAccount.find({
    _id: { $in: accounts.map((account) => account._id) },
    platform: "facebook",
    status: "connected",
  }).select("+accessToken accountId accountName avatar");

  const results = [];
  for (let i = 0; i < freshAccounts.length; i += 1) {
    const account = freshAccounts[i];
    try {
      const live = await createFacebookLiveOnPage({
        pageId: account.accountId,
        encryptedToken: account.accessToken,
        title,
        description,
        broadcastStatus,
        scheduledAt: isScheduled ? parsedScheduledAt : undefined,
      });
      const result = {
        pageId: account.accountId,
        pageName: account.accountName,
        socialAccount: account._id,
        liveVideoId: live.liveVideoId,
        permalink: live.permalink,
        streamUrl: live.streamUrl,
        secureStreamUrl: live.secureStreamUrl,
        success: true,
      };
      results.push(result);
      await persistPagePost({ workspaceId, result, description });
    } catch (error) {
      results.push({
        pageId: account.accountId,
        pageName: account.accountName,
        socialAccount: account._id,
        success: false,
        error: liveErrorMessage(error),
      });
    }
    if (i < freshAccounts.length - 1) await waitBetweenPages();
  }

  const live = await FacebookLive.create({
    workspace: workspaceId,
    createdBy: req.user._id,
    mode: "manage",
    title: title?.trim() || "Live video",
    description: description?.trim() || "",
    broadcastStatus,
    scheduledAt: isScheduled ? parsedScheduledAt : undefined,
    successCount: results.filter((item) => item.success).length,
    failedCount: results.filter((item) => !item.success).length,
    results,
  });

  if (!live.successCount) {
    throw ApiError.internal(results[0]?.error || "Could not start a Facebook live video.");
  }

  return new ApiResponse(201, isScheduled ? "Facebook live video scheduled." : "Facebook live video started.", live).send(res);
});

const createDatasetLives = asyncHandler(async (req, res) => {
  const { workspaceId, secretKey, fromPage, toPage, category, title, description, scheduledAt } = req.body;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");
  if (!secretKey?.trim()) throw ApiError.badRequest("secretKey is required for dataset live videos.");

  const from = Number(fromPage);
  const to = Number(toPage);
  if (Number.isNaN(from) || Number.isNaN(to) || from < 1 || to < from) {
    throw ApiError.badRequest("Enter a valid page number range.");
  }

  const subscription = await ensureActiveSubscription(workspaceId);
  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  const isScheduled = parsedScheduledAt && parsedScheduledAt.getTime() > Date.now() + 30_000;
  const broadcastStatus = isScheduled ? "SCHEDULED_UNPUBLISHED" : "LIVE_NOW";

  const query = { status: "connected", pageNumber: { $gte: from, $lte: to } };
  if (category?.trim()) query.category = category.trim();

  const pages = await ConnectedPage.find(query).sort({ pageNumber: 1 }).select("+pageAccessToken +userAccessToken");
  if (!pages.length) throw ApiError.badRequest("No trending pages found in that range.");

  await assertLiveQuota(subscription, pages.length);
  await ensureFreshDatasetTokensForPages(pages);
  const freshPages = await ConnectedPage.find(query).sort({ pageNumber: 1 }).select("+pageAccessToken");

  const results = [];
  for (let i = 0; i < freshPages.length; i += 1) {
    const page = freshPages[i];
    try {
      const live = await createFacebookLiveOnPage({
        pageId: page.pageId,
        encryptedToken: page.pageAccessToken,
        title,
        description,
        broadcastStatus,
        scheduledAt: isScheduled ? parsedScheduledAt : undefined,
      });
      const result = {
        pageId: page.pageId,
        pageName: page.pageName,
        pageNumber: page.pageNumber,
        connectedPage: page._id,
        liveVideoId: live.liveVideoId,
        permalink: live.permalink,
        streamUrl: live.streamUrl,
        secureStreamUrl: live.secureStreamUrl,
        success: true,
      };
      results.push(result);
      await persistPagePost({
        workspaceId,
        result,
        secretKey: secretKey.trim(),
        description,
      });
    } catch (error) {
      results.push({
        pageId: page.pageId,
        pageName: page.pageName,
        pageNumber: page.pageNumber,
        connectedPage: page._id,
        success: false,
        error: liveErrorMessage(error),
      });
    }
    if (i < freshPages.length - 1) await waitBetweenPages();
  }

  const live = await FacebookLive.create({
    workspace: workspaceId,
    createdBy: req.user._id,
    mode: "dataset",
    title: title?.trim() || "Live video",
    description: description?.trim() || "",
    broadcastStatus,
    scheduledAt: isScheduled ? parsedScheduledAt : undefined,
    secretKey: secretKey.trim(),
    successCount: results.filter((item) => item.success).length,
    failedCount: results.filter((item) => !item.success).length,
    results,
  });

  if (!live.successCount) {
    throw ApiError.internal(results[0]?.error || "Could not start Facebook live videos on the selected pages.");
  }

  return new ApiResponse(201, isScheduled ? "Dataset live videos scheduled." : "Dataset live videos started.", live).send(res);
});

const getLiveQuota = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");
  const subscription = await ensureActiveSubscription(workspaceId);
  const plan = getPlan(subscription.plan);
  const limit = getFacebookLiveLimit(subscription.plan);
  const used = await countLiveVideosThisMonth(workspaceId);
  return new ApiResponse(200, "Facebook live quota fetched successfully.", {
    plan: plan.name,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  }).send(res);
});

const listLives = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");
  const items = await FacebookLive.find({ workspace: workspaceId }).sort({ createdAt: -1 }).limit(50);
  return new ApiResponse(200, "Facebook live sessions fetched successfully.", items).send(res);
});

export { createManageLives, createDatasetLives, getLiveQuota, listLives };
