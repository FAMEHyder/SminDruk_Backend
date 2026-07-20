import crypto from "crypto";
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
import Workspace from "../models/workspace.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import ConnectedPage from "../models/connectedPage.model.js";
import ContactMessage from "../models/contactMessage.model.js";
import Media from "../models/media.model.js";
import BulkPost from "../models/bulkPost.model.js";
import PagePost from "../models/pagePost.model.js";
import Notification from "../models/notification.model.js";
import Analytics from "../models/analytics.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PlatformSettings from "../models/platformSettings.model.js";
import TeamMember from "../models/teamMember.model.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import {
  formatTokenRefreshMeta,
  needsTokenRefreshAttention,
  TOKEN_REFRESH_AFTER_DAYS,
  TOKEN_REFRESH_CRON_MAX_DAYS,
} from "../utils/tokenRefreshStatus.js";
import {
  refreshFacebookTokensForAccount,
  refreshFacebookTokensForConnectedPage,
  runFacebookTokenRefreshJob,
} from "../utils/facebookTokenRefresh.js";
import { runScheduledPostsJob, runScheduledBulkPostsJob } from "../utils/scheduler.js";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const paginate = (page = 1, limit = 20) => ({
  page: Number(page) || 1,
  limit: Math.min(Number(limit) || 20, 100),
  skip: ((Number(page) || 1) - 1) * Math.min(Number(limit) || 20, 100),
});

const logAdminAction = async (req, description, metadata = {}) => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      event: "admin_action",
      description,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata,
    });
  } catch {
    // non-blocking
  }
};

const getOrCreateSettings = async () => {
  let settings = await PlatformSettings.findOne({ key: "default" });
  if (!settings) {
    settings = await PlatformSettings.create({ key: "default" });
  }
  return settings;
};

const mapManageAccount = (account) => ({
  _id: account._id,
  type: "manage",
  platform: account.platform,
  accountId: account.accountId,
  name: account.accountName,
  category: account.category,
  avatar: account.avatar,
  status: account.status,
  workspace: account.workspace,
  connectedBy: account.connectedBy,
  lastSyncedAt: account.lastSyncedAt,
  createdAt: account.createdAt,
  ...formatTokenRefreshMeta(account),
});

const mapDatasetAccount = (page) => ({
  _id: page._id,
  type: "dataset",
  platform: "facebook",
  accountId: page.pageId,
  pageNumber: page.pageNumber,
  name: page.pageName,
  category: page.category,
  avatar: page.profilePicture,
  status: page.status,
  workspace: page.workspace,
  connectedBy: page.connectedBy,
  lastSyncedAt: page.lastSyncedAt,
  createdAt: page.createdAt,
  ...formatTokenRefreshMeta(page),
});

// ─── Dashboard ───────────────────────────────────────────────

