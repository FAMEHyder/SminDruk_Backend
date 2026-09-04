import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Subscription from "../models/subscription.model.js";
import Workspace from "../models/workspace.model.js";
import { MANAGEMENT_PLANS, UNLIMITED, getPlan } from "../utils/subscriptionPlans.js";

const PLAN_LIMITS = {
  ...Object.fromEntries(
  Object.entries(MANAGEMENT_PLANS).map(([id, plan]) => [id, plan.limits])
  ),
  starter: { socialAccounts: 8, postsPerMonth: UNLIMITED, teamMembers: 1, storageGB: 25 },
  professional: { socialAccounts: 20, postsPerMonth: UNLIMITED, teamMembers: 5, storageGB: 250 },
  agency: { socialAccounts: 50, postsPerMonth: UNLIMITED, teamMembers: 15, storageGB: 1000 },
  enterprise: { socialAccounts: UNLIMITED, postsPerMonth: UNLIMITED, teamMembers: UNLIMITED, storageGB: UNLIMITED },
};

const limitsForPlan = (plan) => PLAN_LIMITS[plan] || getPlan("free").limits;

const ensureCurrentSubscription = async (workspaceId) => {
  const subscription = await Subscription.findOne({ workspace: workspaceId });
  if (!subscription) throw ApiError.notFound("Subscription not found for this workspace.");

  if (subscription.status === "trialing" && subscription.trialEndsAt && subscription.trialEndsAt <= new Date()) {
    subscription.status = "expired";
    subscription.plan = "free";
    subscription.limits = limitsForPlan("free");
    await subscription.save();
    await Workspace.findByIdAndUpdate(workspaceId, { plan: "free" });
  }

  return subscription;
};

const getPlans = asyncHandler(async (_req, res) => {
  const plans = Object.entries(MANAGEMENT_PLANS).map(([id, plan]) => ({
    id,
    ...plan,
    trialDays: id === "free" ? 0 : 30,
    trialExcludes: id === "free" ? [] : ["x"],
  }));
  return new ApiResponse(200, "Subscription plans fetched successfully.", plans).send(res);
});

// GET /api/v1/subscriptions/:workspaceId
const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await ensureCurrentSubscription(req.params.workspaceId);

  return new ApiResponse(200, "Subscription fetched successfully.", subscription).send(res);
});

// POST /api/v1/subscriptions/:workspaceId/trial
const startTrial = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!["basic", "standard", "premium"].includes(plan)) {
    throw ApiError.badRequest("Choose Basic, Standard, or Premium for your trial.");
  }

  const subscription = await ensureCurrentSubscription(req.params.workspaceId);
  if (subscription.trialUsed) {
    throw ApiError.badRequest("This workspace has already used its 30-day free trial.");
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  subscription.plan = plan;
  subscription.status = "trialing";
  subscription.startedAt = now;
  subscription.trialStartedAt = now;
  subscription.trialEndsAt = trialEndsAt;
  subscription.trialUsed = true;
  subscription.currentPeriodEnd = trialEndsAt;
  subscription.limits = limitsForPlan(plan);
  await subscription.save();
  await Workspace.findByIdAndUpdate(req.params.workspaceId, { plan });

  return new ApiResponse(200, "Your 30-day trial has started. X publishing is not included during trial.", subscription).send(res);
});

// POST /api/v1/subscriptions/:workspaceId/upgrade
const upgradePlan = asyncHandler(async (req, res) => {
  const { plan, billingCycle } = req.body;
  if (!MANAGEMENT_PLANS[plan] && !PLAN_LIMITS[plan]) throw ApiError.badRequest("Invalid subscription plan.");

  const subscription = await Subscription.findOneAndUpdate(
    { workspace: req.params.workspaceId },
    { plan, billingCycle, status: "active", limits: limitsForPlan(plan) },
    { new: true, upsert: true }
  );
  await Workspace.findByIdAndUpdate(req.params.workspaceId, { plan });

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
  const subscription = await ensureCurrentSubscription(req.params.workspaceId);

  const limits = subscription.limits.toObject();
  const usage = subscription.usage.toObject();
  const withinLimits =
    (limits.socialAccounts >= UNLIMITED || usage.socialAccountsUsed <= limits.socialAccounts) &&
    (limits.postsPerMonth >= UNLIMITED || usage.postsThisMonth <= limits.postsPerMonth) &&
    (limits.teamMembers >= UNLIMITED || usage.teamMembersUsed <= limits.teamMembers) &&
    (limits.storageGB >= UNLIMITED || usage.storageUsedGB <= limits.storageGB);

  return new ApiResponse(200, "Usage fetched successfully.", {
    limits: subscription.limits,
    usage: subscription.usage,
    withinLimits,
  }).send(res);
});

export { getPlans, getSubscription, startTrial, upgradePlan, downgradePlan, checkUsage, PLAN_LIMITS };
