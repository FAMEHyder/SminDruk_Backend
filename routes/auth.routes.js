import { authValidators } from "../utils/validators.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import {
  getAllowedOrigins,
  getGoogleCallbackUrl,
  resolveOAuthFrontendUrl,
  trimTrailingSlash,
} from "../utils/env.js";
import express from "express";
import passport from "passport";
import * as authController from "../controller/auth.controller.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

const OAUTH_RETURN_COOKIE = "oauth_return_to";

const readReturnTo = (req) => {
  const raw = typeof req.query.returnTo === "string" ? req.query.returnTo : "";
  const returnTo = trimTrailingSlash(raw);
  if (returnTo && getAllowedOrigins().has(returnTo)) return returnTo;
  return "";
};

/** Persist the frontend origin that started OAuth (cookie + OAuth state). */
const rememberOAuthReturnTo = (req, res, next) => {
  const returnTo = readReturnTo(req);
  if (returnTo) {
    res.cookie(OAUTH_RETURN_COOKIE, returnTo, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
      maxAge: 10 * 60 * 1000,
      path: "/",
    });
  }
  next();
};

const oauthFailureRedirect = (req, res) => {
  const frontend = resolveOAuthFrontendUrl(req);
  res.clearCookie(OAUTH_RETURN_COOKIE, { path: "/" });
  return res.redirect(`${frontend}/login?oauth=error`);
};

/** Custom passport callback so failure can honor the oauth_return_to cookie. */
const authenticateOAuth = (strategy, options = {}) => (req, res, next) => {
  passport.authenticate(strategy, { session: false, ...options }, (err, user) => {
    if (err || !user) return oauthFailureRedirect(req, res);
    req.user = user;
    return next();
  })(req, res, next);
};

router.post("/register", authLimiter, validate(authValidators.register), authController.register);
router.post("/login", authLimiter, validate(authValidators.login), authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forgot-password",
  authLimiter,
  validate(authValidators.forgotPassword),
  authController.forgotPassword
);
router.post("/reset-password", validate(authValidators.resetPassword), authController.resetPassword);
router.post("/verify-email", validate(authValidators.verifyEmail), authController.verifyEmail);
router.post(
  "/resend-verification",
  authLimiter,
  validate(authValidators.resendVerification),
  authController.resendVerification
);

/**
 * Prevents passport from throwing an unhandled "Unknown authentication
 * strategy" error when a provider's CLIENT_ID/SECRET hasn't been configured
 * in .env yet. Returns a clear, actionable error instead.
 */
const requireStrategy = (name) => (req, res, next) => {
  if (!passport._strategy(name)) {
    return res.status(501).json({
      success: false,
      statusCode: 501,
      message: `${name} login isn't configured on this server yet. Set the ${name.toUpperCase()}_CLIENT_ID / ${name.toUpperCase()}_CLIENT_SECRET (or FB_APP_ID / FB_APP_SECRET for Facebook) environment variables to enable it.`,
    });
  }
  next();
};

// OAuth: Google
router.get(
  "/google",
  requireStrategy("google"),
  rememberOAuthReturnTo,
  (req, res, next) => {
    const returnTo = readReturnTo(req);
    const state = returnTo
      ? Buffer.from(JSON.stringify({ returnTo }), "utf8").toString("base64url")
      : undefined;
    return passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      callbackURL: getGoogleCallbackUrl(),
      ...(state ? { state } : {}),
    })(req, res, next);
  }
);
router.get(
  "/google/callback",
  requireStrategy("google"),
  authenticateOAuth("google", { callbackURL: getGoogleCallbackUrl() }),
  authController.oauthCallback
);
/** Alias for Google Console apps registered with /auth/callback/google */
router.get(
  "/callback/google",
  requireStrategy("google"),
  authenticateOAuth("google", { callbackURL: getGoogleCallbackUrl() }),
  authController.oauthCallback
);

// OAuth: GitHub
router.get(
  "/github",
  requireStrategy("github"),
  rememberOAuthReturnTo,
  passport.authenticate("github", { scope: ["user:email"], session: false })
);
router.get(
  "/github/callback",
  requireStrategy("github"),
  authenticateOAuth("github"),
  authController.oauthCallback
);

// OAuth: Facebook
router.get(
  "/facebook",
  requireStrategy("facebook"),
  rememberOAuthReturnTo,
  passport.authenticate("facebook", { scope: ["email"], session: false })
);
router.get(
  "/facebook/callback",
  requireStrategy("facebook"),
  authenticateOAuth("facebook"),
  authController.oauthCallback
);

export default router;
