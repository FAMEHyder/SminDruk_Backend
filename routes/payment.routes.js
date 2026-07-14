import { authenticate } from "../middleware/auth.middleware.js";
import express from "express";
import * as paymentController from "../controller/payment.controller.js";

const router = express.Router();

// Webhooks must stay public (verified via signature) and are mounted with raw body parsing in index.js.
router.post("/webhook/stripe", paymentController.stripeWebhook);
router.post("/webhook/paypal", paymentController.paypalWebhook);

router.use(authenticate);
router.post("/checkout", paymentController.createCheckoutSession);
router.post("/verify", paymentController.verifyPayment);
router.get("/history", paymentController.getPaymentHistory);

export default router;
