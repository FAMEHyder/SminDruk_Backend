import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    type: { type: String, enum: ["credit", "debit", "refund", "adjustment"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    referenceType: { type: String, enum: ["order", "manual_credit", "manual_debit", "refund"], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, default: "", maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model("WalletTransaction", walletTransactionSchema);
