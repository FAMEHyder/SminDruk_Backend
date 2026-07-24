import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    socialAccount: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "x", "tiktok", "pinterest"],
      required: true,
    },
    date: { type: Date, required: true },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
    metrics: {
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ workspace: 1, platform: 1, date: -1 });
analyticsSchema.index({ workspace: 1, period: 1, platform: 1, date: 1 });

export default mongoose.model("Analytics", analyticsSchema);
