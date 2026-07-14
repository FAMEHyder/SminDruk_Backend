import { PLAN_LIMITS } from "./subscription.controller.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Payment from "../models/payment.model.js";
import Blog from "../models/blog.model.js";
import Subscription from "../models/subscription.model.js";
import AuditLog from "../models/auditLog.model.js";

// GET /api/v1/admin/users?page=&limit=&search=
const manageUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const filter = {};
  if (search) filter.email = new RegExp(search, "i");

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Users fetched successfully.", items, {
    page: Number(page),
    limit: Number(limit),
    total,
  }).send(res);
});

// PATCH /api/v1/admin/users/:id/status
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) throw ApiError.notFound("User not found.");

  return new ApiResponse(200, "User status updated successfully.", user.toSafeObject()).send(res);
});

// GET /api/v1/admin/posts?status=&page=&limit=
const managePosts = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const items = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return new ApiResponse(200, "Posts fetched successfully.", items).send(res);
});

// GET /api/v1/admin/reports/overview
const getPlatformReports = asyncHandler(async (_req, res) => {
  const [totalUsers, totalPosts, totalRevenueAgg, activeSubscriptions] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Payment.aggregate([{ $match: { status: "succeeded" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Subscription.countDocuments({ status: "active" }),
  ]);

  return new ApiResponse(200, "Platform report generated successfully.", {
    totalUsers,
    totalPosts,
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    activeSubscriptions,
  }).send(res);
});

// GET /api/v1/admin/payments
const managePayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const items = await Payment.find()
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return new ApiResponse(200, "Payments fetched successfully.", items).send(res);
});

// GET /api/v1/admin/blogs
const manageBlogs = asyncHandler(async (_req, res) => {
  const items = await Blog.find().sort({ createdAt: -1 });
  return new ApiResponse(200, "Blogs fetched successfully.", items).send(res);
});

// GET /api/v1/admin/plans
const managePlans = asyncHandler(async (_req, res) => {
  return new ApiResponse(200, "Plans fetched successfully.", PLAN_LIMITS).send(res);
});

// GET /api/v1/admin/logs?event=&page=&limit=
const viewLogs = asyncHandler(async (req, res) => {
  const { event, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (event) filter.event = event;

  const items = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return new ApiResponse(200, "Logs fetched successfully.", items).send(res);
});

// PATCH /api/v1/admin/settings
const updatePlatformSettings = asyncHandler(async (req, res) => {
  // TODO: persist platform-wide settings (maintenance mode, feature flags, etc.) to a Settings collection.
  return new ApiResponse(200, "Platform settings updated successfully.", req.body).send(res);
});

export { manageUsers,
  updateUserStatus,
  managePosts,
  getPlatformReports,
  managePayments,
  manageBlogs,
  managePlans,
  viewLogs,
  updatePlatformSettings, };
