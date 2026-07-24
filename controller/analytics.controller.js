import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import Analytics from "../models/analytics.model.js";
import { syncWorkspaceFacebookAnalytics } from "../utils/facebookInsights.js";
import logger from "../utils/logger.js";

// POST /api/v1/analytics (ingest a metrics snapshot — typically called by a sync worker)
const recordMetrics = asyncHandler(async (req, res) => {
  const record = await Analytics.create(req.body);
  return new ApiResponse(201, "Analytics recorded successfully.", record).send(res);
});

// GET /api/v1/analytics?workspaceId=&platform=&period=daily|weekly|monthly&from=&to=&sync=true
// Returns MongoDB data immediately. Live Facebook sync is opt-in and never blocks the response.
const getReport = asyncHandler(async (req, res) => {
  const { workspaceId, platform, period = "daily", from, to, sync } = req.query;

  if (workspaceId && (sync === "true" || sync === "1")) {
    // Fire-and-forget so the client is not blocked on Graph API round-trips.
    syncWorkspaceFacebookAnalytics(workspaceId).catch((error) => {
      logger.warn(`Analytics sync skipped: ${error.message}`);
    });
  }

  const filter = { workspace: workspaceId, period };
  if (platform) filter.platform = platform;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await Analytics.find(filter).sort({ date: 1 }).lean();

  const totals = records.reduce(
    (acc, r) => {
      const metrics = r.metrics || {};
      Object.entries(metrics).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + (value || 0);
      });
      return acc;
    },
    { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0, followers: 0 }
  );

  const byPlatform = {};
  for (const record of records) {
    const key = record.platform || "facebook";
    if (!byPlatform[key]) {
      byPlatform[key] = { platform: key, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 };
    }
    byPlatform[key].likes += record.metrics?.likes || 0;
    byPlatform[key].comments += record.metrics?.comments || 0;
    byPlatform[key].shares += record.metrics?.shares || 0;
    byPlatform[key].reach += record.metrics?.reach || 0;
    byPlatform[key].impressions += record.metrics?.impressions || 0;
  }

  return new ApiResponse(200, "Analytics report generated successfully.", {
    records,
    totals,
    byPlatform: Object.values(byPlatform),
  }).send(res);
});

export { recordMetrics, getReport };
