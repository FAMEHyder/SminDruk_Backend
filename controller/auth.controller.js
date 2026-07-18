import { generateAuthTokens, verifyRefreshToken } from "../utils/generateTokens.js";
import { getFrontendUrl } from "../utils/env.js";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import AuditLog from "../models/auditLog.model.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

const REFRESH_TOKEN_TTL_DAYS = 30;

const issueTokensForUser = async (user, req) => {
  const { accessToken, refreshToken } = generateAuthTokens(user);

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};

/** Generates a 6-digit numeric verification code (matches the frontend's OTP input). */
const generateVerificationCode = () => crypto.randomInt(100000, 999999).toString();

const isEmailConfigured = () => Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const verificationCode = generateVerificationCode();

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    emailVerificationToken: verificationCode,
  });

  let emailSent = false;
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your Smindruk account",
        html: `<p>Welcome to Smindruk! Your verification code is: <b>${verificationCode}</b></p>`,
      });
      emailSent = true;
    } catch (error) {
      logger.warn(`Verification email could not be sent: ${error.message}`);
    }
  } else {
    logger.warn(`EMAIL_HOST is not configured — verification code for ${email}: ${verificationCode}`);
  }

  return new ApiResponse(201, "Account created. Please verify your email.", {
    user: user.toSafeObject(),
    emailSent,
    // Only exposed when no SMTP is configured yet, so local/dev testing isn't blocked
    // waiting on an email that will never arrive. Remove once EMAIL_* is set in production.
    ...(emailSent ? {} : { devVerificationCode: verificationCode }),
  }).send(res);
});

// POST /api/v1/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound("No account found for this email.");
  if (user.isEmailVerified) return new ApiResponse(200, "This email is already verified.").send(res);

  const verificationCode = generateVerificationCode();
  user.emailVerificationToken = verificationCode;
  await user.save();

  let emailSent = false;
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Your new Smindruk verification code",
        html: `<p>Your new verification code is: <b>${verificationCode}</b></p>`,
      });
      emailSent = true;
    } catch (error) {
      logger.warn(`Verification email could not be sent: ${error.message}`);
    }
  } else {
    logger.warn(`EMAIL_HOST is not configured — verification code for ${email}: ${verificationCode}`);
  }

  return new ApiResponse(200, "Verification code resent.", {
    emailSent,
    ...(emailSent ? {} : { devVerificationCode: verificationCode }),
  }).send(res);
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.password || !(await user.comparePassword(password))) {
    await AuditLog.create({ event: "user_login_failed", metadata: { email }, ipAddress: req.ip });
    throw ApiError.unauthorized("Invalid email or password.");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated.");
  }

  const { accessToken, refreshToken } = await issueTokensForUser(user, req);
  await AuditLog.create({ user: user._id, event: "user_login", ipAddress: req.ip });

  return new ApiResponse(200, "Logged in successfully.", {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  }).send(res);
});

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.updateOne({ token: refreshToken }, { revoked: true });
  }
  return new ApiResponse(200, "Logged out successfully.").send(res);
});

// POST /api/v1/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) throw ApiError.badRequest("Refresh token is required.");

  const stored = await RefreshToken.findOne({ token, revoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired.");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Refresh token is invalid or expired.");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized("User no longer exists.");

  stored.revoked = true;
  await stored.save();

  const tokens = await issueTokensForUser(user, req);

  return new ApiResponse(200, "Token refreshed successfully.", tokens).send(res);
});

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Respond the same way regardless, to avoid leaking which emails are registered.
    return new ApiResponse(200, "If that email exists, a reset link has been sent.").send(res);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;

  let emailSent = false;
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Smindruk password",
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      });
      emailSent = true;
    } catch (error) {
      logger.warn(`Password reset email could not be sent: ${error.message}`);
    }
  } else {
    logger.warn(`EMAIL_HOST is not configured — password reset token for ${email}: ${resetToken}`);
  }

  return new ApiResponse(200, "If that email exists, a reset link has been sent.", {
    emailSent,
    // Dev-only convenience while no SMTP is configured — remove once EMAIL_* is set.
    ...(emailSent ? {} : { devResetToken: resetToken }),
  }).send(res);
});

// POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw ApiError.badRequest("Password reset token is invalid or has expired.");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await AuditLog.create({ user: user._id, event: "password_changed" });

  return new ApiResponse(200, "Password has been reset successfully.").send(res);
});

// POST /api/v1/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email, emailVerificationToken: code });
  if (!user) {
    throw ApiError.badRequest("Verification code is invalid or has expired.");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  const { accessToken, refreshToken } = await issueTokensForUser(user, req);

  return new ApiResponse(200, "Email verified successfully.", {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  }).send(res);
});

// GET /api/v1/auth/google/callback, /github/callback, /facebook/callback
// (passport.authenticate runs first in the route; req.user is already populated here)
const oauthCallback = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken: newRefreshToken } = await issueTokensForUser(req.user, req);

  const redirectUrl = new URL(`${getFrontendUrl()}/dashboard`);
  redirectUrl.searchParams.set("accessToken", accessToken);
  redirectUrl.searchParams.set("refreshToken", newRefreshToken);

  return res.redirect(redirectUrl.toString());
});

export { register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  oauthCallback, };
