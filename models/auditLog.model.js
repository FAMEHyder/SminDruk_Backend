import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    event: {
      type: String,
      enum: [
        "user_login",
        "user_login_failed",
        "user_logout",
        "user_updated",
        "post_published",
        "post_scheduled",
        "cron_job_run",
        "payment_processed",
        "subscription_changed",
        "admin_action",
        "error",
      ],
      required: true,
    },
    description: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ event: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
