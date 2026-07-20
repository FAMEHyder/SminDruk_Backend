import express from "express";
import rateLimit from "express-rate-limit";
import * as chatbotController from "../controller/chatbot.controller.js";

const router = express.Router();

/** Softer limit so landing visitors can chat without hitting auth limiter. */
const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many chatbot messages. Please wait a bit and try again." },
});

router.use(chatbotLimiter);

router.get("/health", chatbotController.chatbotHealth);
router.post("/ask", chatbotController.askChatbot);

export default router;
