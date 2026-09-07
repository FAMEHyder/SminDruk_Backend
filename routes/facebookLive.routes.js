import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as facebookLiveController from "../controller/facebookLive.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/quota", facebookLiveController.getLiveQuota);
router.get("/", facebookLiveController.listLives);
router.post("/manage", facebookLiveController.createManageLives);
router.post("/dataset", facebookLiveController.createDatasetLives);

export default router;
