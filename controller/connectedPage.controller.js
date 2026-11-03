import ConnectedPage from "../models/connectedPage.model.js";
import PagePost from "../models/pagePost.model.js";
import BulkPost from "../models/bulkPost.model.js";
import Post from "../models/post.model.js";
import SocialAccount from "../models/socialAccount.model.js";
import { executeBulkPublish } from "../utils/bulkFacebookPublish.js";
import { executePublish } from "../utils/publishPost.js";
import { buildFacebookPostLink } from "../utils/facebookPostLink.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

// GET /api/v1/connected-pages/trending-meta
const getTrendingMeta = asyncHandler(async (_req, res) => {
  const [maxPageDoc, categories, totalPages] = await Promise.all([
    ConnectedPage.findOne({ status: "connected" }).sort({ pageNumber: -1 }).select("pageNumber"),
    ConnectedPage.distinct("category", {
      status: "connected",
      category: { $exists: true, $nin: ["", null] },
    }),
    ConnectedPage.countDocuments({ status: "connected" }),
  ]);

  return new ApiResponse(200, "Trending dataset meta fetched successfully.", {
    maxPageNumber: maxPageDoc?.pageNumber || 0,
    totalPages,
    categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b)),
  }).send(res);
});

// GET /api/v1/connected-pages?workspaceId=  (user's own trending pages in this workspace)
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
  const { workspaceId, secretKey, content, fromPage, toPage, category, postType, scheduledAt, mediaId, targetType = "dataset", socialAccountIds } =
    req.body;

  if (!workspaceId || !content?.trim()) {
    throw ApiError.badRequest("workspaceId and content are required.");
  }

  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  const isScheduled = parsedScheduledAt && parsedScheduledAt.getTime() > Date.now() + 30_000;

  if (targetType === "accounts") {
    if (!Array.isArray(socialAccountIds) || socialAccountIds.length === 0) {
      throw ApiError.badRequest("Select at least one connected account.");
    }
    const accounts = await SocialAccount.find({
      _id: { $in: socialAccountIds },
      workspace: workspaceId,
      status: "connected",
    }).select("_id platform");
    if (!accounts.length) throw ApiError.badRequest("Selected connected accounts were not found.");

    const post = await Post.create({
      workspace: workspaceId,
      createdBy: req.user._id,
      type: mediaId ? (postType === "video" ? "video" : "image") : "text",
      content,
      platforms: [...new Set(accounts.map((account) => account.platform))],
      media: mediaId ? [mediaId] : [],
      socialAccounts: accounts.map((account) => account._id),
      scheduledAt: isScheduled ? parsedScheduledAt : undefined,
      status: isScheduled ? "scheduled" : "draft",
    });
    if (!isScheduled) await executePublish(post);
    return new ApiResponse(201, isScheduled ? "Account bulk post scheduled successfully." : "Account bulk post published successfully.", post).send(res);
  }

  if (!secretKey?.trim()) throw ApiError.badRequest("secretKey is required for trending dataset posts.");
  const from = Number(fromPage);
  const to = Number(toPage);
  if (Number.isNaN(from) || Number.isNaN(to) || from < 1 || to < from) throw ApiError.badRequest("Invalid page number range.");

  if (isScheduled) {
    const bulkPost = await BulkPost.create({
      workspace: workspaceId,
      createdBy: req.user._id,
      secretKey: secretKey.trim(),
      content,
      fromPage: from,
      toPage: to,
      category: category?.trim() || "",
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
    category: category?.trim() || "",
    postType: postType || "text",
    mediaId,
  });

  try {
    await BulkPost.create({
      workspace: workspaceId,
      createdBy: req.user._id,
      secretKey: secretKey.trim(),
      content,
      fromPage: from,
      toPage: to,
      category: category?.trim() || "",
      postType: postType || "text",
      mediaId: mediaId || undefined,
      scheduledAt: new Date(),
      status: "published",
      publishedCount: result.publishedCount,
      failedCount: result.failedCount,
    });
  } catch (bulkErr) {
    logger.warn(`BulkPost record creation skipped: ${bulkErr.message}`);
  }

  return new ApiResponse(200, "Bulk post published successfully.", result).send(res);
});

