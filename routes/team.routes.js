import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as teamController from "../controller/team.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/:workspaceId", teamController.getTeamMembers);
router.delete("/:workspaceId/members/:memberId", teamController.removeMember);
router.patch("/:workspaceId/members/:memberId", teamController.updatePermissions);

export default router;
