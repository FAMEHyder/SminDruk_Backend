import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "editor", "viewer"],
      default: "viewer",
    },
    status: {
      type: String,
      enum: ["invited", "active", "removed"],
      default: "invited",
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invitedAt: { type: Date, default: Date.now },
    joinedAt: { type: Date },
  },
  { timestamps: true }
);

teamMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

export default mongoose.model("TeamMember", teamMemberSchema);
