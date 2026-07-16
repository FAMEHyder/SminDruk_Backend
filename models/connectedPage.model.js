import mongoose from "mongoose";

const connectedPageSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pageId: { type: String, required: true, unique: true },
    pageName: { type: String, required: true },
    pageNumber: { type: Number, required: true, unique: true },
    profilePicture: { type: String, default: "" },
    category: { type: String, default: "" },
    pageAccessToken: { type: String, required: true, select: false },
    userAccessToken: { type: String, select: false },
    tokenIssuedAt: { type: Date },
    tokenExpiresAt: { type: Date },
    lastTokenRefreshAttemptAt: { type: Date },
    lastTokenRefreshError: { type: String },
    status: {
      type: String,
      enum: ["connected", "disconnected", "expired", "error"],
      default: "connected",
    },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

connectedPageSchema.index({ workspace: 1, pageNumber: 1 });
connectedPageSchema.index({ pageNumber: 1 });

export default mongoose.model("ConnectedPage", connectedPageSchema);
