import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as analyticsController from "../controller/analytics.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", analyticsController.recordMetrics);
router.get("/", analyticsController.getReport);

export default router;
