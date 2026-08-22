import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { sendOtpEmail } from '@/lib/email';
import { sendSmsOtp } from '@/lib/sms';

export type OtpPurpose = 'REGISTER' | 'LOGIN_2FA';

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

const OTP_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'nayakapda-otp-secret-key-2026-b2b';

/**
 * Hash OTP with HMAC-SHA256 to ensure no plain-text OTPs exist in DB
 */
export function hashOtp(phone: string, otp: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${phone}:${otp}`)
    .digest('hex');
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Creates and records a new OTP in the database, applying rate limiting and cooldown
 */
export async function createOtpRecord({
  phone,
  purpose,
  email,
}: {
  phone: string;
  purpose: OtpPurpose;
  email?: string | null;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  retryAfterSeconds?: number;
  expiresAt?: Date;
  debugOtp?: string;
  gatewayConfigured?: boolean;
}> {
  const now = new Date();

  // Check for recent unverified OTP to enforce 60s cooldown
  const recentOtp = await prisma.otpVerification.findFirst({
    where: {
      phone,
      purpose,
      verified: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOtp) {
    const elapsedSeconds = Math.floor(
      (now.getTime() - recentOtp.createdAt.getTime()) / 1000
    );
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        error: 'COOLDOWN',
        message: `Please wait ${waitSeconds}s before requesting a new OTP`,
        retryAfterSeconds: waitSeconds,
      };
    }
  }

  // Generate 6-digit OTP and calculate expiry
  const rawOtp = generateSecureOtp();
  const otpHash = hashOtp(phone, rawOtp);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any older unverified OTPs for this phone + purpose
  await prisma.otpVerification.deleteMany({
    where: {
      phone,
      purpose,
      verified: false,
    },
  });

  // Create new OTP record
  await prisma.otpVerification.create({
    data: {
      phone,
      purpose,
      otpHash,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt,
      verified: false,
    },
  });

  // Send OTP notification via WhatsApp and/or Email
  await sendOtpNotification(phone, rawOtp, purpose, email ?? undefined);

  const isWhatsAppSet = Boolean(
    process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
  const isDev = process.env.NODE_ENV !== 'production';

  // Provide debugOtp if in dev OR if WhatsApp gateway credentials are not yet configured
  const showDebugOtp = isDev || !isWhatsAppSet;

  return {
    success: true,
    message: isWhatsAppSet
      ? `OTP sent successfully to +91 ${phone}`
      : email
      ? `OTP sent to ${email} (WhatsApp gateway unconfigured)`
      : `OTP generated for +91 ${phone}`,
    expiresAt,
    debugOtp: showDebugOtp ? rawOtp : undefined,
    gatewayConfigured: isWhatsAppSet,
  };
}

/**
 * Verifies the user-entered OTP against the stored record
 */
export async function verifyOtpRecord({
  phone,
  purpose,
  otp,
}: {
  phone: string;
  purpose: OtpPurpose;
  otp: string;
}): Promise<{
  valid: boolean;
  reason?: 'EXPIRED_OR_NOT_FOUND' | 'MAX_ATTEMPTS_EXCEEDED' | 'INVALID_OTP';
  message?: string;
  remainingAttempts?: number;
}> {
  const now = new Date();

  // Find latest active OTP record
  const record = await prisma.otpVerification.findFirst({
    where: {
      phone,
      purpose,
      verified: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record || record.expiresAt < now) {
    return {
      valid: false,
      reason: 'EXPIRED_OR_NOT_FOUND',
      message: 'OTP has expired or does not exist. Please request a new one.',
    };
  }

  if (record.attempts >= record.maxAttempts) {
    return {
      valid: false,
      reason: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Too many incorrect attempts. Please request a new OTP.',
    };
  }

  const expectedHash = hashOtp(phone, otp.trim());
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(record.otpHash, 'hex')
  );

  if (!isMatch) {
    const updatedAttempts = record.attempts + 1;
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: updatedAttempts },
    });

    const remaining = record.maxAttempts - updatedAttempts;
    return {
      valid: false,
      reason: 'INVALID_OTP',
      message:
        remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new OTP.',
      remainingAttempts: remaining > 0 ? remaining : 0,
    };
  }

  // Mark OTP as verified
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { verified: true },
  });

  return {
    valid: true,
  };
}

/**
 * Dispatch OTP via WhatsApp Business API, Resend Email, and console logger
 */
export async function sendOtpNotification(
  phone: string,
  otp: string,
  purpose: OtpPurpose,
  email?: string
): Promise<void> {
  const purposeText =
    purpose === 'REGISTER'
      ? 'account verification'
      : 'device login verification (2FA)';

  const bodyText = `Your NayaKapda ${purposeText} OTP is *${otp}*.\n\nThis OTP is valid for 10 minutes. Do not share this OTP with anyone.\n\n— Team NayaKapda.com`;

  console.log(`\n========================================`);
  console.log(`🔐 [OTP DISPATCH] Phone: +91 ${phone} | Purpose: ${purpose}${email ? ` | Email: ${email}` : ''}`);
  console.log(`👉 OTP CODE: [ ${otp} ] (Valid 10 mins)`);
  console.log(`========================================\n`);

  // 1. WhatsApp Business API Dispatch
  try {
    await sendWhatsAppMessage({
      templateName: purpose === 'REGISTER' ? 'welcome' : 'order_confirmation',
      phone,
      eventType: `OTP_${purpose}`,
      params: {
        body: bodyText,
        otp,
      },
    });
  } catch (err) {
    console.warn(`[OTP] WhatsApp delivery failed or skipped:`, err);
  }

  // 2. Email Dispatch via Resend (if email is provided)
  if (email) {
    try {
      await sendOtpEmail({ to: email, otp, phone, purpose });
    } catch (err) {
      console.warn(`[OTP] Email delivery failed:`, err);
    }
  }

  // 3. SMS Dispatch via Fast2SMS / 2Factor (if configured)
  try {
    await sendSmsOtp({ phone, otp });
  } catch (err) {
    console.warn(`[OTP] SMS delivery failed or skipped:`, err);
  }
}
