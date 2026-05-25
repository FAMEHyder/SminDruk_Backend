import mongoose from "mongoose";

const ConnectedPageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  userAccessToken: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
  },
  pageNumber: {
    type: Number,
    unique: true,
    sparse: true,
  },

  platform: { type: String, default: "facebook" },

  pageId: {
    type: String,
    required: true,
  },

  pageName: {
    type: String,
    required: true,
  },

  pageAccessToken: {
    type: String,
    required: true,
  },

  tokenIssuedAt: {
    type: Date,
    default: Date.now,
  },

  tokenExpiresAt: {
    type: Date,
    required: true,
  },

  connectedAt: {
    type: Date,
    default: Date.now,
  },
});


// ✅ UNIQUE COMBINATION (REAL FIX)
ConnectedPageSchema.index({ userId: 1, pageId: 1 }, { unique: true });

// ✅ AUTO INCREMENT (SAFE)
ConnectedPageSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.pageNumber) {
      const lastPage = await mongoose
        .model("ConnectedPage")
        .findOne()
        .sort({ pageNumber: -1 })
        .select("pageNumber");

      this.pageNumber = lastPage ? lastPage.pageNumber + 1 : 1;
    }

    next();
  } catch (err) {
    next(err);
  }
});


// ✅ DAYS LEFT
ConnectedPageSchema.virtual("daysLeft").get(function () {
  if (!this.tokenExpiresAt) return 0;

  const today = new Date();
  const diffTime = this.tokenExpiresAt - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
});


// ✅ STATUS
ConnectedPageSchema.virtual("status").get(function () {
  if (!this.tokenExpiresAt) return "unknown";

  const today = new Date();
  const diffTime = this.tokenExpiresAt - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days <= 0) return "expired";
  if (days <= 60) return "Rotation-Needed";
  return "active";
});


// ✅ ENABLE VIRTUALS
ConnectedPageSchema.set("toJSON", { virtuals: true });
ConnectedPageSchema.set("toObject", { virtuals: true });

export default mongoose.model("ConnectedPage", ConnectedPageSchema);