import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["contact_form", "newsletter", "support_request"],
      default: "contact_form",
    },
    name: { type: String },
    email: { type: String, required: true, lowercase: true },
    subject: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ContactMessage", contactMessageSchema);
