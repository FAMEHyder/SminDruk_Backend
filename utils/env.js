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

const isRailway = () => Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);

const isProduction = () => process.env.NODE_ENV === "production" || isRailway();

/** Railway injects the public hostname without a scheme, e.g. smindruk.up.railway.app */
const getRailwayPublicUrl = () => {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  return domain ? `https://${domain}` : undefined;
};

/** Active backend base URL — local in dev, live in production. */
const getApiUrl = () => {
  if (isProduction()) {
    return (
      trimTrailingSlash(getEnv("API_URL_LIVE", "API_URL")) ||
      getRailwayPublicUrl() ||
      DEFAULT_LIVE_API
    );
  }
  return trimTrailingSlash(getEnv("API_URL_LOCAL", "API_URL")) || DEFAULT_LOCAL_API;
};

/** Active frontend base URL — used for OAuth/password-reset redirects. */
const getFrontendUrl = () => {
  if (isProduction()) {
    return trimTrailingSlash(getEnv("FRONTEND_URL_LIVE", "FRONTEND_URL")) || DEFAULT_LIVE_FRONTEND;
  }
  return trimTrailingSlash(getEnv("FRONTEND_URL_LOCAL", "FRONTEND_URL")) || DEFAULT_LOCAL_FRONTEND;
};

const getLocalApiUrl = () => trimTrailingSlash(getEnv("API_URL_LOCAL", "API_URL")) || DEFAULT_LOCAL_API;
const getLiveApiUrl = () => trimTrailingSlash(getEnv("API_URL_LIVE", "API_URL")) || DEFAULT_LIVE_API;
const getLocalFrontendUrl = () =>
  trimTrailingSlash(getEnv("FRONTEND_URL_LOCAL", "FRONTEND_URL")) || DEFAULT_LOCAL_FRONTEND;
const getLiveFrontendUrl = () =>
  trimTrailingSlash(getEnv("FRONTEND_URL_LIVE", "FRONTEND_URL")) || DEFAULT_LIVE_FRONTEND;

/** Google OAuth — supports both GOOGLE_* and Google_* .env key styles. */
const getGoogleClientId = () => getEnv("GOOGLE_CLIENT_ID", "Google_Client_ID");
const getGoogleClientSecret = () => getEnv("GOOGLE_CLIENT_SECRET", "Google_Client_Secret");

/**
 * Callback URL for Google Cloud Console.
 * Uses the active API host (local vs live) and preserves the path from
 * GOOGLE_CALLBACK_URL / Google_Redirect_URI when provided.
 */
const getGoogleCallbackUrl = () => {
  const fromEnv = getEnv("GOOGLE_CALLBACK_URL", "Google_Redirect_URI", "GOOGLE_REDIRECT_URI");
  let path = "/api/v1/auth/google/callback";

  if (fromEnv) {
    try {
      path = new URL(fromEnv).pathname || path;
    } catch {
      if (fromEnv.startsWith("/")) path = fromEnv;
    }
  }

  return `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
};

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
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
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
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

export {
  trimTrailingSlash,
  getEnv,
  getMongoUrl,
  getJwtSecret,
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleCallbackUrl,
  isRailway,
  isProduction,
  getRailwayPublicUrl,
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
