import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeWorkspaceRole, requireWorkspaceMember } from "../middleware/workspace.middleware.js";
import express from "express";
import * as subscriptionController from "../controller/subscription.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/plans", subscriptionController.getPlans);
router.get("/:workspaceId", requireWorkspaceMember, subscriptionController.getSubscription);
router.post("/:workspaceId/trial", requireWorkspaceMember, authorizeWorkspaceRole("owner", "admin"), subscriptionController.startTrial);
router.post("/:workspaceId/upgrade", requireWorkspaceMember, authorizeWorkspaceRole("owner", "admin"), subscriptionController.upgradePlan);
router.post("/:workspaceId/downgrade", requireWorkspaceMember, authorizeWorkspaceRole("owner", "admin"), subscriptionController.downgradePlan);
router.get("/:workspaceId/usage", requireWorkspaceMember, subscriptionController.checkUsage);

export default router;
