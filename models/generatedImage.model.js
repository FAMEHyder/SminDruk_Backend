import mongoose from "mongoose";

const generatedImageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      default: "huggingface",
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

generatedImageSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("GeneratedImage", generatedImageSchema);