const getDashboardOverview = asyncHandler(async (_req, res) => {
  const todayStart = startOfToday();

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    totalWorkspaces,
    manageAccounts,
    datasetAccounts,
    totalPosts,
    scheduledPosts,
    publishedPosts,
    failedPosts,
    draftPosts,
    totalRevenueAgg,
    activeSubscriptions,
    supportTickets,
    blogPosts,
    totalMedia,
    bulkScheduled,
    pagePostsPublished,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    Workspace.countDocuments(),
    SocialAccount.countDocuments({ status: "connected", connectSource: { $ne: "dataset" } }),
    ConnectedPage.countDocuments({ status: "connected" }),
    Post.countDocuments(),
    Post.countDocuments({ status: "scheduled" }),
    Post.countDocuments({ status: "published" }),
    Post.countDocuments({ status: "failed" }),
    Post.countDocuments({ status: "draft" }),
    Payment.aggregate([{ $match: { status: "succeeded" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Subscription.countDocuments({ status: "active" }),
    ContactMessage.countDocuments({ status: { $ne: "resolved" } }),
    Blog.countDocuments(),
    Media.countDocuments(),
    BulkPost.countDocuments({ status: "scheduled" }),
    PagePost.countDocuments({ success: true }),
  ]);

  const [manageAccountsList, datasetPagesList] = await Promise.all([
    SocialAccount.find({
      platform: "facebook",
      status: "connected",
      connectSource: { $ne: "dataset" },
    }).select("tokenIssuedAt createdAt"),
    ConnectedPage.find({ status: "connected" }).select("tokenIssuedAt createdAt"),
  ]);

  const tokenRefreshRequired =
    manageAccountsList.filter((a) => needsTokenRefreshAttention(a.tokenIssuedAt, a.createdAt)).length +
    datasetPagesList.filter((p) => needsTokenRefreshAttention(p.tokenIssuedAt, p.createdAt)).length;

  return new ApiResponse(200, "Dashboard overview fetched successfully.", {
    stats: {
      totalUsers,
      activeUsers,
      newUsersToday,
      totalWorkspaces,
      manageAccounts,
      datasetAccounts,
      totalSocialAccounts: manageAccounts + datasetAccounts,
      totalPosts,
      scheduledPosts: scheduledPosts + bulkScheduled,
      publishedPosts: publishedPosts + pagePostsPublished,
      failedPosts,
      draftPosts,
      totalAiRequests: 0,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      activeSubscriptions,
      supportTickets,
      blogPosts,
      totalMedia,
      tokenRefreshRequired,
    },
    tokenRefreshPolicy: {
      refreshAfterDays: TOKEN_REFRESH_AFTER_DAYS,
      cronMaxDays: TOKEN_REFRESH_CRON_MAX_DAYS,
    },
  }).send(res);
});

// ─── Users ───────────────────────────────────────────────────

const manageUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (search) {
    const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const parts = String(search).trim().split(/\s+/).filter(Boolean);
    filter.$or = [{ email: regex }, { firstName: regex }, { lastName: regex }];
    if (parts.length >= 2) {
      filter.$or.push({
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: escaped,
            options: "i",
          },
        },
      });
    }
  }
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l),
    User.countDocuments(filter),
  ]);

  return new ApiResponse(
    200,
    "Users fetched successfully.",
    items.map((u) => u.toSafeObject()),
    { page: p, limit: l, total, totalPages: Math.ceil(total / l) }
  ).send(res);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found.");
  return new ApiResponse(200, "User fetched successfully.", user.toSafeObject()).send(res);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) throw ApiError.notFound("User not found.");
  await logAdminAction(req, `User ${isActive ? "activated" : "suspended"}: ${user.email}`, {
    userId: user._id,
    isActive,
  });
  return new ApiResponse(200, "User status updated successfully.", user.toSafeObject()).send(res);
});

const updateUser = asyncHandler(async (req, res) => {
  const allowed = ["firstName", "lastName", "role", "isActive", "isEmailVerified", "bio"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found.");
  await logAdminAction(req, `User updated: ${user.email}`, { userId: user._id, updates });
  return new ApiResponse(200, "User updated successfully.", user.toSafeObject()).send(res);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found.");
  if (user.role === "superadmin") throw ApiError.forbidden("Cannot delete a superadmin.");

  const userId = user._id;
  const workspaces = await Workspace.find({ owner: userId }).select("_id");
  const workspaceIds = workspaces.map((w) => w._id);

  if (workspaceIds.length) {
    const mediaItems = await Media.find({ workspace: { $in: workspaceIds } }).select("publicId");
    for (const item of mediaItems) {
      if (item.publicId) {
        try {
          await deleteFromCloudinary(item.publicId);
        } catch {
          // best-effort cleanup
        }
      }
    }

    await Promise.all([
      SocialAccount.deleteMany({ workspace: { $in: workspaceIds } }),
      ConnectedPage.deleteMany({ workspace: { $in: workspaceIds } }),
      Post.deleteMany({ workspace: { $in: workspaceIds } }),
      BulkPost.deleteMany({ workspace: { $in: workspaceIds } }),
      PagePost.deleteMany({ workspace: { $in: workspaceIds } }),
      Media.deleteMany({ workspace: { $in: workspaceIds } }),
      Analytics.deleteMany({ workspace: { $in: workspaceIds } }),
      Payment.deleteMany({ workspace: { $in: workspaceIds } }),
      Subscription.deleteMany({ workspace: { $in: workspaceIds } }),
      TeamMember.deleteMany({ workspace: { $in: workspaceIds } }),
      Workspace.deleteMany({ _id: { $in: workspaceIds } }),
    ]);
  }

  await Promise.all([
    TeamMember.deleteMany({ user: userId }),
    Notification.deleteMany({ user: userId }),
    RefreshToken.deleteMany({ user: userId }),
    SocialAccount.deleteMany({ connectedBy: userId }),
    ConnectedPage.deleteMany({ connectedBy: userId }),
    Post.deleteMany({ createdBy: userId }),
    BulkPost.deleteMany({ createdBy: userId }),
    Blog.deleteMany({ author: userId }),
    AuditLog.deleteMany({ user: userId }),
  ]);

  await User.findByIdAndDelete(userId);
  await logAdminAction(req, `User deleted (cascade): ${user.email}`, {
    userId,
    workspacesDeleted: workspaceIds.length,
  });
  return new ApiResponse(200, "User deleted successfully.").send(res);
});

const verifyUserEmail = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isEmailVerified: true, emailVerificationToken: undefined },
    { new: true }
  );
  if (!user) throw ApiError.notFound("User not found.");
  await logAdminAction(req, `Email verified for: ${user.email}`, { userId: user._id });
  return new ApiResponse(200, "User email verified successfully.", user.toSafeObject()).send(res);
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const tempPassword = req.body.password || crypto.randomBytes(6).toString("hex");
  const user = await User.findById(req.params.id).select("+password");
  if (!user) throw ApiError.notFound("User not found.");
  user.password = tempPassword;
  await user.save();
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });
  await logAdminAction(req, `Password reset for: ${user.email}`, { userId: user._id });
  return new ApiResponse(200, "Password reset successfully.", {
    user: user.toSafeObject(),
    temporaryPassword: tempPassword,
  }).send(res);
});

