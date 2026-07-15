import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Resolves the encryption secret. Uses ENCRYPTION_KEY first, then falls back to
 * JWT_SECRET so Railway/production still boots when only auth secrets are set.
 * Returns null (instead of crashing) when neither is configured.
 */
const resolveSecret = () => {
  const secret = (process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "").trim();
  return secret || null;
};

/**
 * Derives a stable 32-byte key from the resolved secret string.
 */
const getKey = () => {
  const secret = resolveSecret();
  if (!secret) {
    throw new Error(
      "ENCRYPTION_KEY or JWT_SECRET must be set in environment variables (Railway → Variables) before connecting social accounts."
    );
  }
  return crypto.createHash("sha256").update(secret, "utf8").digest();
};

/** True when token encryption can run (ENCRYPTION_KEY or JWT_SECRET is present). */
export const isEncryptionConfigured = () => Boolean(resolveSecret());

/** Encrypts a string (e.g. an OAuth access token) for safe storage in MongoDB. */
export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

/** Decrypts a string previously produced by `encrypt()`. */
export const decrypt = (payload) => {
  const [ivHex, encryptedHex] = String(payload).split(":");
  if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted payload format.");

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
};
