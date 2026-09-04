import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    gateway: {
      type: String,
      enum: ["stripe", "paypal", "manual"],
      required: true,
    },
    gatewayPaymentId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    plan: { type: String },
    receiptUrl: { type: String },
    paymentMethod: { type: String, enum: ["bank", "easypaisa", "jazzcash"] },
    paymentReference: { type: String, trim: true, maxlength: 120 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 1000 },
    rawWebhookPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
