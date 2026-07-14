import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Blog from "../models/blog.model.js";

const slugify = (title) => title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

// POST /api/v1/blogs
const createBlog = asyncHandler(async (req, res) => {
  const { title, excerpt, content, coverImage, category, tags, readTime } = req.body;

  const blog = await Blog.create({
    title,
    slug: slugify(title),
    excerpt,
    content,
    coverImage,
    category,
    tags,
    readTime,
    author: req.user._id,
  });

  return new ApiResponse(201, "Blog created successfully.", blog).send(res);
});

// GET /api/v1/blogs?category=&search=&page=&limit=
const listBlogs = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;

  const filter = { status: "published" };
  if (category && category !== "All") filter.category = category;
  if (search) filter.title = new RegExp(search, "i");

  const [items, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "firstName lastName avatar")
      .sort({ publishedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Blog.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Blogs fetched successfully.", items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  }).send(res);
});

// GET /api/v1/blogs/:slug
const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate("author", "firstName lastName avatar");
  if (!blog) throw ApiError.notFound("Blog post not found.");

  return new ApiResponse(200, "Blog fetched successfully.", blog).send(res);
});

// PATCH /api/v1/blogs/:id
const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!blog) throw ApiError.notFound("Blog post not found.");

  return new ApiResponse(200, "Blog updated successfully.", blog).send(res);
});

// DELETE /api/v1/blogs/:id
const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw ApiError.notFound("Blog post not found.");

  return new ApiResponse(200, "Blog deleted successfully.").send(res);
});

// PATCH /api/v1/blogs/:id/publish
const publishBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    { status: "published", publishedAt: new Date() },
    { new: true }
  );
  if (!blog) throw ApiError.notFound("Blog post not found.");

  return new ApiResponse(200, "Blog published successfully.", blog).send(res);
});

export { createBlog, listBlogs, getBlogBySlug, updateBlog, deleteBlog, publishBlog };