const getUserActivity = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, userId } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {
    event: { $in: ["user_login", "user_login_failed", "user_logout", "user_updated", "admin_action"] },
  };
  if (userId) filter.user = userId;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    AuditLog.countDocuments(filter),
  ]);

  return new ApiResponse(200, "User activity fetched successfully.", items, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

// ─── Workspaces ──────────────────────────────────────────────

const manageWorkspaces = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (search) filter.name = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const [items, total] = await Promise.all([
    Workspace.find(filter)
      .populate("owner", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    Workspace.countDocuments(filter),
  ]);

  const withStats = await Promise.all(
    items.map(async (ws) => {
      const [posts, accounts, pages] = await Promise.all([
        Post.countDocuments({ workspace: ws._id }),
        SocialAccount.countDocuments({ workspace: ws._id, connectSource: { $ne: "dataset" } }),
        ConnectedPage.countDocuments({ workspace: ws._id }),
      ]);
      return { ...ws.toObject(), stats: { posts, accounts, pages } };
    })
  );

  return new ApiResponse(200, "Workspaces fetched successfully.", withStats, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

const createWorkspaceAdmin = asyncHandler(async (req, res) => {
  const { name, description, ownerId, plan } = req.body;
  if (!name || !ownerId) throw ApiError.badRequest("name and ownerId are required.");

  const owner = await User.findById(ownerId);
  if (!owner) throw ApiError.notFound("Owner user not found.");

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  const workspace = await Workspace.create({
    name,
    slug,
    description: description || "",
    owner: ownerId,
    plan: plan || "free",
  });

  await logAdminAction(req, `Workspace created: ${name}`, { workspaceId: workspace._id });
  return new ApiResponse(201, "Workspace created successfully.", workspace).send(res);
});

const updateWorkspaceAdmin = asyncHandler(async (req, res) => {
  const allowed = ["name", "description", "plan", "isActive", "logo"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const workspace = await Workspace.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate("owner", "firstName lastName email");

  if (!workspace) throw ApiError.notFound("Workspace not found.");
  await logAdminAction(req, `Workspace updated: ${workspace.name}`, { workspaceId: workspace._id });
  return new ApiResponse(200, "Workspace updated successfully.", workspace).send(res);
});

const deleteWorkspaceAdmin = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findByIdAndDelete(req.params.id);
  if (!workspace) throw ApiError.notFound("Workspace not found.");
  await logAdminAction(req, `Workspace deleted: ${workspace.name}`, { workspaceId: workspace._id });
  return new ApiResponse(200, "Workspace deleted successfully.").send(res);
});

// ─── Posts ───────────────────────────────────────────────────

const managePosts = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const resolvedStatus = status === "drafts" ? "draft" : status || undefined;
  const searchRegex = search
    ? new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : null;

  const postFilter = {};
  if (resolvedStatus) postFilter.status = resolvedStatus;
  if (searchRegex) postFilter.content = searchRegex;

  const bulkFilter = {};
  if (resolvedStatus && resolvedStatus !== "draft") bulkFilter.status = resolvedStatus;
  if (searchRegex) bulkFilter.content = searchRegex;

  const includeBulk = !resolvedStatus || resolvedStatus !== "draft";
  const includePagePosts = !resolvedStatus || resolvedStatus === "published";

  const [posts, bulks, pagePosts] = await Promise.all([
    Post.find(postFilter)
      .populate("workspace", "name")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean(),
    includeBulk
      ? BulkPost.find(bulkFilter)
          .populate("workspace", "name")
          .populate("createdBy", "firstName lastName email")
          .sort({ createdAt: -1 })
          .lean()
      : Promise.resolve([]),
    includePagePosts
      ? PagePost.find({
          success: true,
          ...(searchRegex ? { postContent: searchRegex } : {}),
        })
          .populate("workspace", "name")
          .sort({ createdAt: -1 })
          .limit(500)
          .lean()
      : Promise.resolve([]),
  ]);

  const mapped = [
    ...posts.map((post) => ({
      ...post,
      source: "post",
    })),
    ...bulks.map((bulk) => ({
      _id: bulk._id,
      content: bulk.content,
      type: bulk.postType || "text",
      status: bulk.status,
      platforms: ["facebook"],
      scheduledAt: bulk.scheduledAt,
      publishedAt: bulk.status === "published" ? bulk.updatedAt : undefined,
      failureReason: bulk.failureReason,
      workspace: bulk.workspace,
      createdBy: bulk.createdBy,
      createdAt: bulk.createdAt,
      source: "bulk",
    })),
    ...pagePosts.map((pp) => ({
      _id: pp._id,
      content: pp.postContent || `(Facebook) ${pp.pageName}`,
      type: "text",
      status: "published",
      platforms: ["facebook"],
      publishedAt: pp.createdAt,
      workspace: pp.workspace,
      createdBy: undefined,
      createdAt: pp.createdAt,
      failureReason: undefined,
      source: "page",
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = mapped.length;
  const items = mapped.slice(skip, skip + l);

  return new ApiResponse(200, "Posts fetched successfully.", items, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l) || 1,
  }).send(res);
});

const deletePostAdmin = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const post = await Post.findByIdAndDelete(id);
  if (post) {
    await logAdminAction(req, `Post deleted: ${post._id}`, { postId: post._id });
    return new ApiResponse(200, "Post deleted successfully.").send(res);
  }

  const bulk = await BulkPost.findByIdAndDelete(id);
  if (bulk) {
    await logAdminAction(req, `Bulk post deleted: ${bulk._id}`, { bulkPostId: bulk._id });
    return new ApiResponse(200, "Post deleted successfully.").send(res);
  }

  const pagePost = await PagePost.findByIdAndDelete(id);
  if (pagePost) {
    await logAdminAction(req, `Page post deleted: ${pagePost._id}`, { pagePostId: pagePost._id });
    return new ApiResponse(200, "Post deleted successfully.").send(res);
  }

  throw ApiError.notFound("Post not found.");
});

