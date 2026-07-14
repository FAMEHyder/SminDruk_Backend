import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as socialAccountController from "../controller/socialAccount.controller.js";

const router = express.Router();

/**
 * These two run as plain browser navigations (the frontend does
 * `window.location.href = ...` and Facebook redirects back here directly),
 * so they can't carry a Bearer token — the workspace/user identity travels
 * in the query string / signed `state` param instead, same as the reference
 * implementation this was adapted from.
 */
router.get("/facebook/connect", socialAccountController.facebookConnectStart);
router.get("/facebook/callback", socialAccountController.facebookConnectCallback);

router.use(authenticate);

router.post("/connect", socialAccountController.connectAccount);
router.get("/", socialAccountController.listAccounts);
router.delete("/:id", socialAccountController.disconnectAccount);
router.post("/:id/refresh-token", socialAccountController.refreshAccountToken);
router.post("/:id/sync", socialAccountController.syncAccount);
router.get("/:id/status", socialAccountController.checkConnectionStatus);

export default router;
