import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import logger from "./utils/logger.js";

// Always load Backend/.env from this file's directory (not process.cwd()).
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 5000;
let isReady = false;

// Railway probes this path during deploy — must respond before heavy startup work finishes.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: isReady ? "ok" : "starting",
    service: "smindruk-backend",
    ready: isReady,
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", service: "smindruk-backend" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Smindruk backend listening on port ${PORT}`);
  logger.info(`Health check: http://0.0.0.0:${PORT}/health`);
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    logger.info(`Railway public URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    logger.info(`If the public URL fails, set Networking target port to ${PORT}`);
  }

  import("./bootstrap.js")
    .then(({ bootstrap }) => bootstrap(app, () => { isReady = true; }))
    .catch((error) => {
      logger.error(`Bootstrap failed: ${error.message}`);
      logger.error(error.stack);
    });
});

server.on("error", (error) => {
  logger.error(`Server failed to start: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason?.stack || reason}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error.stack || error.message}`);
});

export default app;
