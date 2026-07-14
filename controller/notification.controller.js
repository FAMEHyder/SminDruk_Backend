import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Notification from "../models/notification.model.js";

// GET /api/v1/notifications?page=&limit=
const listNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return new ApiResponse(200, "Notifications fetched successfully.", items, {
    page: Number(page),
    limit: Number(limit),
    total,
    unreadCount,
  }).send(res);
});

// PATCH /api/v1/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound("Notification not found.");

  return new ApiResponse(200, "Notification marked as read.", notification).send(res);
});

// PATCH /api/v1/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return new ApiResponse(200, "All notifications marked as read.").send(res);
});

export { listNotifications, markAsRead, markAllAsRead };
