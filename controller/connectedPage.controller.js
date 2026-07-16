import ConnectedPage from "../models/connectedPage.model.js";
import PagePost from "../models/pagePost.model.js";
import BulkPost from "../models/bulkPost.model.js";
import { executeBulkPublish } from "../utils/bulkFacebookPublish.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

// GET /api/v1/connected-pages?workspaceId=
const listConnectedPages = asyncHandler(async (req, res) => {
  const pages = await ConnectedPage.find({
    workspace: req.query.workspaceId,
    status: "connected",
  })
    .select("-pageAccessToken -userAccessToken")
    .sort({ pageNumber: 1 });

  const maxPageNumber = pages.length ? pages[pages.length - 1].pageNumber : 0;

  return new ApiResponse(200, "Connected pages fetched successfully.", {
    pages,
    maxPageNumber,
  }).send(res);
});

// POST /api/v1/connected-pages/bulk-post
const createBulkPost = asyncHandler(async (req, res) => {
  const { workspaceId, secretKey, content, fromPage, toPage, postType, scheduledAt, mediaId } = req.body;

  if (!workspaceId || !secretKey?.trim() || !content?.trim()) {
    throw ApiError.badRequest("workspaceId, secretKey, and content are required.");
  }

  const from = Number(fromPage);
  const to = Number(toPage);
  if (Number.isNaN(from) || Number.isNaN(to) || from < 1 || to < from) {
    throw ApiError.badRequest("Invalid page number range.");
  }

  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  const isScheduled = parsedScheduledAt && parsedScheduledAt.getTime() > Date.now() + 30_000;

  if (isScheduled) {
    const bulkPost = await BulkPost.create({
      workspace: workspaceId,
      createdBy: req.user._id,
      secretKey: secretKey.trim(),
      content,
      fromPage: from,
      toPage: to,
      postType: postType || "text",
      mediaId: mediaId || undefined,
      scheduledAt: parsedScheduledAt,
      status: "scheduled",
    });

    return new ApiResponse(201, "Bulk post scheduled successfully.", bulkPost).send(res);
  }

  const result = await executeBulkPublish({
    workspaceId,
    secretKey: secretKey.trim(),
    content,
    fromPage: from,
    toPage: to,
    postType: postType || "text",
    mediaId,
  });

  return new ApiResponse(200, "Bulk post published successfully.", result).send(res);
});

// POST /api/v1/connected-pages/posts/fetch
const fetchPostsBySecretKey = asyncHandler(async (req, res) => {
  const { secretKey } = req.body;

  if (!secretKey?.trim()) {
    throw ApiError.badRequest("Secret key is required.");
  }

  const posts = await PagePost.find({
    secretKey: secretKey.trim(),
    success: true,
    postLink: { $exists: true, $nin: [null, ""] },
  }).sort({ createdAt: -1 });

  const pageIds = [...new Set(posts.map((post) => post.pageId))];
  const pages = await ConnectedPage.find({ pageId: { $in: pageIds } }).select(
    "pageId pageName profilePicture pageNumber"
  );

  const pageMap = new Map(pages.map((page) => [page.pageId, page]));

  const finalPosts = posts.map((post) => {
    const page = pageMap.get(post.pageId);
    return {
      _id: post._id,
      secretKey: post.secretKey,
      pageId: post.pageId,
      pageNumber: post.pageNumber ?? page?.pageNumber,
      pageName: post.pageName || page?.pageName || "Unknown Page",
      pageDp: post.profilePicture || page?.profilePicture || "",
      postLink: post.postLink,
      postContent: post.postContent,
      platformPostId: post.platformPostId,
      createdAt: post.createdAt,
    };
  });

  return new ApiResponse(200, "Posts fetched successfully.", finalPosts).send(res);
});

// DELETE /api/v1/connected-pages/:id
const disconnectConnectedPage = asyncHandler(async (req, res) => {
  const page = await ConnectedPage.findByIdAndUpdate(req.params.id, { status: "disconnected" }, { new: true });
  if (!page) throw ApiError.notFound("Connected page not found.");

  return new ApiResponse(200, "Connected page disconnected successfully.").send(res);
});

export { listConnectedPages, createBulkPost, fetchPostsBySecretKey, disconnectConnectedPage };
