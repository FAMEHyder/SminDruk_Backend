import { generateAuthTokens, verifyRefreshToken } from "../utils/generateTokens.js";
import { getFrontendUrl, resolveOAuthFrontendUrl } from "../utils/env.js";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import AuditLog from "../models/auditLog.model.js";
import sendEmail, {
  allowDevEmailBypass,
  isEmailConfigured,
  passwordResetOtpEmail,
  publicEmailSendError,
  verificationEmail,
} from "../utils/sendEmail.js";
import {
  PASSWORD_OTP_TTL_MS,
  PASSWORD_RESET_SELECT,
  PASSWORD_TICKET_TTL_MS,
  clearPasswordReset,
  hashResetSecret,
  purgeExpiredPasswordResets,
} from "../utils/passwordReset.js";
import logger from "../utils/logger.js";

const REFRESH_TOKEN_TTL_DAYS = 30;
const REMEMBER_REFRESH_TOKEN_TTL_DAYS = 3650; // ~10 years — until user logs out

const issueTokensForUser = async (user, req, rememberMe = false) => {
  const { accessToken, refreshToken } = generateAuthTokens(user, rememberMe);
  const ttlDays = rememberMe ? REMEMBER_REFRESH_TOKEN_TTL_DAYS : REFRESH_TOKEN_TTL_DAYS;

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};

/** Generates a 6-digit numeric verification code (matches the frontend's OTP input). */
const generateVerificationCode = () => crypto.randomInt(100000, 999999).toString();
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const deliverEmail = async ({ to, subject, html }) => {
  if (!isEmailConfigured()) {
    throw ApiError.internal("Email server is not configured. Railway cannot use Gmail SMTP. Add BREVO_API_KEY.");
  }
  try {
    await sendEmail({ to, subject, html });
  } catch (error) {
    logger.warn(`Email could not be sent: ${error.message}`);
    throw ApiError.internal(`Reset email could not be sent. ${publicEmailSendError(error)}`);
  }
};

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, password } = req.body;
  const email = normalizeEmail(req.body.email);

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
        subject: "Verify your SminDruk account",
        html: verificationEmail(verificationCode),
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
    ...(allowDevEmailBypass() && !emailSent ? { devVerificationCode: verificationCode } : {}),
  }).send(res);
});

// POST /api/v1/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

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
        subject: "Your new SminDruk verification code",
        html: verificationEmail(verificationCode),
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
    ...(allowDevEmailBypass() && !emailSent ? { devVerificationCode: verificationCode } : {}),
  }).send(res);
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { password, rememberMe = false } = req.body;
  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.password || !(await user.comparePassword(password))) {
    await AuditLog.create({ event: "user_login_failed", metadata: { email }, ipAddress: req.ip });
    throw ApiError.unauthorized("Invalid email or password.");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated.");
  }

  const { accessToken, refreshToken } = await issueTokensForUser(user, req, Boolean(rememberMe));
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

  // Keep long-lived "remember me" sessions alive across silent token refresh.
  const rememberMe =
    stored.expiresAt.getTime() - Date.now() > REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  const tokens = await issueTokensForUser(user, req, rememberMe);

  return new ApiResponse(200, "Token refreshed successfully.", tokens).send(res);
});

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  await purgeExpiredPasswordResets();

  const user = await User.findOne({ email }).select(PASSWORD_RESET_SELECT);
  if (!user) {
    return new ApiResponse(200, "If that email exists, a reset code has been sent.").send(res);
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  user.passwordResetToken = hashResetSecret(`${email}:${otp}`);
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_OTP_TTL_MS);
  user.passwordResetKind = "otp";
  await user.save();

  if (allowDevEmailBypass()) {
    logger.warn(`Email is not configured — password reset OTP for ${email}: ${otp}`);
    return new ApiResponse(200, "If that email exists, a reset code has been sent.", {
      emailSent: false,
      expiresInSeconds: 60,
      devOtp: otp,
    }).send(res);
  }

  try {
    await deliverEmail({
      to: user.email,
      subject: "Your SminDruk password reset code",
      html: passwordResetOtpEmail(otp),
    });
  } catch (error) {
    await clearPasswordReset(user._id);
    throw error;
  }

  return new ApiResponse(200, "If that email exists, a reset code has been sent.", {
    emailSent: true,
    expiresInSeconds: 60,
  }).send(res);
});

// POST /api/v1/auth/verify-reset-otp
const verifyResetOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || "").trim();
  await purgeExpiredPasswordResets();

  const user = await User.findOne({ email }).select(PASSWORD_RESET_SELECT);
  if (!user?.passwordResetToken || user.passwordResetKind !== "otp") {
    throw ApiError.badRequest("OTP is invalid or has expired.");
  }
  if (!user.passwordResetExpires || user.passwordResetExpires.getTime() <= Date.now()) {
    await clearPasswordReset(user._id);
    throw ApiError.badRequest("OTP has expired. Request a new code.");
  }
  if (user.passwordResetToken !== hashResetSecret(`${email}:${code}`)) {
    throw ApiError.badRequest("OTP is invalid or has expired.");
  }

  const ticket = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = hashResetSecret(ticket);
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_TICKET_TTL_MS);
  user.passwordResetKind = "ticket";
  await user.save();

  return new ApiResponse(200, "OTP verified. Set a new password.", { ticket }).send(res);
});

// POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { ticket, password } = req.body;
  await purgeExpiredPasswordResets();

  const user = await User.findOne({ email }).select(PASSWORD_RESET_SELECT);
  if (!user?.passwordResetToken || user.passwordResetKind !== "ticket") {
    throw ApiError.badRequest("Reset session is invalid or has expired.");
  }
  if (!user.passwordResetExpires || user.passwordResetExpires.getTime() <= Date.now()) {
    await clearPasswordReset(user._id);
    throw ApiError.badRequest("Reset session has expired. Request a new code.");
  }
  if (user.passwordResetToken !== hashResetSecret(ticket)) {
    throw ApiError.badRequest("Reset session is invalid or has expired.");
  }

  user.password = password;
  await user.save();
  await clearPasswordReset(user._id);
  await AuditLog.create({ user: user._id, event: "password_changed" });

  return new ApiResponse(200, "Password has been reset successfully.").send(res);
});

// POST /api/v1/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const email = normalizeEmail(req.body.email);

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
  // Match email "Remember me" behaviour — keep the Google session until logout.
  const { accessToken, refreshToken: newRefreshToken } = await issueTokensForUser(req.user, req, true);

  const frontendUrl = resolveOAuthFrontendUrl(req);
  res.clearCookie("oauth_return_to", { path: "/" });

  // Dedicated page establishes the session before the dashboard guard runs.
  const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
  redirectUrl.searchParams.set("accessToken", accessToken);
  redirectUrl.searchParams.set("refreshToken", newRefreshToken);

  return res.redirect(redirectUrl.toString());
});

export { register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyEmail,
  resendVerification,
  oauthCallback, };
