import { authValidators } from "../utils/validators.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";
import express from "express";
import passport from "passport";
import * as authController from "../controller/auth.controller.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

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
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get(
  "/google/callback",
  requireStrategy("google"),
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.oauthCallback
);

// OAuth: GitHub
router.get(
  "/github",
  requireStrategy("github"),
  passport.authenticate("github", { scope: ["user:email"], session: false })
);
router.get(
  "/github/callback",
  requireStrategy("github"),
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  authController.oauthCallback
);

// OAuth: Facebook
router.get(
  "/facebook",
  requireStrategy("facebook"),
  passport.authenticate("facebook", { scope: ["email"], session: false })
);
router.get(
  "/facebook/callback",
  requireStrategy("facebook"),
  passport.authenticate("facebook", { session: false, failureRedirect: "/login" }),
  authController.oauthCallback
);

export default router;