// ─── Social Accounts ─────────────────────────────────────────

const getSocialAccountsOverview = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  // Manage = SocialAccounts connected via "manage" only (dataset dual-write excluded)
  const manageFilter = { platform: "facebook", connectSource: { $ne: "dataset" } };
  const datasetFilter = {};

  if (status) {
    manageFilter.status = status;
    datasetFilter.status = status;
  }

  if (search) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    manageFilter.accountName = regex;
    datasetFilter.pageName = regex;
  }

  const [manageRaw, datasetRaw] = await Promise.all([
    SocialAccount.find(manageFilter)
      .populate("workspace", "name")
      .populate("connectedBy", "firstName lastName email")
      .sort({ createdAt: -1 }),
    ConnectedPage.find(datasetFilter)
      .populate("workspace", "name")
      .populate("connectedBy", "firstName lastName email")
      .sort({ pageNumber: 1 }),
  ]);

  const manageAccounts = manageRaw.map(mapManageAccount);
  const datasetAccounts = datasetRaw.map(mapDatasetAccount);
  const refreshRequired = [...manageAccounts, ...datasetAccounts].filter(
    (a) => a.refreshStatus === "refresh_due" || a.refreshStatus === "cron_expired"
  );

  return new ApiResponse(200, "Social accounts fetched successfully.", {
    summary: {
      totalManageAccounts: manageAccounts.length,
      totalDatasetAccounts: datasetAccounts.length,
      totalConnected: manageAccounts.length + datasetAccounts.length,
      tokenRefreshRequired: refreshRequired.length,
      healthy: manageAccounts.length + datasetAccounts.length - refreshRequired.length,
    },
    manageAccounts,
    datasetAccounts,
    tokenRefreshRequired: refreshRequired,
    tokenRefreshPolicy: {
      refreshAfterDays: TOKEN_REFRESH_AFTER_DAYS,
      cronMaxDays: TOKEN_REFRESH_CRON_MAX_DAYS,
    },
  }).send(res);
});

