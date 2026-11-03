import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Workspace from "../models/workspace.model.js";
import TeamMember from "../models/teamMember.model.js";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import Wallet from "../models/wallet.model.js";
import Notification from "../models/notification.model.js";
import { getPlan } from "../utils/subscriptionPlans.js";

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
    plan: "basic",
  });

  await TeamMember.create({
    workspace: workspace._id,
    user: req.user._id,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  });

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  await Subscription.create({
    workspace: workspace._id,
    plan: "basic",
    status: "trialing",
    startedAt: trialStartedAt,
    trialStartedAt,
    trialEndsAt,
    trialUsed: true,
    currentPeriodEnd: trialEndsAt,
    limits: getPlan("basic").limits,
  });
  await Wallet.create({ workspace: workspace._id, balance: 0, currency: "USD" });

  req.user.activeWorkspace = workspace._id;
  await req.user.save();

  const populated = await Workspace.findById(workspace._id).populate("owner", "firstName lastName email avatar");
  const wsObj = populated ? populated.toObject() : workspace.toObject();

  return new ApiResponse(201, "Workspace created successfully.", {
    ...wsObj,
    currentUserRole: "owner",
    isOwner: true,
  }).send(res);
});

// GET /api/v1/workspaces
const getMyWorkspaces = asyncHandler(async (req, res) => {
  const memberships = await TeamMember.find({ user: req.user._id, status: "active" })
    .populate({
      path: "workspace",
      populate: {
        path: "owner",
        select: "firstName lastName email avatar",
      },
    })
    .sort({ createdAt: 1 });

  const workspaces = memberships
    .map((m) => {
      if (!m.workspace) return null;
      const ws = m.workspace.toObject ? m.workspace.toObject() : m.workspace;
      const ownerId = ws.owner?._id || ws.owner;
      return {
        ...ws,
        currentUserRole: m.role,
        isOwner: String(ownerId) === String(req.user._id),
      };
    })
    .filter(Boolean);

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
  }).populate({
    path: "workspace",
    populate: {
      path: "owner",
      select: "firstName lastName email avatar",
    },
  });

  if (!membership || !membership.workspace) throw ApiError.forbidden("You are not a member of this workspace.");

  const user = await User.findByIdAndUpdate(req.user._id, { activeWorkspace: req.params.id }, { new: true });

  const ws = membership.workspace.toObject ? membership.workspace.toObject() : membership.workspace;
  const ownerId = ws.owner?._id || ws.owner;

  return new ApiResponse(200, "Active workspace switched successfully.", {
    user: user.toSafeObject(),
    workspace: {
      ...ws,
      currentUserRole: membership.role,
      isOwner: String(ownerId) === String(req.user._id),
    },
  }).send(res);
});

// POST /api/v1/workspaces/:id/invite
const inviteMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const normalizedEmail = email ? String(email).toLowerCase().trim() : "";

  const invitedUser = await User.findOne({ email: normalizedEmail });
  if (!invitedUser) {
    throw ApiError.notFound("No Smindruk account found for this email. Ask them to sign up first.");
  }

  if (String(invitedUser._id) === String(req.user._id)) {
    throw ApiError.badRequest("You cannot invite yourself to your own workspace.");
  }

  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw ApiError.notFound("Workspace not found.");

  const existing = await TeamMember.findOne({ workspace: req.params.id, user: invitedUser._id });
  let member;
  if (existing) {
    if (existing.status === "active") {
      throw ApiError.conflict("This user is already part of the workspace.");
    }
    existing.status = "invited";
    existing.role = role || "editor";
    existing.invitedBy = req.user._id;
    existing.invitedAt = new Date();
    await existing.save();
    member = existing;
  } else {
    member = await TeamMember.create({
      workspace: req.params.id,
      user: invitedUser._id,
      role: role || "editor",
      invitedBy: req.user._id,
      status: "invited",
      invitedAt: new Date(),
    });
  }

  // Notify invited user
  await Notification.create({
    user: invitedUser._id,
    type: "team_invitation",
    title: "Team Invitation",
    message: `${req.user.firstName} ${req.user.lastName || ""} invited you to join "${workspace.name}" as ${role || "editor"}.`,
    data: {
      workspaceId: workspace._id,
      workspaceName: workspace.name,
      inviterName: `${req.user.firstName} ${req.user.lastName || ""}`.trim(),
      role: role || "editor",
    },
  });

  return new ApiResponse(201, "Invitation sent successfully.", member).send(res);
});

// GET /api/v1/workspaces/invitations
const getMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await TeamMember.find({
    user: req.user._id,
    status: "invited",
  })
    .populate({
      path: "workspace",
      select: "name slug plan description logo owner",
      populate: {
        path: "owner",
        select: "firstName lastName email avatar",
      },
    })
    .populate("invitedBy", "firstName lastName email avatar")
    .sort({ createdAt: -1 });

  return new ApiResponse(200, "Invitations fetched successfully.", invitations).send(res);
});

// POST /api/v1/workspaces/invitations/:id/accept
const acceptInvitation = asyncHandler(async (req, res) => {
  const member = await TeamMember.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: "invited",
  }).populate({
    path: "workspace",
    populate: {
      path: "owner",
      select: "firstName lastName email avatar",
    },
  });

  if (!member || !member.workspace) {
    throw ApiError.notFound("Invitation not found or already processed.");
  }

  member.status = "active";
  member.joinedAt = new Date();
  await member.save();

  // Set this workspace as active for the accepting user
  await User.findByIdAndUpdate(req.user._id, { activeWorkspace: member.workspace._id });

  // Update subscription usage if available
  await Subscription.findOneAndUpdate(
    { workspace: member.workspace._id },
    { $inc: { "usage.teamMembersUsed": 1 } }
  );

  // Notify the inviter
  if (member.invitedBy) {
    await Notification.create({
      user: member.invitedBy,
      type: "team_invitation",
      title: "Invitation Accepted",
      message: `${req.user.firstName} ${req.user.lastName || ""} accepted your invitation to join "${member.workspace.name}".`,
      data: {
        workspaceId: member.workspace._id,
        memberId: req.user._id,
      },
    });
  }

  const ws = member.workspace.toObject ? member.workspace.toObject() : member.workspace;
  const ownerId = ws.owner?._id || ws.owner;

  return new ApiResponse(200, "Invitation accepted successfully.", {
    member,
    workspace: {
      ...ws,
      currentUserRole: member.role,
      isOwner: String(ownerId) === String(req.user._id),
    },
  }).send(res);
});

// POST /api/v1/workspaces/invitations/:id/reject
const rejectInvitation = asyncHandler(async (req, res) => {
  const member = await TeamMember.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: "invited",
  });

  if (!member) {
    throw ApiError.notFound("Invitation not found.");
  }

  member.status = "removed";
  await member.save();

  return new ApiResponse(200, "Invitation declined successfully.").send(res);
});

export {
  createWorkspace,
  getMyWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  switchWorkspace,
  inviteMember,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
};
