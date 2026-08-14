import TeamMember from "../models/teamMember.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const getWorkspaceId = (req) =>
  req.params.workspaceId || req.query.workspaceId || req.body.workspaceId;

/**
 * Verifies that the authenticated person belongs to the workspace they are
 * attempting to access. SMM wallet and order operations must never trust a
 * workspace id supplied by the browser alone.
 */
const requireWorkspaceMember = asyncHandler(async (req, _res, next) => {
  const workspaceId = getWorkspaceId(req);
  if (!workspaceId) throw ApiError.badRequest("workspaceId is required.");

  const membership = await TeamMember.findOne({
    workspace: workspaceId,
    user: req.user._id,
    status: "active",
  });

  if (!membership) throw ApiError.forbidden("You are not a member of this workspace.");

  req.workspaceId = workspaceId;
  req.workspaceMembership = membership;
  next();
});

const authorizeWorkspaceRole = (...roles) => (req, _res, next) => {
  if (!req.workspaceMembership || !roles.includes(req.workspaceMembership.role)) {
    throw ApiError.forbidden("You do not have permission to perform this workspace action.");
  }
  next();
};

export { requireWorkspaceMember, authorizeWorkspaceRole };
