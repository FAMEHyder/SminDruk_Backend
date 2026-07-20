import { authenticate } from "../middleware/auth.middleware.js";
import { aiValidators } from "../utils/validators.js";
import express from "express";
import * as aiController from "../controller/ai.controller.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/caption", validate(aiValidators.caption), aiController.generateCaption);
router.post("/hashtags", validate(aiValidators.hashtags), aiController.generateHashtags);
router.post("/image-prompt", validate(aiValidators.promptOnly), aiController.generateImagePrompt);
router.post("/content-calendar", validate(aiValidators.promptOnly), aiController.generateContentCalendar);
router.post("/improve", validate(aiValidators.improve), aiController.improvePost);
router.post("/reply", validate(aiValidators.promptOnly), aiController.generateReply);
router.post("/viral-ideas", validate(aiValidators.promptOnly), aiController.generateViralIdeas);
router.post("/seo-blog", validate(aiValidators.promptOnly), aiController.generateSeoBlog);
router.post("/rewrite", validate(aiValidators.rewrite), aiController.rewriteCaption);
router.post("/translate", validate(aiValidators.translate), aiController.translateCaption);
router.post("/content-ideas", validate(aiValidators.promptOnly), aiController.generateContentIdeas);
router.post("/cta", validate(aiValidators.promptOnly), aiController.generateCta);

export default router;
