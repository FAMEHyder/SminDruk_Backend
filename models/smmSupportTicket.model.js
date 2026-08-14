import mongoose from "mongoose";

const smmSupportTicketSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "SmmOrder" },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    priority: { type: String, enum: ["low", "normal", "high"], default: "normal" },
  },
  { timestamps: true }
);

smmSupportTicketSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model("SmmSupportTicket", smmSupportTicketSchema);
