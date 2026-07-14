import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["text", "image", "carousel", "video", "reel", "story"],
      required: true,
    },
    content: { type: String, maxlength: 2200, default: "" },
    media: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
    platforms: [
      {
        type: String,
        enum: ["facebook", "instagram", "linkedin", "x", "tiktok", "pinterest"],
      },
    ],
    socialAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "publishing", "published", "failed"],
      default: "draft",
    },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    failureReason: { type: String },
    platformPostIds: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model("Post", postSchema);
