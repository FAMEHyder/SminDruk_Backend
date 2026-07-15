import mongoose from "mongoose";

const socialAccountSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    platform: {
      type: String,
      enum: [
        "facebook",
        "instagram",
        "linkedin",
        "x",
        "tiktok",
        "pinterest",
        "youtube",
        "threads",
        "bluesky",
        "mastodon",
        "google_business",
      ],
      required: true,
    },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    /** Facebook/Google Business page category, e.g. "Restaurant", "Local Business". */
    category: { type: String, default: "" },
    avatar: { type: String, default: "" },
    accessToken: { type: String, required: true, select: false },
    refreshToken: { type: String, select: false },
    /** Long-lived user token that produced this page/account token (Facebook-style flows). */
    userAccessToken: { type: String, select: false },
    tokenIssuedAt: { type: Date },
    tokenExpiresAt: { type: Date },
    /** Last daily cron attempt to refresh Facebook tokens (12 PM job). */
    lastTokenRefreshAttemptAt: { type: Date },
    /** Error from the most recent failed token refresh attempt. */
    lastTokenRefreshError: { type: String },
    status: {
      type: String,
      enum: ["connected", "disconnected", "expired", "error"],
      default: "connected",
    },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

socialAccountSchema.index({ workspace: 1, platform: 1, accountId: 1 }, { unique: true });
socialAccountSchema.index({ platform: 1, status: 1, tokenIssuedAt: 1 });

export default mongoose.model("SocialAccount", socialAccountSchema);
