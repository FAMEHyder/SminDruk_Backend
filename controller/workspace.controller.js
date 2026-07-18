import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Workspace from "../models/workspace.model.js";
import TeamMember from "../models/teamMember.model.js";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";

const slugify = (name) =>
  `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;

// POST /api/v1/workspaces
const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const workspace = await Workspace.create({
    name,
    description,
    slug: slugify(name),
    owner: req.user._id,
  });

  await TeamMember.create({
    workspace: workspace._id,
    user: req.user._id,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  });

  await Subscription.create({ workspace: workspace._id, plan: "free" });

  req.user.activeWorkspace = workspace._id;
  await req.user.save();

  return new ApiResponse(201, "Workspace created successfully.", workspace).send(res);
});

// GET /api/v1/workspaces
const getMyWorkspaces = asyncHandler(async (req, res) => {
  const memberships = await TeamMember.find({ user: req.user._id, status: "active" }).populate("workspace");
  const workspaces = memberships.map((m) => m.workspace).filter(Boolean);

  return new ApiResponse(200, "Workspaces fetched successfully.", workspaces).send(res);
});

// PATCH /api/v1/workspaces/:id
const updateWorkspace = asyncHandler(async (req, res) => {
  const { name, description, logo } = req.body;

  const workspace = await Workspace.findByIdAndUpdate(
    req.params.id,
    { $set: { name, description, logo } },
    { new: true, runValidators: true }
  );

  if (!workspace) throw ApiError.notFound("Workspace not found.");

  return new ApiResponse(200, "Workspace updated successfully.", workspace).send(res);
});

// DELETE /api/v1/workspaces/:id
const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw ApiError.notFound("Workspace not found.");

  if (String(workspace.owner) !== String(req.user._id)) {
    throw ApiError.forbidden("Only the workspace owner can delete this workspace.");
  }

  workspace.isActive = false;
  await workspace.save();

  return new ApiResponse(200, "Workspace deleted successfully.").send(res);
});

// POST /api/v1/workspaces/:id/switch
const switchWorkspace = asyncHandler(async (req, res) => {
  const membership = await TeamMember.findOne({
    workspace: req.params.id,
    user: req.user._id,
    status: "active",
  });

  if (!membership) throw ApiError.forbidden("You are not a member of this workspace.");

  const user = await User.findByIdAndUpdate(req.user._id, { activeWorkspace: req.params.id }, { new: true });

  return new ApiResponse(200, "Active workspace switched successfully.", user.toSafeObject()).send(res);
});

// POST /api/v1/workspaces/:id/invite
const inviteMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  const invitedUser = await User.findOne({ email });
  if (!invitedUser) {
    throw ApiError.notFound("No Smindruk account found for this email. Ask them to sign up first.");
  }

  const existing = await TeamMember.findOne({ workspace: req.params.id, user: invitedUser._id });
  if (existing) throw ApiError.conflict("This user is already part of the workspace.");

  const member = await TeamMember.create({
    workspace: req.params.id,
    user: invitedUser._id,
    role,
    invitedBy: req.user._id,
  });

  return new ApiResponse(201, "Invitation sent successfully.", member).send(res);
});

export { createWorkspace,
  getMyWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  switchWorkspace,
  inviteMember, };
