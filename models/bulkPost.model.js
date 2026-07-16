import mongoose from "mongoose";

const bulkPostSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    secretKey: { type: String, required: true, trim: true },
    content: { type: String, required: true, maxlength: 2200 },
    fromPage: { type: Number, required: true, min: 1 },
    toPage: { type: Number, required: true, min: 1 },
    category: { type: String, default: "", trim: true },
    postType: {
      type: String,
      enum: ["text", "photo", "video", "reel", "story"],
      default: "text",
    },
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "publishing", "published", "failed"],
      default: "scheduled",
    },
    failureReason: { type: String },
    publishedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bulkPostSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model("BulkPost", bulkPostSchema);
