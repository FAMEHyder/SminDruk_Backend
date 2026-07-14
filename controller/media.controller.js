import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Media from "../models/media.model.js";

// POST /api/v1/media/upload
const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file was uploaded.");

  const result = await uploadToCloudinary(req.file.path, "zarshan/media-library");

  const media = await Media.create({
    workspace: req.body.workspaceId,
    uploadedBy: req.user._id,
    fileName: req.file.originalname,
    fileType: req.file.mimetype.startsWith("video") ? "video" : "image",
    mimeType: req.file.mimetype,
    url: result.secure_url,
    publicId: result.public_id,
    size: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
    tags: req.body.tags ? req.body.tags.split(",").map((t) => t.trim()) : [],
  });

  return new ApiResponse(201, "Media uploaded successfully.", media).send(res);
});

// GET /api/v1/media?workspaceId=&search=&type=&page=&limit=
const listMedia = asyncHandler(async (req, res) => {
  const { workspaceId, search, type, page = 1, limit = 20 } = req.query;

  const filter = { workspace: workspaceId };
  if (type) filter.fileType = type;
  if (search) filter.$or = [{ fileName: new RegExp(search, "i") }, { tags: new RegExp(search, "i") }];

  const [items, total] = await Promise.all([
    Media.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Media.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Media fetched successfully.", items, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  }).send(res);
});

// DELETE /api/v1/media/:id
const deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw ApiError.notFound("Media not found.");

  await deleteFromCloudinary(media.publicId, media.fileType === "video" ? "video" : "image");
  await media.deleteOne();

  return new ApiResponse(200, "Media deleted successfully.").send(res);
});

export { uploadMedia, listMedia, deleteMedia };
