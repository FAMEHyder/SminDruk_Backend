import ApiError from "../utils/apiError.js";

/**
 * Validates req.body against a Zod schema.
 * Usage: router.post("/register", validate(authValidators.register), authController.register)
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return next(ApiError.badRequest("Validation failed.", errors));
  }

  req.body = result.data;
  next();
};

export default validate;
