import { contactValidators } from "../utils/validators.js";
import express from "express";
import * as contactController from "../controller/contact.controller.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

router.post("/", validate(contactValidators.contactForm), contactController.submitContactForm);
router.post("/newsletter", validate(contactValidators.newsletter), contactController.subscribeNewsletter);
router.post("/support", contactController.submitSupportRequest);

export default router;
