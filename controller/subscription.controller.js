import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Subscription from "../models/subscription.model.js";

// 999999 is used as a practical "unlimited" sentinel value (BSON-safe, unlike Infinity).
const UNLIMITED = 999999;

const PLAN_LIMITS = {
  free: { socialAccounts: 3, postsPerMonth: 30, teamMembers: 1, storageGB: 1 },
  starter: { socialAccounts: 8, postsPerMonth: UNLIMITED, teamMembers: 1, storageGB: 25 },
  professional: { socialAccounts: 20, postsPerMonth: UNLIMITED, teamMembers: 5, storageGB: 250 },
  agency: { socialAccounts: 50, postsPerMonth: UNLIMITED, teamMembers: 15, storageGB: 1000 },
  enterprise: { socialAccounts: UNLIMITED, postsPerMonth: UNLIMITED, teamMembers: UNLIMITED, storageGB: UNLIMITED },
};

// GET /api/v1/subscriptions/:workspaceId
const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ workspace: req.params.workspaceId });
  if (!subscription) throw ApiError.notFound("Subscription not found for this workspace.");

  return new ApiResponse(200, "Subscription fetched successfully.", subscription).send(res);
});

// POST /api/v1/subscriptions/:workspaceId/upgrade
const upgradePlan = asyncHandler(async (req, res) => {
  const { plan, billingCycle } = req.body;

  const subscription = await Subscription.findOneAndUpdate(
    { workspace: req.params.workspaceId },
    { plan, billingCycle, status: "active", limits: PLAN_LIMITS[plan] },
    { new: true, upsert: true }
  );

  return new ApiResponse(200, "Plan upgraded successfully.", subscription).send(res);
});

// POST /api/v1/subscriptions/:workspaceId/downgrade
const downgradePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  const subscription = await Subscription.findOneAndUpdate(
    { workspace: req.params.workspaceId },
    { plan, limits: PLAN_LIMITS[plan], cancelAtPeriodEnd: false },
    { new: true }
  );

  if (!subscription) throw ApiError.notFound("Subscription not found for this workspace.");

  return new ApiResponse(200, "Plan downgraded successfully.", subscription).send(res);
});

// GET /api/v1/subscriptions/:workspaceId/usage
const checkUsage = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ workspace: req.params.workspaceId });
  if (!subscription) throw ApiError.notFound("Subscription not found for this workspace.");

  const withinLimits = Object.entries(subscription.limits.toObject()).every(
    ([key, limit]) => limit >= UNLIMITED || subscription.usage[`${key}Used`] <= limit
  );

  return new ApiResponse(200, "Usage fetched successfully.", {
    limits: subscription.limits,
    usage: subscription.usage,
    withinLimits,
  }).send(res);
});

export { getSubscription, upgradePlan, downgradePlan, checkUsage, PLAN_LIMITS };