const manualRefreshSocialToken = asyncHandler(async (req, res) => {
  const { source, id } = req.params;

  if (source === "manage") {
    const result = await refreshFacebookTokensForAccount(id);
    await logAdminAction(req, "Manual manage token refresh", { accountId: id, ...result });
    return new ApiResponse(200, "Manage account token refreshed successfully.", {
      source: "manage",
      ...result,
    }).send(res);
  }

  if (source === "dataset") {
    const result = await refreshFacebookTokensForConnectedPage(id);
    await logAdminAction(req, "Manual dataset token refresh", { pageId: id, ...result });
    return new ApiResponse(200, "Dataset account token refreshed successfully.", {
      source: "dataset",
      ...result,
    }).send(res);
  }

  throw ApiError.badRequest('Invalid source. Use "manage" or "dataset".');
});

// ─── Scheduler ───────────────────────────────────────────────

const getSchedulerStatus = asyncHandler(async (_req, res) => {
  const [
    duePosts,
    failedPosts,
    scheduledPosts,
    scheduledBulk,
    failedBulk,
    recentCronLogs,
  ] = await Promise.all([
    Post.countDocuments({
      status: "scheduled",
      scheduledAt: { $lte: new Date() },
    }),
    Post.countDocuments({ status: "failed" }),
    Post.countDocuments({ status: "scheduled" }),
    BulkPost.countDocuments({ status: "scheduled" }),
    BulkPost.countDocuments({ status: "failed" }),
    AuditLog.find({ event: "cron_job_run" }).sort({ createdAt: -1 }).limit(20),
  ]);

  return new ApiResponse(200, "Scheduler status fetched successfully.", {
    jobs: [
      {
        name: "Scheduled Posts",
        schedule: "Every minute",
        dueCount: duePosts,
        scheduledCount: scheduledPosts,
        failedCount: failedPosts,
      },
      {
        name: "Bulk Posts",
        schedule: "Every minute",
        dueCount: scheduledBulk,
        scheduledCount: scheduledBulk,
        failedCount: failedBulk,
      },
      {
        name: "Facebook Token Refresh",
        schedule: process.env.FB_TOKEN_REFRESH_CRON || "0 12 * * *",
        timezone: process.env.CRON_TIMEZONE || "Asia/Karachi",
        dueCount: 0,
        scheduledCount: 0,
        failedCount: 0,
      },
    ],
    recentLogs: recentCronLogs,
  }).send(res);
});

const runSchedulerJob = asyncHandler(async (req, res) => {
  const { job } = req.body;
  let result;

  if (job === "posts") {
    result = await runScheduledPostsJob();
  } else if (job === "bulk") {
    result = await runScheduledBulkPostsJob();
  } else if (job === "token-refresh") {
    result = await runFacebookTokenRefreshJob();
  } else if (job === "all") {
    result = {
      posts: await runScheduledPostsJob(),
      bulk: await runScheduledBulkPostsJob(),
      tokenRefresh: await runFacebookTokenRefreshJob(),
    };
  } else {
    throw ApiError.badRequest('Invalid job. Use "posts", "bulk", "token-refresh", or "all".');
  }

  await AuditLog.create({
    user: req.user._id,
    event: "cron_job_run",
    description: `Manual scheduler run: ${job}`,
    metadata: { job, result },
  });

  return new ApiResponse(200, "Scheduler job executed successfully.", { job, result }).send(res);
});

// ─── Analytics ───────────────────────────────────────────────

