import { authenticate } from "../middleware/auth.middleware.js";
import { postValidators } from "../utils/validators.js";
import express from "express";
import * as postController from "../controller/post.controller.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

// External cron (Railway Cron Jobs) — must be before authenticate middleware
router.post("/cron/run-scheduler", postController.cronRunScheduler);

router.use(authenticate);

router.post("/", validate(postValidators.create), postController.createPost);
router.get("/stats", postController.getPostStats);
router.get("/page-links", postController.listPagePostLinks);
router.get("/", postController.listPosts);
router.get("/:id", postController.getPost);
router.patch("/:id", postController.updatePost);
router.delete("/:id", postController.deletePost);
router.post("/:id/duplicate", postController.duplicatePost);
router.post("/:id/publish", postController.publishPostNow);
router.post("/run-scheduler", postController.triggerScheduler);

export default router;
