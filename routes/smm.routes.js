import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeWorkspaceRole, requireWorkspaceMember } from "../middleware/workspace.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { smmValidators } from "../utils/validators.js";
import * as smmController from "../controller/smm.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/categories", smmController.listCategories);
router.get("/services", smmController.listServices);
router.get("/services/:id", smmController.getService);

router.get("/dashboard", requireWorkspaceMember, smmController.getDashboard);
router.get("/wallet", requireWorkspaceMember, smmController.getWalletSummary);
router.get("/wallet/transactions", requireWorkspaceMember, smmController.listWalletTransactions);
router.get("/orders", requireWorkspaceMember, smmController.listOrders);
router.get("/orders/:id", requireWorkspaceMember, smmController.getOrder);
router.post(
  "/orders",
  validate(smmValidators.createOrder),
  requireWorkspaceMember,
  authorizeWorkspaceRole("owner", "admin", "editor"),
  smmController.createOrder
);

export default router;
