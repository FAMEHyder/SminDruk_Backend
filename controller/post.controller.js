import { runScheduledPostsJob } from "../utils/scheduler.js";

import { executePublish } from "../utils/publishPost.js";

import asyncHandler from "../utils/asyncHandler.js";

import ApiError from "../utils/apiError.js";

import ApiResponse from "../utils/apiResponse.js";

import Post from "../models/post.model.js";

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

      .limit(Number(limit)),

    Post.countDocuments(filter),

  ]);



  return new ApiResponse(200, "Posts fetched successfully.", items, {

    page: Number(page),

    limit: Number(limit),

    total,

    totalPages: Math.ceil(total / Number(limit)),

  }).send(res);

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
  listPosts,
  getPost,
  updatePost,
  deletePost,
  duplicatePost,
  publishPostNow,
  triggerScheduler,
  cronRunScheduler,
};
