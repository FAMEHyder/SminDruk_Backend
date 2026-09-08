import mongoose from "mongoose";

const pagePostSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    socialAccount: { type: mongoose.Schema.Types.ObjectId, ref: "SocialAccount" },
    connectedPage: { type: mongoose.Schema.Types.ObjectId, ref: "ConnectedPage" },
    secretKey: { type: String, trim: true, index: true },
    pageNumber: { type: Number },
    pageName: { type: String, required: true },
    pageId: { type: String, required: true },
    platform: { type: String, enum: ["facebook", "instagram", "linkedin", "x"], default: "facebook", index: true },
    platformPostId: { type: String },
    postLink: { type: String },
    postContent: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    success: { type: Boolean, default: true },
    error: { type: String },
  },
  { timestamps: true }
);

pagePostSchema.index({ workspace: 1, pageId: 1, createdAt: -1 });
pagePostSchema.index({ workspace: 1, success: 1, createdAt: -1 });
pagePostSchema.index({ workspace: 1, success: 1, platformPostId: 1 });
pagePostSchema.index(
  { socialAccount: 1, platformPostId: 1 },
  {
    unique: true,
    name: "socialAccount_1_platformPostId_1",
    partialFilterExpression: { platformPostId: { $type: "string", $gt: "" } },
  }
);
pagePostSchema.index({ post: 1, socialAccount: 1 });
pagePostSchema.index({ secretKey: 1, createdAt: -1 });

const PagePost = mongoose.model("PagePost", pagePostSchema);

const ensurePagePostIndexes = async () => {
  const collection = PagePost.collection;
  try {
    const indexes = await collection.indexes();
    const stale = indexes.find(
      (index) =>
        index.name === "socialAccount_1_platformPostId_1" && !index.partialFilterExpression
    );
    if (stale) {
      await collection.dropIndex("socialAccount_1_platformPostId_1");
    }
  } catch (error) {
    if (error.code !== 27 && error.codeName !== "IndexNotFound") {
      throw error;
    }
  }
  await PagePost.syncIndexes();
};

export { ensurePagePostIndexes };
export default PagePost;
