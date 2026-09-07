import mongoose from "mongoose";

const facebookLiveResultSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true },
    pageName: { type: String, required: true },
    pageNumber: { type: Number },
    socialAccount: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" },
    connectedPage: { type: mongoose.Schema.Types.ObjectId, ref: "ConnectedPage" },
    liveVideoId: { type: String },
    permalink: { type: String },
    streamUrl: { type: String },
    secureStreamUrl: { type: String },
    success: { type: Boolean, default: false },
    error: { type: String },
  },
  { _id: false }
);

const facebookLiveSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["manage", "dataset"], required: true },
    title: { type: String, default: "", maxlength: 255 },
    description: { type: String, default: "", maxlength: 2200 },
    broadcastStatus: { type: String, enum: ["LIVE_NOW", "SCHEDULED_UNPUBLISHED"], default: "LIVE_NOW" },
    scheduledAt: { type: Date },
    secretKey: { type: String, trim: true, index: true },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    results: [facebookLiveResultSchema],
  },
  { timestamps: true }
);

facebookLiveSchema.index({ workspace: 1, createdAt: -1 });
facebookLiveSchema.index({ workspace: 1, "results.success": 1, createdAt: -1 });

export default mongoose.model("FacebookLive", facebookLiveSchema);
