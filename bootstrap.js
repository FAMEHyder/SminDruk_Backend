import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";
import { globalLimiter } from "./middleware/rateLimiter.middleware.js";
import { startScheduler } from "./utils/scheduler.js";
import {
  getAllowedOrigins,
  getApiUrl,
  getFrontendUrl,
  getLocalApiUrl,
  getLiveApiUrl,
  REQUIRED_ENV_VARS,
  RECOMMENDED_ENV_VARS,
} from "./utils/env.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import swaggerSpec from "./config/swagger.js";
import routes from "./routes/index.js";
import logger from "./utils/logger.js";

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(({ getter }) => !getter()).map(({ label }) => label);

  if (missing.length) {
    logger.error(`Missing required Railway environment variables: ${missing.join(", ")}`);
    logger.error("Railway dashboard → your backend service → Variables → Raw Editor");
    logger.error("Paste the contents of your local Backend/.env file (without comments), then click Deploy.");
    logger.error("Or run locally: node scripts/print-railway-env.cjs  (copies .env in Railway format)");
    for (const { label, hint } of REQUIRED_ENV_VARS.filter(({ label }) => missing.includes(label))) {
      logger.error(`  • ${label} — ${hint}`);
    }
    return { ok: false, missing };
  }

  const missingRecommended = RECOMMENDED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  if (missingRecommended.length) {
    logger.warn(`Optional variables not set (some features may not work): ${missingRecommended.join(", ")}`);
  }

  if (!process.env.ENCRYPTION_KEY?.trim()) {
    logger.warn("ENCRYPTION_KEY is not set — falling back to JWT_SECRET for social token encryption.");
  }

  return { ok: true, missing: [] };
};

const configureApp = (app) => {
  app.use(helmet({ crossOriginResourcePolicy: false }));

  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    })
  );
  app.use(globalLimiter);

  app.use("/api/v1/payments/webhook/stripe", express.raw({ type: "application/json" }));

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(passport.initialize());

  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api/v1", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return allowedOrigins;
};

const bootstrap = async (app, setReady) => {
  const allowedOrigins = configureApp(app);
  const envCheck = validateEnv();

  if (!envCheck.ok) {
    logger.error("Server is up for health checks, but API routes will not work until env vars are set.");
    return;
  }

  try {
    await connectDB();
    startScheduler();
    setReady(true);
    logger.info(`API docs available at ${getApiUrl()}/api/v1/docs`);
    logger.info(`Active API URL: ${getApiUrl()}`);
    logger.info(`Active Frontend URL: ${getFrontendUrl()}`);
    logger.info(`Local API: ${getLocalApiUrl()} | Live API: ${getLiveApiUrl()}`);
    logger.info(`CORS origins: ${[...allowedOrigins].join(", ")}`);
  } catch (error) {
    logger.error(`Database startup failed: ${error.message}`);
    logger.error("Health check stays alive — fix MONGO_URL in Railway Variables and redeploy.");
  }
};

export { bootstrap, validateEnv };
