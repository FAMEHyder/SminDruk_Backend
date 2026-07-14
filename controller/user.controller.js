import { uploadToCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import User from "../models/user.model.js";

// GET /api/v1/users/me
const getProfile = asyncHandler(async (req, res) => {
  return new ApiResponse(200, "Profile fetched successfully.", req.user.toSafeObject()).send(res);
});

// PATCH /api/v1/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, bio } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { firstName, lastName, bio } },
    { new: true, runValidators: true }
  );

  return new ApiResponse(200, "Profile updated successfully.", user.toSafeObject()).send(res);
});

// POST /api/v1/users/me/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No avatar file was uploaded.");

  const result = await uploadToCloudinary(req.file.path, "zarshan/avatars");

  const user = await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url }, { new: true });

  return new ApiResponse(200, "Avatar uploaded successfully.", user.toSafeObject()).send(res);
});

// PATCH /api/v1/users/me/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!user.password || !(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized("Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  return new ApiResponse(200, "Password changed successfully.").send(res);
});

// DELETE /api/v1/users/me
const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  return new ApiResponse(200, "Account deactivated successfully.").send(res);
});

export { getProfile, updateProfile, uploadAvatar, changePassword, deleteAccount };