const getAnalyticsOverview = asyncHandler(async (_req, res) => {
  const since = daysAgo(30);

  const [userGrowth, postsPerDay, revenueByDay, platformUsage, topUsers] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Post.aggregate([
      { $match: { status: "published", publishedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { status: "succeeded", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    SocialAccount.aggregate([
      { $match: { status: "connected" } },
      { $group: { _id: "$platform", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$createdBy", posts: { $sum: 1 } } },
      { $sort: { posts: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          posts: 1,
          email: "$user.email",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
        },
      },
    ]),
  ]);

  const analyticsMetrics = await Analytics.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: null,
        likes: { $sum: "$metrics.likes" },
        shares: { $sum: "$metrics.shares" },
        comments: { $sum: "$metrics.comments" },
        reach: { $sum: "$metrics.reach" },
        impressions: { $sum: "$metrics.impressions" },
      },
    },
  ]);

  return new ApiResponse(200, "Analytics overview fetched successfully.", {
    userGrowth: userGrowth.map((r) => ({ date: r._id, count: r.count })),
    postsPerDay: postsPerDay.map((r) => ({ date: r._id, count: r.count })),
    revenueByDay: revenueByDay.map((r) => ({ date: r._id, total: r.total })),
    platformUsage: platformUsage.map((r) => ({ platform: r._id, count: r.count })),
    topActiveUsers: topUsers,
    engagement: analyticsMetrics[0] || {
      likes: 0,
      shares: 0,
      comments: 0,
      reach: 0,
      impressions: 0,
    },
  }).send(res);
});

// ─── Subscriptions & Plans ───────────────────────────────────

const managePlans = asyncHandler(async (_req, res) => {
  const planCounts = await Subscription.aggregate([
    { $group: { _id: "$plan", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(planCounts.map((p) => [p._id, p.count]));

  const plans = Object.entries(PLAN_LIMITS).map(([key, limits]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    limits,
    activeSubscriptions: countMap[key] || 0,
  }));

  return new ApiResponse(200, "Plans fetched successfully.", plans).send(res);
});

const manageSubscriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, plan } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (status) filter.status = status;
  if (plan) filter.plan = plan;

  const [items, total] = await Promise.all([
    Subscription.find(filter)
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    Subscription.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Subscriptions fetched successfully.", items, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

const updateSubscriptionAdmin = asyncHandler(async (req, res) => {
  const { plan, status, billingCycle } = req.body;
  const updates = {};
  if (plan) {
    updates.plan = plan;
    updates.limits = PLAN_LIMITS[plan];
  }
  if (status) updates.status = status;
  if (billingCycle) updates.billingCycle = billingCycle;

  const subscription = await Subscription.findByIdAndUpdate(req.params.id, updates, { new: true }).populate(
    "workspace",
    "name"
  );
  if (!subscription) throw ApiError.notFound("Subscription not found.");

  if (plan) {
    await Workspace.findByIdAndUpdate(subscription.workspace?._id || subscription.workspace, { plan });
  }

  await AuditLog.create({
    user: req.user._id,
    event: "subscription_changed",
    description: `Subscription updated`,
    metadata: { subscriptionId: subscription._id, updates },
  });

  return new ApiResponse(200, "Subscription updated successfully.", subscription).send(res);
});

// ─── Payments ────────────────────────────────────────────────

const managePayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (status) filter.status = status;

  const [items, total, summary] = await Promise.all([
    Payment.find(filter)
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    Payment.countDocuments(filter),
    Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  return new ApiResponse(200, "Payments fetched successfully.", {
    items,
    summary: Object.fromEntries(summary.map((s) => [s._id, { count: s.count, amount: s.amount }])),
  }, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

// ─── AI ──────────────────────────────────────────────────────

const getAiOverview = asyncHandler(async (_req, res) => {
  const configured = Boolean(
    process.env.GROQ_API_KEY?.trim() ||
      process.env.GROK_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim()
  );
  return new ApiResponse(200, "AI overview fetched successfully.", {
    configured,
    provider: "groq",
    totalRequests: 0,
    tokensConsumed: 0,
    failedRequests: 0,
    dailyStats: [],
    note: "AI usage metering is not persisted yet. Connection status is live.",
  }).send(res);
});

// ─── Media ───────────────────────────────────────────────────

const manageMedia = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, type } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (search) filter.fileName = new RegExp(search, "i");
  if (type) filter.fileType = type;

  const [items, total, storageAgg] = await Promise.all([
    Media.find(filter)
      .populate("workspace", "name")
      .populate("uploadedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    Media.countDocuments(filter),
    Media.aggregate([{ $group: { _id: "$fileType", count: { $sum: 1 } } }]),
  ]);

  return new ApiResponse(200, "Media fetched successfully.", {
    items,
    byType: Object.fromEntries(storageAgg.map((s) => [s._id, s.count])),
  }, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

const deleteMediaAdmin = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw ApiError.notFound("Media not found.");

  if (media.publicId) {
    try {
      await deleteFromCloudinary(media.publicId, media.fileType === "video" ? "video" : "image");
    } catch {
      // continue deleting DB record
    }
  }

  await media.deleteOne();
  await logAdminAction(req, `Media deleted: ${media.fileName}`, { mediaId: media._id });
  return new ApiResponse(200, "Media deleted successfully.").send(res);
});

// ─── Notifications ───────────────────────────────────────────

const manageNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const [items, total] = await Promise.all([
    Notification.find()
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    Notification.countDocuments(),
  ]);

  return new ApiResponse(200, "Notifications fetched successfully.", items, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, userIds, channel = "in_app" } = req.body;
  if (!title || !message) throw ApiError.badRequest("title and message are required.");

  let targets;
  if (Array.isArray(userIds) && userIds.length) {
    targets = userIds;
  } else {
    const users = await User.find({ isActive: true }).select("_id");
    targets = users.map((u) => u._id);
  }

  const docs = targets.map((userId) => ({
    user: userId,
    type: "admin_broadcast",
    channel,
    title,
    message,
  }));

  const created = await Notification.insertMany(docs);
  await logAdminAction(req, `Broadcast notification to ${created.length} users`, { title });

  return new ApiResponse(201, "Notification broadcast successfully.", {
    sent: created.length,
  }).send(res);
});

// ─── Support / Contact ───────────────────────────────────────

const manageSupport = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l),
    ContactMessage.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Support messages fetched successfully.", items, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

const updateSupportTicket = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["new", "in_progress", "resolved"].includes(status)) {
    throw ApiError.badRequest("Invalid status.");
  }

  const ticket = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!ticket) throw ApiError.notFound("Support ticket not found.");
  await logAdminAction(req, `Support ticket ${status}: ${ticket.email}`, { ticketId: ticket._id });
  return new ApiResponse(200, "Support ticket updated successfully.", ticket).send(res);
});

