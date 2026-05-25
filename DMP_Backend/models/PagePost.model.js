import mongoose from "mongoose";

const pagePostSchema = new mongoose.Schema(
  {
    pageName: {
      type: String,
      required: true,
    },
    pageId: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: true,
    },
    postLink: {
      type: String,
      required: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PagePost", pagePostSchema);