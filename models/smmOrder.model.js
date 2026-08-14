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
    currency: { type: String, required: true, uppercase: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "partial", "cancelled", "refunded", "failed"],
      default: "pending",
    },
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
