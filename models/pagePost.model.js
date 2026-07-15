import mongoose from "mongoose";

const pagePostSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    socialAccount: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" },
    pageName: { type: String, required: true },
    pageId: { type: String, required: true },
    platformPostId: { type: String },
    postLink: { type: String },
    success: { type: Boolean, default: true },
    error: { type: String },
  },
  { timestamps: true }
);

pagePostSchema.index({ workspace: 1, pageId: 1, createdAt: -1 });

export default mongoose.model("PagePost", pagePostSchema);
