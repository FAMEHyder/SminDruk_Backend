import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import express from "express";
import * as adminController from "../controller/admin.controller.js";

const router = express.Router();

router.use(authenticate, isAdmin);

router.get("/users", adminController.manageUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.get("/posts", adminController.managePosts);
router.get("/reports/overview", adminController.getPlatformReports);
router.get("/payments", adminController.managePayments);
router.get("/blogs", adminController.manageBlogs);
router.get("/plans", adminController.managePlans);
router.get("/logs", adminController.viewLogs);
router.patch("/settings", adminController.updatePlatformSettings);

export default router;
