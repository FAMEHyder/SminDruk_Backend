import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import Analytics from "../models/analytics.model.js";

// POST /api/v1/analytics (ingest a metrics snapshot — typically called by a sync worker)
const recordMetrics = asyncHandler(async (req, res) => {
  const record = await Analytics.create(req.body);
  return new ApiResponse(201, "Analytics recorded successfully.", record).send(res);
});

// GET /api/v1/analytics?workspaceId=&platform=&period=daily|weekly|monthly&from=&to=
const getReport = asyncHandler(async (req, res) => {
  const { workspaceId, platform, period = "daily", from, to } = req.query;

  const filter = { workspace: workspaceId, period };
  if (platform) filter.platform = platform;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await Analytics.find(filter).sort({ date: 1 });

  const totals = records.reduce(
    (acc, r) => {
      Object.entries(r.metrics.toObject()).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value;
      });
      return acc;
    },
    { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0, followers: 0 }
  );

  return new ApiResponse(200, "Analytics report generated successfully.", { records, totals }).send(res);
});

export { recordMetrics, getReport };
