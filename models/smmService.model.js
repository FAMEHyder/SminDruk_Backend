import mongoose from "mongoose";

const smmServiceSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "SmmCategory", required: true },
    name: { type: String, required: true, trim: true, maxlength: 500 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 2000 },
    platform: { type: String, required: true, trim: true, lowercase: true },
    minQuantity: { type: Number, required: true, min: 1, default: 1 },
    maxQuantity: { type: Number, required: true, min: 1 },
    providerCostPerThousand: { type: Number, required: true, min: 0, default: 0 },
    markupType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    markupValue: { type: Number, min: 0, default: 20 },
    ratePerThousand: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD", uppercase: true, trim: true },
    avgDeliveryMinutes: { type: Number, default: 0, min: 0 },
    refillSupported: { type: Boolean, default: false },
    cancelSupported: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    providerName: { type: String, default: "" },
    providerServiceId: { type: String, default: "" },
  },
  { timestamps: true }
);

smmServiceSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
smmServiceSchema.index({ platform: 1, isActive: 1 });

export default mongoose.model("SmmService", smmServiceSchema);
