import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as connectedPageController from "../controller/connectedPage.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/trending-meta", connectedPageController.getTrendingMeta);
router.get("/", connectedPageController.listConnectedPages);
router.post("/bulk-post", connectedPageController.createBulkPost);
router.post("/posts/fetch", connectedPageController.fetchPostsBySecretKey);
router.delete("/:id", connectedPageController.disconnectConnectedPage);

export default router;
