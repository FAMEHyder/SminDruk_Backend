import { runScheduledPostsJob } from "../utils/scheduler.js";

import { executePublish } from "../utils/publishPost.js";

import asyncHandler from "../utils/asyncHandler.js";

import ApiError from "../utils/apiError.js";

import ApiResponse from "../utils/apiResponse.js";

import mongoose from "mongoose";

import Post from "../models/post.model.js";

import PagePost from "../models/pagePost.model.js";

import BulkPost from "../models/bulkPost.model.js";

import Notification from "../models/notification.model.js";



// POST /api/v1/posts
const createPost = asyncHandler(async (req, res) => {
  const { workspaceId, type, content, platforms, mediaIds, socialAccountIds, scheduledAt, status } = req.body;

  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
  if (scheduledAt && Number.isNaN(parsedScheduledAt.getTime())) {
    throw ApiError.badRequest("Invalid scheduledAt date.");
  }

  const resolvedStatus = status || (parsedScheduledAt ? "scheduled" : "draft");

  if (resolvedStatus === "scheduled" && !parsedScheduledAt) {
    throw ApiError.badRequest("scheduledAt is required when status is scheduled.");
  }

  if (resolvedStatus === "scheduled" && platforms.includes("facebook") && (!socialAccountIds || socialAccountIds.length === 0)) {
    throw ApiError.badRequest("Select at least one Facebook page for scheduled posts.");
  }

  const post = await Post.create({
    workspace: workspaceId,
    createdBy: req.user._id,
    type,
    content,
    platforms,
    media: mediaIds,
    socialAccounts: socialAccountIds,
    scheduledAt: parsedScheduledAt,
    status: resolvedStatus,
  });

  return new ApiResponse(201, "Post created successfully.", post).send(res);
});



// GET /api/v1/posts?workspaceId=&status=&page=&limit=

const listPosts = asyncHandler(async (req, res) => {

  const { workspaceId, status, page = 1, limit = 20 } = req.query;



  const filter = { workspace: workspaceId };

  if (status) filter.status = status;



  const [items, total] = await Promise.all([

    Post.find(filter)

      .populate("media")

      .populate("socialAccounts", "accountName platform avatar category accountId status")

      .sort({ createdAt: -1 })

      .skip((Number(page) - 1) * Number(limit))

      .limit(Number(limit))

      .lean(),

    Post.countDocuments(filter),

  ]);



  return new ApiResponse(200, "Posts fetched successfully.", items, {

    page: Number(page),

    limit: Number(limit),

    total,

    totalPages: Math.ceil(total / Number(limit)),

  }).send(res);

});