// ─── Blogs ───────────────────────────────────────────────────

const manageBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (status) filter.status = status;
  if (search) filter.title = new RegExp(search, "i");

  const [items, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    Blog.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Blogs fetched successfully.", items, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

// ─── Reports ─────────────────────────────────────────────────

const getPlatformReports = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalPosts,
    publishedPosts,
    failedPosts,
    totalRevenueAgg,
    failedPayments,
    activeSubscriptions,
    manageAccounts,
    datasetAccounts,
    supportOpen,
    blogsPublished,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Post.countDocuments(),
    Post.countDocuments({ status: "published" }),
    Post.countDocuments({ status: "failed" }),
    Payment.aggregate([{ $match: { status: "succeeded" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.countDocuments({ status: "failed" }),
    Subscription.countDocuments({ status: "active" }),
    SocialAccount.countDocuments({ status: "connected", connectSource: { $ne: "dataset" } }),
    ConnectedPage.countDocuments({ status: "connected" }),
    ContactMessage.countDocuments({ status: { $ne: "resolved" } }),
    Blog.countDocuments({ status: "published" }),
  ]);

  return new ApiResponse(200, "Platform report generated successfully.", {
    users: { total: totalUsers, active: activeUsers },
    posts: { total: totalPosts, published: publishedPosts, failed: failedPosts },
    payments: { revenue: totalRevenueAgg[0]?.total || 0, failed: failedPayments },
    subscriptions: { active: activeSubscriptions },
    social: { manage: manageAccounts, dataset: datasetAccounts },
    support: { open: supportOpen },
    blogs: { published: blogsPublished },
    generatedAt: new Date().toISOString(),
  }).send(res);
});

// ─── Audit Logs ──────────────────────────────────────────────

const viewLogs = asyncHandler(async (req, res) => {
  const { event, page = 1, limit = 50 } = req.query;
  const { skip, page: p, limit: l } = paginate(page, limit);

  const filter = {};
  if (event) filter.event = event;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("user", "firstName lastName email")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    AuditLog.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Logs fetched successfully.", items, {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  }).send(res);
});

// ─── API Settings / System ───────────────────────────────────

const getApiSettings = asyncHandler(async (_req, res) => {
  const check = (key) => Boolean(process.env[key]?.trim());

  return new ApiResponse(200, "API settings status fetched successfully.", {
    services: [
      { name: "Facebook API", key: "FB_APP_ID", connected: check("FB_APP_ID") && check("FB_APP_SECRET") },
      { name: "Google OAuth", key: "GOOGLE_CLIENT_ID", connected: check("GOOGLE_CLIENT_ID") },
      { name: "GitHub OAuth", key: "GITHUB_CLIENT_ID", connected: check("GITHUB_CLIENT_ID") },
      { name: "Groq AI", key: "GROQ_API_KEY", connected: check("GROQ_API_KEY") || check("GROK_API_KEY") || check("OPENAI_API_KEY") },
      {
        name: "Cloudinary",
        key: "CLOUDINARY",
        connected: check("CLOUDINARY_CLOUD_NAME") && check("CLOUDINARY_API_KEY") && check("CLOUDINARY_API_SECRET"),
      },
      { name: "Email / SMTP", key: "SMTP", connected: check("SMTP_HOST") || check("EMAIL_HOST") || check("RESEND_API_KEY") },
      { name: "Stripe", key: "STRIPE", connected: check("STRIPE_SECRET_KEY") },
      { name: "MongoDB", key: "MONGO", connected: check("MONGO_URL") || check("MONGODB_URI") },
      { name: "JWT", key: "JWT_SECRET", connected: check("JWT_SECRET") || check("JWT_SECRET_KEY") },
      { name: "Encryption", key: "ENCRYPTION_KEY", connected: check("ENCRYPTION_KEY") },
    ],
    note: "Secrets are never exposed. Only connection status is shown.",
  }).send(res);
});

const getPlatformSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrCreateSettings();
  return new ApiResponse(200, "Platform settings fetched successfully.", settings).send(res);
});

