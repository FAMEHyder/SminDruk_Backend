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
    const isDbError = error?.name === "MongooseServerSelectionError" || error?.name === "MongooseError" || String(error?.message).includes("querySrv");
    const statusCode = error.statusCode || (isDbError ? 503 : 500);
    const message = isDbError ? `Database Error: ${error.message}` : (error.message || "Internal server error");
    error = new ApiError(statusCode, message, [], err.stack);
  }

  logger.error(`${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.message}`);

  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    stack: error.stack,
  });
};

export { notFoundHandler, errorHandler };
