import mongoose from "mongoose";
import "dotenv/config";
import Post from "../models/post.model.js";
import { getMongoUrl } from "../utils/env.js";

await mongoose.connect(getMongoUrl(), { dbName: process.env.MONGO_DB_NAME || "smindruk" });

const now = new Date();
const scheduled = await Post.find({ status: "scheduled" }).sort({ scheduledAt: -1 }).limit(10);
console.log("Now:", now.toISOString());
console.log("Scheduled posts:", scheduled.length);

for (const post of scheduled) {
  console.log({
    id: String(post._id),
    status: post.status,
    scheduledAt: post.scheduledAt?.toISOString?.() || post.scheduledAt,
    due: post.scheduledAt ? post.scheduledAt <= now : false,
    socialAccounts: post.socialAccounts?.length ?? 0,
    retryCount: post.retryCount,
    failureReason: post.failureReason,
  });
}

const publishing = await Post.find({ status: "publishing" }).limit(10);
console.log("Stuck publishing:", publishing.length);
for (const post of publishing) {
  console.log({
    id: String(post._id),
    scheduledAt: post.scheduledAt?.toISOString?.(),
    updatedAt: post.updatedAt?.toISOString?.(),
  });
}

await mongoose.disconnect();
