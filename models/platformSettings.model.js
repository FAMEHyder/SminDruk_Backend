import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    websiteName: { type: String, default: "Smindruk" },
    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    defaultTimezone: { type: String, default: "Asia/Karachi" },
    defaultLanguage: { type: String, default: "en" },
    maintenanceMode: { type: Boolean, default: false },
    announcementBanner: { type: String, default: "" },
    featureFlags: { type: mongoose.Schema.Types.Mixed, default: {} },
    globalLimits: {
      maxWorkspacesPerUser: { type: Number, default: 5 },
      maxScheduledPosts: { type: Number, default: 500 },
      storageLimitGB: { type: Number, default: 100 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("PlatformSettings", platformSettingsSchema);
