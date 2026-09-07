import crypto from "crypto";
import User from "../models/user.model.js";
import logger from "./logger.js";

export const PASSWORD_OTP_TTL_MS = 60 * 1000;
export const PASSWORD_TICKET_TTL_MS = 5 * 60 * 1000;
export const PASSWORD_RESET_SELECT = "+passwordResetToken +passwordResetExpires +passwordResetKind";

export const hashResetSecret = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

export const clearPasswordReset = async (userId) => {
  await User.updateOne(
    { _id: userId },
    { $unset: { passwordResetToken: 1, passwordResetExpires: 1, passwordResetKind: 1 } }
  );
};

export const purgeExpiredPasswordResets = async () => {
  const result = await User.updateMany(
    { passwordResetExpires: { $lte: new Date() } },
    { $unset: { passwordResetToken: 1, passwordResetExpires: 1, passwordResetKind: 1 } }
  );
  if (result.modifiedCount > 0) {
    logger.info(`Purged ${result.modifiedCount} expired password reset OTP(s) from the database.`);
  }
};
