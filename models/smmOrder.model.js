import mongoose from "mongoose";

const smmOrderSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "SmmService", required: true },
    publicOrderId: { type: String, required: true, unique: true, index: true },
    link: { type: String, required: true, trim: true, maxlength: 2048 },
    quantity: { type: Number, required: true, min: 1 },
    charge: { type: Number, required: true, min: 0 },
    providerCost: { type: Number, required: true, min: 0, select: false },
    commission: { type: Number, required: true, min: 0, select: false },
    currency: { type: String, required: true, uppercase: true },
    status: {
      type: String,
      enum: ["pending_approval", "pending", "processing", "completed", "partial", "cancelled", "refunded", "failed"],
      default: "pending_approval",
    },
    paymentStatus: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
    },
    paymentMethod: { type: String, enum: ["bank", "easypaisa", "jazzcash"], required: true },
    paymentProofUrl: { type: String, required: true },
    paymentReference: { type: String, trim: true, maxlength: 120, default: "" },
    paymentReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentReviewedAt: { type: Date },
    paymentReviewNote: { type: String, trim: true, maxlength: 1000, default: "" },
    providerOrderId: { type: String, default: "" },
    providerPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    startCount: { type: Number },
    remains: { type: Number },
    failureReason: { type: String, default: "" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

smmOrderSchema.index({ workspace: 1, createdAt: -1 });
smmOrderSchema.index({ workspace: 1, status: 1, createdAt: -1 });

export default mongoose.model("SmmOrder", smmOrderSchema);
