import ApiError from "../utils/apiError.js";
import logger from "../utils/logger.js";

/** Catches requests to routes that don't exist. */
const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/** Centralized error handler — must be the last middleware registered in app.js. */
const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    error = new ApiError(statusCode, error.message || "Internal server error", [], err.stack);
  }

  logger.error(`${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.message}`);

  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  });
};

export { notFoundHandler, errorHandler };
