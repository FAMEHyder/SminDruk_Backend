import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import express from "express";
import * as blogController from "../controller/blog.controller.js";

const router = express.Router();

router.get("/", blogController.listBlogs);
router.get("/:slug", blogController.getBlogBySlug);

router.use(authenticate, isAdmin);
router.post("/", blogController.createBlog);
router.patch("/:id", blogController.updateBlog);
router.delete("/:id", blogController.deleteBlog);
router.patch("/:id/publish", blogController.publishBlog);

export default router;
