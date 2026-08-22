import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const DEVICE_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'nayakapda-device-secret-key-2026-b2b';

export interface DeviceChallengePayload {
  userId: string;
  phone: string;
  deviceHash: string;
  exp: number;
}

export interface VerifiedLoginPayload {
  userId: string;
  phone: string;
  deviceHash: string;
  exp: number;
}

/**
 * Creates a deterministic SHA-256 hash for a client device token and user agent
 */
export function computeDeviceHash(
  clientToken: string,
  userAgent?: string
): string {
  const normalizedUa = (userAgent || '').trim().slice(0, 200);
  return crypto
    .createHmac('sha256', DEVICE_SECRET)
    .update(`${clientToken}:${normalizedUa}`)
    .digest('hex');
}

/**
 * Check if the device is already recognized and trusted for this user
 */
export async function isTrustedDevice(
  userId: string,
  deviceHash: string
): Promise<boolean> {
  if (!userId || !deviceHash) return false;

  try {
    const trusted = await prisma.trustedDevice.findUnique({
      where: {
        userId_deviceHash: {
          userId,
          deviceHash,
        },
      },
    });

    if (trusted) {
      // Update lastUsedAt in background
      prisma.trustedDevice
        .update({
          where: { id: trusted.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});
      return true;
    }
  } catch (err) {
    console.error('[Device] Error checking trusted device:', err);
  }

  return false;
}

/**
 * Register a device as trusted for the specified user
 */
export async function registerTrustedDevice({
  userId,
  deviceHash,
  deviceName,
  ipAddress,
}: {
  userId: string;
  deviceHash: string;
  deviceName?: string;
  ipAddress?: string;
}): Promise<void> {
  if (!userId || !deviceHash) return;

  try {
    await prisma.trustedDevice.upsert({
      where: {
        userId_deviceHash: {
          userId,
          deviceHash,
        },
      },
      create: {
        userId,
        deviceHash,
        deviceName: deviceName || 'Web Browser',
        ipAddress: ipAddress || null,
        lastUsedAt: new Date(),
      },
      update: {
        deviceName: deviceName || undefined,
        ipAddress: ipAddress || undefined,
        lastUsedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('[Device] Failed to register trusted device:', err);
  }
}

/**
 * Create a signed temporary challenge token for 2FA login (10 min expiry)
 */
export function createDeviceChallengeToken({
  userId,
  phone,
  deviceHash,
}: {
  userId: string;
  phone: string;
  deviceHash: string;
}): string {
  const exp = Date.now() + 10 * 60 * 1000; // 10 minutes
  const payload: DeviceChallengePayload = { userId, phone, deviceHash, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', DEVICE_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify a 2FA login challenge token
 */
export function verifyDeviceChallengeToken(
  token: string
): { valid: boolean; payload?: DeviceChallengePayload; error?: string } {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) {
      return { valid: false, error: 'Malformed token' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', DEVICE_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payload: DeviceChallengePayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Challenge token expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid token format' };
  }
}

/**
 * Create a short-lived verified login token after 2FA OTP succeeds (5 min expiry)
 */
export function createVerifiedLoginToken({
  userId,
  phone,
  deviceHash,
}: {
  userId: string;
  phone: string;
  deviceHash: string;
}): string {
  const exp = Date.now() + 5 * 60 * 1000; // 5 minutes
  const payload: VerifiedLoginPayload = { userId, phone, deviceHash, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', DEVICE_SECRET)
    .update(`VERIFIED:${payloadB64}`)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify short-lived verified login token for NextAuth authorize()
 */
export function verifyVerifiedLoginToken(
  token: string
): { valid: boolean; payload?: VerifiedLoginPayload; error?: string } {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) {
      return { valid: false, error: 'Malformed token' };
    }

    const expectedSignature = crypto
      .createHmac('sha256', DEVICE_SECRET)
      .update(`VERIFIED:${payloadB64}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payload: VerifiedLoginPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Verified token expired' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid token format' };
  }
}
