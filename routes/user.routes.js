import { authenticate } from "../middleware/auth.middleware.js";
import { userValidators } from "../utils/validators.js";
import express from "express";
import * as userController from "../controller/user.controller.js";
import validate from "../middleware/validate.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/me", userController.getProfile);
router.patch("/me", validate(userValidators.updateProfile), userController.updateProfile);
router.post("/me/avatar", upload.single("avatar"), userController.uploadAvatar);
router.patch("/me/password", validate(userValidators.changePassword), userController.changePassword);
router.delete("/me", userController.deleteAccount);

export default router;
