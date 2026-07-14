import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as subscriptionController from "../controller/subscription.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/:workspaceId", subscriptionController.getSubscription);
router.post("/:workspaceId/upgrade", subscriptionController.upgradePlan);
router.post("/:workspaceId/downgrade", subscriptionController.downgradePlan);
router.get("/:workspaceId/usage", subscriptionController.checkUsage);

export default router;
