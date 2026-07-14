import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import TeamMember from "../models/teamMember.model.js";

// GET /api/v1/teams/:workspaceId
const getTeamMembers = asyncHandler(async (req, res) => {
  const members = await TeamMember.find({ workspace: req.params.workspaceId })
    .populate("user", "firstName lastName email avatar")
    .sort({ createdAt: 1 });

  return new ApiResponse(200, "Team members fetched successfully.", members).send(res);
});

// DELETE /api/v1/teams/:workspaceId/members/:memberId
const removeMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findOneAndUpdate(
    { _id: req.params.memberId, workspace: req.params.workspaceId },
    { status: "removed" },
    { new: true }
  );

  if (!member) throw ApiError.notFound("Team member not found.");

  return new ApiResponse(200, "Team member removed successfully.").send(res);
});

// PATCH /api/v1/teams/:workspaceId/members/:memberId
const updatePermissions = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const member = await TeamMember.findOneAndUpdate(
    { _id: req.params.memberId, workspace: req.params.workspaceId },
    { role },
    { new: true }
  );

  if (!member) throw ApiError.notFound("Team member not found.");

  return new ApiResponse(200, "Member permissions updated successfully.", member).send(res);
});

export { getTeamMembers, removeMember, updatePermissions };
