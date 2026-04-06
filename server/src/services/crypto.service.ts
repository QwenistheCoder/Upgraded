import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits (recommended for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits

// Derive a key from ENCRYPTION_KEY (or JWT_SECRET fallback) for encryption
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? "dev-secret-change-me";
  // Use SHA-256 to derive a fixed-length key from the secret
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns a hex string in the format: iv:authTag:ciphertext
 * GCM provides both confidentiality AND integrity (authenticated encryption).
 */
export function encrypt(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from("raisk-auth")); // Additional authenticated data
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string in the format: iv:authTag:ciphertext
 * GCM authentication check is automatic — throws on tampering.
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();
  const parts = encryptedText.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from("raisk-auth"));
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