const updatePlatformSettings = asyncHandler(async (req, res) => {
  const allowed = [
    "websiteName",
    "logo",
    "favicon",
    "contactEmail",
    "supportEmail",
    "defaultTimezone",
    "defaultLanguage",
    "maintenanceMode",
    "announcementBanner",
    "featureFlags",
    "globalLimits",
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const settings = await PlatformSettings.findOneAndUpdate({ key: "default" }, updates, {
    new: true,
    upsert: true,
  });

  await logAdminAction(req, "Platform settings updated", { updates: Object.keys(updates) });
  return new ApiResponse(200, "Platform settings updated successfully.", settings).send(res);
});

const getSecurityOverview = asyncHandler(async (_req, res) => {
  const since = daysAgo(7);

  const [activeSessions, failedLogins, recentFailed] = await Promise.all([
    RefreshToken.countDocuments({ revoked: false, expiresAt: { $gt: new Date() } }),
    AuditLog.countDocuments({ event: "user_login_failed", createdAt: { $gte: since } }),
    AuditLog.find({ event: "user_login_failed" })
      .populate("user", "email")
      .sort({ createdAt: -1 })
      .limit(20),
  ]);

  return new ApiResponse(200, "Security overview fetched successfully.", {
    jwtConfigured: Boolean(process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET_KEY?.trim()),
    encryptionConfigured: Boolean(process.env.ENCRYPTION_KEY?.trim()),
    activeSessions,
    failedLoginAttempts7d: failedLogins,
    recentFailedLogins: recentFailed,
  }).send(res);
});

const getSystemStatus = asyncHandler(async (_req, res) => {
  const mem = process.memoryUsage();
  return new ApiResponse(200, "System status fetched successfully.", {
    server: {
      status: "online",
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      env: process.env.NODE_ENV || "development",
    },
    memory: {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    },
    database: { status: "connected" },
  }).send(res);
});

export {
  getDashboardOverview,
  manageUsers,
  getUserById,
  updateUserStatus,
  updateUser,
  deleteUser,
  verifyUserEmail,
  resetUserPassword,
  getUserActivity,
  manageWorkspaces,
  createWorkspaceAdmin,
  updateWorkspaceAdmin,
  deleteWorkspaceAdmin,
  managePosts,
  deletePostAdmin,
  getSocialAccountsOverview,
  manualRefreshSocialToken,
  getSchedulerStatus,
  runSchedulerJob,
  getAnalyticsOverview,
  managePlans,
  manageSubscriptions,
  updateSubscriptionAdmin,
  managePayments,
  getAiOverview,
  manageMedia,
  deleteMediaAdmin,
  manageNotifications,
  broadcastNotification,
  manageSupport,
  updateSupportTicket,
  manageBlogs,
  getPlatformReports,
  viewLogs,
  getApiSettings,
  getPlatformSettings,
  updatePlatformSettings,
  getSecurityOverview,
  getSystemStatus,
};
