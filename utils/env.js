/**
 * URL helpers for local development and live (Railway/Vercel) deployments.
 * Strips trailing slashes so `${getApiUrl()}/api/v1/...` never produces double slashes.
 */

const trimTrailingSlash = (value) => (value ? value.replace(/\/+$/, "") : value);

/** Reads an env var (with optional fallbacks), trimming whitespace from key and value. */
const getEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
};

const DEFAULT_LOCAL_API = "http://localhost:8000";
const DEFAULT_LIVE_API = "https://smindruk.up.railway.app";
const DEFAULT_LOCAL_FRONTEND = "http://localhost:3000";
const DEFAULT_LIVE_FRONTEND = "https://smindruk.vercel.app";

const parseList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => trimTrailingSlash(item.trim()))
        .filter(Boolean)
    : [];

const isProduction = () => process.env.NODE_ENV === "production";

/** Active backend base URL — local in dev, live in production. */
const getApiUrl = () => {
  if (isProduction()) {
    return trimTrailingSlash(process.env.API_URL_LIVE || process.env.API_URL) || DEFAULT_LIVE_API;
  }
  return trimTrailingSlash(process.env.API_URL_LOCAL || process.env.API_URL) || DEFAULT_LOCAL_API;
};

/** Active frontend base URL — used for OAuth/password-reset redirects. */
const getFrontendUrl = () => {
  if (isProduction()) {
    return trimTrailingSlash(process.env.FRONTEND_URL_LIVE || process.env.FRONTEND_URL) || DEFAULT_LIVE_FRONTEND;
  }
  return trimTrailingSlash(process.env.FRONTEND_URL_LOCAL || process.env.FRONTEND_URL) || DEFAULT_LOCAL_FRONTEND;
};

const getLocalApiUrl = () => trimTrailingSlash(process.env.API_URL_LOCAL || process.env.API_URL) || DEFAULT_LOCAL_API;
const getLiveApiUrl = () => trimTrailingSlash(process.env.API_URL_LIVE || process.env.API_URL) || DEFAULT_LIVE_API;
const getLocalFrontendUrl = () =>
  trimTrailingSlash(process.env.FRONTEND_URL_LOCAL || process.env.FRONTEND_URL) || DEFAULT_LOCAL_FRONTEND;
const getLiveFrontendUrl = () =>
  trimTrailingSlash(process.env.FRONTEND_URL_LIVE || process.env.FRONTEND_URL) || DEFAULT_LIVE_FRONTEND;

/**
 * CORS allow-list — always includes local + live frontends so you can develop
 * locally and test the deployed Vercel app against the same backend.
 */
const getAllowedOrigins = () =>
  new Set(
    [
      ...parseList(process.env.ALLOWED_ORIGINS),
      getLocalFrontendUrl(),
      getLiveFrontendUrl(),
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      DEFAULT_LIVE_FRONTEND,
    ].filter(Boolean)
  );

/** MongoDB connection string — supports common Railway/Atlas variable names. */
const getMongoUrl = () => getEnv("MONGO_URL", "MONGODB_URI", "DATABASE_URL");

/** JWT signing secret. */
const getJwtSecret = () => getEnv("JWT_SECRET", "JWT_SECRET_KEY");

/** All variables that must be present before the server starts. */
const REQUIRED_ENV_VARS = [
  { label: "MONGO_URL", getter: getMongoUrl, hint: "MongoDB Atlas connection string (mongodb+srv://...)" },
  { label: "JWT_SECRET", getter: getJwtSecret, hint: "Random secret for auth tokens" },
];

/** Recommended production variables (warn if missing, do not crash). */
const RECOMMENDED_ENV_VARS = [
  "NODE_ENV",
  "API_URL_LIVE",
  "FRONTEND_URL_LIVE",
  "ENCRYPTION_KEY",
  "FB_APP_ID",
  "FB_APP_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export {
  trimTrailingSlash,
  getEnv,
  getMongoUrl,
  getJwtSecret,
  getApiUrl,
  getFrontendUrl,
  getLocalApiUrl,
  getLiveApiUrl,
  getLocalFrontendUrl,
  getLiveFrontendUrl,
  getAllowedOrigins,
  REQUIRED_ENV_VARS,
  RECOMMENDED_ENV_VARS,
};
