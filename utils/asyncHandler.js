/**
 * Wraps an async route/controller function so rejected promises
 * are forwarded to Express's error-handling middleware instead of
 * requiring a try/catch block in every controller.
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

export default asyncHandler;
