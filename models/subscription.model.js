import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    plan: {
      type: String,
      enum: ["free", "starter", "professional", "agency", "enterprise"],
      default: "free",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "expired"],
      default: "active",
    },
    startedAt: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    limits: {
      socialAccounts: { type: Number, default: 3 },
      postsPerMonth: { type: Number, default: 30 },
      teamMembers: { type: Number, default: 1 },
      storageGB: { type: Number, default: 1 },
    },
    usage: {
      socialAccountsUsed: { type: Number, default: 0 },
      postsThisMonth: { type: Number, default: 0 },
      teamMembersUsed: { type: Number, default: 1 },
      storageUsedGB: { type: Number, default: 0 },
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    paypalSubscriptionId: { type: String },
  },
  { timestamps: true }
);

subscriptionSchema.index({ workspace: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
