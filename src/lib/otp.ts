import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function generateOtp(): string {
  return crypto
    .randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtp(
  inputOtp: string,
  storedHash: string,
): Promise<{ valid: boolean; reason?: string }> {
  const valid = await bcrypt.compare(inputOtp, storedHash);
  if (!valid) return { valid: false, reason: "Invalid OTP" };
  return { valid: true };
}

export function isOtpExpired(_sentAt: Date, expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function isOtpRateLimited(sentAt: Date): boolean {
  const cooldownEnd = new Date(sentAt.getTime() + RESEND_COOLDOWN_MS);
  return new Date() < cooldownEnd;
}

export function isMaxAttemptsReached(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}

export { OTP_TTL_MS, MAX_ATTEMPTS, RESEND_COOLDOWN_MS };
