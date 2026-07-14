import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Derives a stable 32-byte key from ENCRYPTION_KEY (any length string),
 * so users can set a plain passphrase instead of having to generate raw
 * key bytes themselves.
 */
const getKey = () => {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not set. Add it to your .env before connecting social accounts.");
  }
  return crypto.createHash("sha256").update(secret).digest();
};

/** Encrypts a string (e.g. an OAuth access token) for safe storage in MongoDB. */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

/** Decrypts a string previously produced by `encrypt()`. */
const decrypt = (payload) => {
  const [ivHex, encryptedHex] = String(payload).split(":");
  if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted payload format.");

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
};

export { encrypt, decrypt };
