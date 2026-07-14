import { authenticate } from "../middleware/auth.middleware.js";
import { aiValidators } from "../utils/validators.js";
import express from "express";
import * as aiController from "../controller/ai.controller.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/caption", validate(aiValidators.caption), aiController.generateCaption);
router.post("/hashtags", validate(aiValidators.hashtags), aiController.generateHashtags);
router.post("/rewrite", validate(aiValidators.rewrite), aiController.rewriteCaption);
router.post("/translate", validate(aiValidators.translate), aiController.translateCaption);
router.post("/content-ideas", aiController.generateContentIdeas);
router.post("/cta", aiController.generateCta);

export default router;
