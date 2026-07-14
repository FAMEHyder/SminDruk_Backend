import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    gateway: {
      type: String,
      enum: ["stripe", "paypal"],
      required: true,
    },
    gatewayPaymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    plan: { type: String },
    receiptUrl: { type: String },
    rawWebhookPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
