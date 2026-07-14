import { verifyAccessToken } from "../utils/generateTokens.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";

/**
 * Verifies the JWT access token from the Authorization header
 * (format: "Bearer <token>") and attaches the authenticated user to req.user.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : req.cookies?.accessToken;

  if (!token) {
    throw ApiError.unauthorized("Access token is missing.");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Access token is invalid or expired.");
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    throw ApiError.unauthorized("User associated with this token no longer exists.");
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to one or more roles, e.g. authorize("admin", "owner").
 * Must be used after `authenticate`.
 */
const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to perform this action.");
  }
  next();
};

/** Shortcut middleware restricting a route to platform admins only. */
const isAdmin = authorize("admin", "superadmin");

export { authenticate, authorize, isAdmin };
