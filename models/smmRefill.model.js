import mongoose from "mongoose";

const smmRefillSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "SmmOrder", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "processing", "completed", "rejected", "failed"], default: "pending" },
    providerRefillId: { type: String, default: "" },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

smmRefillSchema.index({ order: 1, createdAt: -1 });
smmRefillSchema.index({ workspace: 1, status: 1, createdAt: -1 });

export default mongoose.model("SmmRefill", smmRefillSchema);
