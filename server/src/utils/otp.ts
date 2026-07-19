import crypto from 'crypto';
import { getRedis } from '../config/redis';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Generate a cryptographically secure numeric OTP.
 */
export function generateOTP(): string {
  const bytes = crypto.randomBytes(3);
  const num = bytes.readUIntBE(0, 3);
  return String(num % 1000000).padStart(OTP_LENGTH, '0');
}

/**
 * Store OTP in Redis with an expiry.
 * Key format: otp:{email}:{type}
 */
export async function storeOTP(
  email: string,
  type: 'email_verification' | 'password_reset',
  otp: string
): Promise<void> {
  try {
    const redis = getRedis();
    const key = `otp:${email.toLowerCase()}:${type}`;
    await redis.setEx(key, OTP_EXPIRY_SECONDS, otp);
  } catch {
    // Redis might not be available — fall back silently
    console.warn('⚠️  OTP storage unavailable (Redis disconnected)');
  }
}

/**
 * Verify an OTP and delete it if valid (one-time use).
 */
export async function verifyOTP(
  email: string,
  type: 'email_verification' | 'password_reset',
  otp: string
): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `otp:${email.toLowerCase()}:${type}`;
    const storedOTP = await redis.get(key);

    if (!storedOTP || storedOTP !== otp) {
      return false;
    }

    // Delete OTP after successful verification (one-time use)
    await redis.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Invalidate all OTPs for a given email and type.
 */
export async function clearOTP(
  email: string,
  type: 'email_verification' | 'password_reset'
): Promise<void> {
  try {
    const redis = getRedis();
    const key = `otp:${email.toLowerCase()}:${type}`;
    await redis.del(key);
  } catch {
    // Silently fail
  }
}