// GET /api/v1/posts/stats?workspaceId=
const getPostStats = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");

  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

  const [statusRows, liveLinks] = await Promise.all([
    Post.aggregate([
      { $match: { workspace: workspaceObjectId } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
    PagePost.countDocuments({
      workspace: workspaceId,
      success: true,
      postLink: { $exists: true, $nin: [null, ""] },
    }),
  ]);

  const byStatus = Object.fromEntries(statusRows.map((row) => [row._id, row.n]));
  const total = statusRows.reduce((sum, row) => sum + row.n, 0);

  return new ApiResponse(200, "Post stats fetched successfully.", {
    total,
    published: byStatus.published || 0,
    scheduled: (byStatus.scheduled || 0) + (byStatus.publishing || 0),
    drafts: byStatus.draft || 0,
    failed: byStatus.failed || 0,
    liveLinks,
  }).send(res);
});



// GET /api/v1/posts/page-links?workspaceId=&page=&limit=
const listPagePostLinks = asyncHandler(async (req, res) => {
  const { workspaceId, page = 1, limit = 100 } = req.query;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");

  const filter = {
    workspace: workspaceId,
    success: true,
    postLink: { $exists: true, $nin: [null, ""] },
  };

  const [items, total] = await Promise.all([
    PagePost.find(filter)
      .populate("post", "content type publishedAt status")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Math.min(Number(limit), 100))
      .lean(),
    PagePost.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Page post links fetched successfully.", items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  }).send(res);
});

// GET /api/v1/posts/calendar?workspaceId=&from=&to=
const listCalendarPosts = asyncHandler(async (req, res) => {
  const { workspaceId, from, to } = req.query;
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");

  const statuses = ["scheduled", "published", "failed", "publishing"];

  // Default window: previous month → next two months (keeps month navigation usable).
  const rangeStart = from
    ? new Date(from)
    : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const rangeEnd = to
    ? new Date(to)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0, 23, 59, 59, 999);

  const dateFilter = {
    $or: [
      { scheduledAt: { $gte: rangeStart, $lte: rangeEnd } },
      { publishedAt: { $gte: rangeStart, $lte: rangeEnd } },
      { scheduledAt: null, createdAt: { $gte: rangeStart, $lte: rangeEnd } },
    ],
  };

  const [posts, bulks] = await Promise.all([
    Post.find({ workspace: workspaceId, status: { $in: statuses }, ...dateFilter })
      .populate("media", "url fileType mimeType")
      .select("content type status scheduledAt publishedAt platforms workspace createdBy createdAt updatedAt")
      .sort({ scheduledAt: 1, publishedAt: 1 })
      .limit(500)
      .lean(),
    BulkPost.find({ workspace: workspaceId, status: { $in: statuses }, scheduledAt: { $gte: rangeStart, $lte: rangeEnd } })
      .select("content postType status scheduledAt workspace createdBy failureReason createdAt updatedAt")
      .sort({ scheduledAt: 1 })
      .limit(500)
      .lean(),
  ]);

  const items = [
    ...posts.map((post) => ({
      ...post,
      platforms: post.platforms?.length ? post.platforms : ["facebook"],
      kind: "post",
    })),
    ...bulks.map((bulk) => ({
      _id: bulk._id,
      workspace: bulk.workspace,
      createdBy: bulk.createdBy,
      type: bulk.postType || "text",
      content: bulk.content,
      media: [],
      platforms: ["facebook"],
      status: bulk.status,
      scheduledAt: bulk.scheduledAt,
      publishedAt: bulk.status === "published" ? bulk.updatedAt : undefined,
      retryCount: 0,
      failureReason: bulk.failureReason,
      createdAt: bulk.createdAt,
      updatedAt: bulk.updatedAt,
      kind: "bulk",
    })),
  ];

  return new ApiResponse(200, "Calendar posts fetched successfully.", items).send(res);
});



// GET /api/v1/posts/:id

const getPost = asyncHandler(async (req, res) => {

  const post = await Post.findById(req.params.id)

    .populate("media")

    .populate("socialAccounts", "accountName platform avatar category accountId status");

  if (!post) throw ApiError.notFound("Post not found.");



  return new ApiResponse(200, "Post fetched successfully.", post).send(res);

});



// PATCH /api/v1/posts/:id

const updatePost = asyncHandler(async (req, res) => {

  const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  if (!post) throw ApiError.notFound("Post not found.");



  return new ApiResponse(200, "Post updated successfully.", post).send(res);

});



// DELETE /api/v1/posts/:id

const deletePost = asyncHandler(async (req, res) => {

  const post = await Post.findByIdAndDelete(req.params.id);

  if (!post) throw ApiError.notFound("Post not found.");



  return new ApiResponse(200, "Post deleted successfully.").send(res);

});



// POST /api/v1/posts/:id/duplicate

const duplicatePost = asyncHandler(async (req, res) => {

  const original = await Post.findById(req.params.id);

  if (!original) throw ApiError.notFound("Post not found.");



  const duplicate = await Post.create({

    workspace: original.workspace,

    createdBy: req.user._id,

    type: original.type,

    content: original.content,

    platforms: original.platforms,

    media: original.media,

    socialAccounts: original.socialAccounts,

    status: "draft",

  });



  return new ApiResponse(201, "Post duplicated successfully.", duplicate).send(res);

});



// POST /api/v1/posts/:id/publish  ("Publish Now")

const publishPostNow = asyncHandler(async (req, res) => {

  const post = await Post.findById(req.params.id);

  if (!post) throw ApiError.notFound("Post not found.");



  if (post.platforms.includes("facebook") && (!post.socialAccounts || post.socialAccounts.length === 0)) {

    throw ApiError.badRequest("Select at least one Facebook page before publishing.");

  }



  post.status = "publishing";

  await post.save();



  try {

    await executePublish(post);

    await Notification.create({

      user: req.user._id,

      type: "publish_success",

      title: "Post published",

      message: "Your post was published successfully.",

      metadata: { postId: post._id },

    });

  } catch (error) {

    post.status = "failed";

    post.failureReason = error.message;

    await post.save();

    await Notification.create({

      user: req.user._id,

      type: "publish_failed",

      title: "Post failed to publish",

      message: error.message,

      metadata: { postId: post._id },

    });

    throw ApiError.internal(error.message || "Failed to publish post to one or more platforms.");

  }



  return new ApiResponse(200, "Post published successfully.", post).send(res);

});



// POST /api/v1/posts/run-scheduler (manual trigger — useful for testing the cron logic on demand)
const triggerScheduler = asyncHandler(async (_req, res) => {
  await runScheduledPostsJob();
  return new ApiResponse(200, "Scheduler run triggered successfully.").send(res);
});

// POST /api/v1/posts/cron/run-scheduler — for Railway/external cron (no user auth, secret header)
const cronRunScheduler = asyncHandler(async (req, res) => {
  const secret = process.env.CRON_SECRET?.trim();
  const provided = req.headers["x-cron-secret"];

  if (!secret || provided !== secret) {
    throw ApiError.unauthorized("Invalid cron secret.");
  }

  await runScheduledPostsJob();
  return new ApiResponse(200, "Scheduler run triggered successfully.").send(res);
});

export {
  createPost,
  getPostStats,
  listPagePostLinks,
  listCalendarPosts,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  duplicatePost,
  publishPostNow,
  triggerScheduler,
  cronRunScheduler,
};