// POST /api/v1/connected-pages/posts/fetch
const fetchPostsBySecretKey = asyncHandler(async (req, res) => {
  const { secretKey } = req.body;

  if (!secretKey?.trim()) {
    throw ApiError.badRequest("Secret key is required.");
  }

  const trimmed = secretKey.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyRegex = new RegExp(`^${escaped}$`, "i");

  // Query posts matching this secret key (case-insensitive)
  let posts = await PagePost.find({
    secretKey: keyRegex,
    success: true,
  }).sort({ createdAt: -1 });

  // Fallback: If no exact case-insensitive match found, try prefix search (min 4 chars) to catch minor typos
  if (!posts.length && trimmed.length >= 4) {
    const prefix = escaped.slice(0, Math.min(escaped.length, 5));
    const candidate = await PagePost.findOne({
      secretKey: new RegExp(`^${prefix}`, "i"),
      success: true,
    });
    if (candidate?.secretKey) {
      posts = await PagePost.find({
        secretKey: candidate.secretKey,
        success: true,
      }).sort({ createdAt: -1 });
    }
  }

  const pageIds = [...new Set(posts.map((post) => post.pageId))];
  const pages = await ConnectedPage.find({ pageId: { $in: pageIds } }).select(
    "pageId pageName profilePicture pageNumber"
  );

  const pageMap = new Map(pages.map((page) => [page.pageId, page]));

  const finalPosts = posts.map((post) => {
    const page = pageMap.get(post.pageId);
    const postLink =
      post.postLink ||
      buildFacebookPostLink(post.pageId, post.platformPostId) ||
      (post.platformPostId ? `https://www.facebook.com/${post.pageId}/posts/${post.platformPostId}` : "");

    return {
      _id: post._id,
      secretKey: post.secretKey,
      pageId: post.pageId,
      pageNumber: post.pageNumber ?? page?.pageNumber,
      pageName: post.pageName || page?.pageName || "Unknown Page",
      pageDp: post.profilePicture || page?.profilePicture || "",
      postLink,
      postContent: post.postContent,
      platformPostId: post.platformPostId,
      createdAt: post.createdAt,
    };
  });

  return new ApiResponse(200, "Posts fetched successfully.", finalPosts).send(res);
});

// GET /api/v1/connected-pages/posts/secret-keys
const getRecentSecretKeys = asyncHandler(async (req, res) => {
  const workspaceId = req.query.workspaceId;
  const filter = { secretKey: { $exists: true, $nin: [null, ""] } };
  if (workspaceId) filter.workspace = workspaceId;

  const [pageKeys, bulkKeys] = await Promise.all([
    PagePost.distinct("secretKey", filter),
    BulkPost.distinct("secretKey", filter),
  ]);

  const uniqueKeys = [...new Set([...pageKeys, ...bulkKeys])]
    .filter(Boolean)
    .filter((k) => typeof k === "string" && k.trim().length > 0)
    .slice(0, 20);

  return new ApiResponse(200, "Recent secret keys fetched successfully.", uniqueKeys).send(res);
});

// DELETE /api/v1/connected-pages/:id
const disconnectConnectedPage = asyncHandler(async (req, res) => {
  const page = await ConnectedPage.findByIdAndUpdate(req.params.id, { status: "disconnected" }, { new: true });
  if (!page) throw ApiError.notFound("Connected page not found.");

  return new ApiResponse(200, "Connected page disconnected successfully.").send(res);
});

export {
  getTrendingMeta,
  listConnectedPages,
  createBulkPost,
  fetchPostsBySecretKey,
  getRecentSecretKeys,
  disconnectConnectedPage,
};
