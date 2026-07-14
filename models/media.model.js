import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    mimeType: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    size: { type: Number },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

mediaSchema.index({ workspace: 1, tags: 1 });

export default mongoose.model("Media", mediaSchema);
