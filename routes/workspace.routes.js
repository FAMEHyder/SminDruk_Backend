import { authenticate } from "../middleware/auth.middleware.js";
import { workspaceValidators } from "../utils/validators.js";
import express from "express";
import * as workspaceController from "../controller/workspace.controller.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", validate(workspaceValidators.create), workspaceController.createWorkspace);
router.get("/", workspaceController.getMyWorkspaces);
router.patch("/:id", workspaceController.updateWorkspace);
router.delete("/:id", workspaceController.deleteWorkspace);
router.post("/:id/switch", workspaceController.switchWorkspace);
router.post("/:id/invite", validate(workspaceValidators.invite), workspaceController.inviteMember);

export default router;
