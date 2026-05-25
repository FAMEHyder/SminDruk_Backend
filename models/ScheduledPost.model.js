import mongoose from "mongoose";

const ScheduledPostSchema = new mongoose.Schema(
  {
    text: String,
    type: {
      type: String,
      enum: ["post", "reel", "story"],
    },
    pages: [String],
    scheduledAt: Date,
    hashtags: String,
    firstComment: String,
    status: {
      type: String,
      default: "scheduled",
    },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
      }
    ],

    fbPostId: String,
    error: String,
  },
  { timestamps: true }
);

export default mongoose.model("ScheduledPost", ScheduledPostSchema);
