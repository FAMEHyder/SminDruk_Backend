import { getFrontendUrl } from "../utils/env.js";
import Stripe from "stripe";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/subscription.model.js";
import { MANAGEMENT_PLANS, getPlan } from "../utils/subscriptionPlans.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// POST /api/v1/payments/checkout
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { workspaceId, plan, billingCycle, gateway = "stripe" } = req.body;

  if (gateway === "stripe") {
    if (!stripe) throw ApiError.internal("Stripe is not configured on this server.");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: `price_${plan}_${billingCycle}`, quantity: 1 }],
      success_url: `${getFrontendUrl()}/dashboard/settings?checkout=success`,
      cancel_url: `${getFrontendUrl()}/pricing?checkout=cancelled`,
      metadata: { workspaceId, plan, billingCycle },
    });

    return new ApiResponse(201, "Checkout session created successfully.", { url: session.url }).send(res);
  }

  // gateway === "paypal"
  // TODO: integrate PayPal Orders API to create an approval link.
  return new ApiResponse(201, "PayPal checkout is not fully wired up in this demo.", {
    url: `${getFrontendUrl()}/pricing`,
  }).send(res);
});

// POST /api/v1/payments/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const { gatewayPaymentId, gateway = "stripe" } = req.body;

  const payment = await Payment.findOne({ gatewayPaymentId, gateway });
  if (!payment) throw ApiError.notFound("Payment record not found.");

  return new ApiResponse(200, "Payment verified.", payment).send(res);
});

// GET /api/v1/payments/history?workspaceId=
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ workspace: req.workspaceId }).sort({ createdAt: -1 });
  return new ApiResponse(200, "Payment history fetched successfully.", payments).send(res);
});

const getManualPaymentMethods = asyncHandler(async (_req, res) => {
  const enabled = new Set(
    (process.env.SUBSCRIPTION_PAYMENT_METHODS || "bank,easypaisa,jazzcash")
      .split(",")
      .map((method) => method.trim().toLowerCase())
  );
  const methods = [
    {
      id: "bank",
      label: process.env.SUBSCRIPTION_BANK_NAME || "Bank transfer",
      accountTitle: process.env.SUBSCRIPTION_BANK_ACCOUNT_TITLE || "",
      accountNumber: process.env.SUBSCRIPTION_BANK_ACCOUNT_NUMBER || "",
    },
    {
      id: "easypaisa",
      label: "Easypaisa",
      accountTitle: process.env.SUBSCRIPTION_EASYPAISA_ACCOUNT_TITLE || "",
      accountNumber: process.env.SUBSCRIPTION_EASYPAISA_ACCOUNT_NUMBER || "",
    },
    {
      id: "jazzcash",
      label: "JazzCash",
      accountTitle: process.env.SUBSCRIPTION_JAZZCASH_ACCOUNT_TITLE || "",
      accountNumber: process.env.SUBSCRIPTION_JAZZCASH_ACCOUNT_NUMBER || "",
    },
  ].filter((method) => enabled.has(method.id) && method.accountNumber);

  return new ApiResponse(200, "Manual payment methods fetched successfully.", methods).send(res);
});

// POST /api/v1/payments/manual
const submitManualPayment = asyncHandler(async (req, res) => {
  const { plan, paymentMethod, paymentReference, receiptUrl } = req.body;
  if (!MANAGEMENT_PLANS[plan] || plan === "free") throw ApiError.badRequest("Choose a valid paid plan.");
  if (!["bank", "easypaisa", "jazzcash"].includes(paymentMethod)) throw ApiError.badRequest("Choose a valid payment method.");
  if (!receiptUrl || typeof receiptUrl !== "string") throw ApiError.badRequest("Payment screenshot is required.");

  const amount = getPlan(plan).monthlyPrice;
  const existing = await Payment.findOne({
    workspace: req.workspaceId,
    gateway: "manual",
    status: "pending",
  });
  if (existing) throw ApiError.badRequest("You already have a payment awaiting admin approval.");

  const subscription = await Subscription.findOne({ workspace: req.workspaceId });
  if (!subscription) throw ApiError.notFound("Subscription not found for this workspace.");

  const payment = await Payment.create({
    workspace: req.workspaceId,
    subscription: subscription._id,
    gateway: "manual",
    gatewayPaymentId: `manual_${crypto.randomUUID()}`,
    amount,
    currency: "USD",
    status: "pending",
    plan,
    receiptUrl,
    paymentMethod,
    paymentReference: typeof paymentReference === "string" ? paymentReference.trim() : "",
    submittedBy: req.user._id,
  });

  return new ApiResponse(201, "Payment proof submitted. Your plan will activate after admin approval.", payment).send(res);
});

// POST /api/v1/payments/webhook/stripe
const stripeWebhook = asyncHandler(async (req, res) => {
  if (!stripe) throw ApiError.internal("Stripe is not configured on this server.");

  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.error(`Stripe webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await Payment.create({
        workspace: session.metadata?.workspaceId,
        gateway: "stripe",
        gatewayPaymentId: session.id,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency,
        status: "succeeded",
        plan: session.metadata?.plan,
        rawWebhookPayload: session,
      });

      await Subscription.findOneAndUpdate(
        { workspace: session.metadata?.workspaceId },
        {
          plan: session.metadata?.plan,
          billingCycle: session.metadata?.billingCycle,
          status: "active",
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        }
      );
      break;
    }
    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
});

// POST /api/v1/payments/webhook/paypal
const paypalWebhook = asyncHandler(async (req, res) => {
  // TODO: verify PayPal webhook signature and handle subscription/payment events.
  logger.info("Received PayPal webhook event.", req.body?.event_type);
  return res.status(200).json({ received: true });
});

export {
  createCheckoutSession,
  verifyPayment,
  getPaymentHistory,
  getManualPaymentMethods,
  submitManualPayment,
  stripeWebhook,
  paypalWebhook,
};
