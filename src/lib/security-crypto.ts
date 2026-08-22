import crypto from "node:crypto";
import { OTP } from "otplib";

const otp = new OTP();

export function createOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createTokenExpiry(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function isTokenExpired(expiresAt: string | Date) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function createTotpSecret() {
  return otp.generateSecret();
}

export function createTotpUri(secret: string, email: string) {
  return otp.generateURI({
    issuer: "Envol Africa",
    label: email,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });
}

export function verifyTotpCode(secret: string, token: string) {
  if (!/^\d{6}$/.test(token)) return false;
  try {
    return Boolean(otp.verifySync({ secret, token, epochTolerance: 1 }));
  } catch {
    return false;
  }
}

function encryptionKey() {
  return crypto.createHash("sha256").update(process.env.JWT_SECRET || "local-only-encryption-key").digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string) {
  try {
    const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function createRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString("hex").toUpperCase());
}

export function hashRecoveryCode(code: string) {
  return hashOpaqueToken(code.trim().toUpperCase());
}

export function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
