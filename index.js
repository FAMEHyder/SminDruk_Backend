import "dotenv/config";
import express from "express";
import logger from "./utils/logger.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
let isReady = false;

// Railway probes this path during deploy — must respond before heavy startup work finishes.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: isReady ? "ok" : "starting",
    service: "zarshan-backend",
    ready: isReady,
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", service: "zarshan-backend" });
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Zarshan backend listening on port ${PORT}`);
  logger.info(`Health check: http://0.0.0.0:${PORT}/health`);

  import("./bootstrap.js")
    .then(({ bootstrap }) => bootstrap(app, () => { isReady = true; }))
    .catch((error) => {
      logger.error(`Bootstrap failed: ${error.message}`);
      logger.error(error.stack);
    });
});

export default app;
