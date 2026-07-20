import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Candidate secrets for encrypt/decrypt.
 * Tries ENCRYPTION_KEY first, then JWT_SECRET — tokens may have been
 * encrypted with whichever was available at connect time.
 */
const resolveSecrets = () => {
  const secrets = [process.env.ENCRYPTION_KEY, process.env.JWT_SECRET]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  return [...new Set(secrets)];
};

const keyFromSecret = (secret) => crypto.createHash("sha256").update(secret, "utf8").digest();

/** True when token encryption can run (ENCRYPTION_KEY or JWT_SECRET is present). */
export const isEncryptionConfigured = () => resolveSecrets().length > 0;

/** Encrypts a string (e.g. an OAuth access token) for safe storage in MongoDB. */
export const encrypt = (text) => {
  const secrets = resolveSecrets();
  if (!secrets.length) {
    throw new Error(
      "ENCRYPTION_KEY or JWT_SECRET must be set in environment variables (Railway → Variables) before connecting social accounts."
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyFromSecret(secrets[0]), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

const decryptWithSecret = (payload, secret) => {
  const [ivHex, encryptedHex] = String(payload).split(":");
  if (!ivHex || !encryptedHex) throw new Error("Invalid encrypted payload format.");

  const iv = Buffer.from(ivHex, "hex");
  if (iv.length !== IV_LENGTH) throw new Error("Invalid IV length.");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyFromSecret(secret), iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

/**
 * Decrypts a string previously produced by `encrypt()`.
 * Tries every available secret so scheduled publish does not fail when
 * ENCRYPTION_KEY / JWT_SECRET differed between connect and publish.
 * Plaintext tokens (legacy / unencrypted) are returned as-is.
 */
export const decrypt = (payload) => {
  const raw = String(payload ?? "").trim();
  if (!raw) throw new Error("Empty token payload.");

  // Legacy plaintext Facebook tokens (no iv:cipher format).
  if (!raw.includes(":")) {
    return raw;
  }

  const secrets = resolveSecrets();
  if (!secrets.length) {
    throw new Error(
      "ENCRYPTION_KEY or JWT_SECRET must be set in environment variables before publishing."
    );
  }

  let lastError;
  for (const secret of secrets) {
    try {
      return decryptWithSecret(raw, secret);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Token decrypt failed.");
};
