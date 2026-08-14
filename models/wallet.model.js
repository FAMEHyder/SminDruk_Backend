import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    lastTransactionAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
