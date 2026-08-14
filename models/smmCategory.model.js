import mongoose from "mongoose";

const smmCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 500 },
    platform: { type: String, default: "other", trim: true, lowercase: true },
    icon: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

smmCategorySchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.model("SmmCategory", smmCategorySchema);
