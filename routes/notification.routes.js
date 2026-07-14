import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as notificationController from "../controller/notification.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/", notificationController.listNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
