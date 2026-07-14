import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as mediaController from "../controller/media.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/upload", upload.single("file"), mediaController.uploadMedia);
router.get("/", mediaController.listMedia);
router.delete("/:id", mediaController.deleteMedia);

export default router;
