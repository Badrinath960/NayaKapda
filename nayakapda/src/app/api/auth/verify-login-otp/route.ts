import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginVerifyOtpSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler, checkRateLimit, getClientIP } from '@/lib/middleware';
import { verifyOtpRecord } from '@/lib/otp';
import {
  verifyDeviceChallengeToken,
  registerTrustedDevice,
  createVerifiedLoginToken,
} from '@/lib/device';

// POST /api/auth/verify-login-otp
export const POST = withErrorHandler(async (request: NextRequest) => {
  const clientIp = getClientIP(request);
  if (!checkRateLimit(`verify_login_otp:${clientIp}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many verification attempts. Please wait a few minutes.',
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const validation = validateRequest(loginVerifyOtpSchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { phone, otp, challengeToken, deviceHash, deviceName } = validation.data;

  // 1. Verify Challenge Token
  const tokenVerification = verifyDeviceChallengeToken(challengeToken);
  if (!tokenVerification.valid || !tokenVerification.payload) {
    return NextResponse.json(
      {
        error: 'INVALID_CHALLENGE',
        message: tokenVerification.error || 'Login session has expired. Please sign in again.',
      },
      { status: 400 }
    );
  }

  const { userId, phone: tokenPhone, deviceHash: tokenDeviceHash } =
    tokenVerification.payload;

  if (tokenPhone !== phone) {
    return NextResponse.json(
      { error: 'MISMATCH', message: 'Phone number mismatch with session.' },
      { status: 400 }
    );
  }

  // 2. Verify OTP
  const otpResult = await verifyOtpRecord({ phone, purpose: 'LOGIN_2FA', otp });
  if (!otpResult.valid) {
    return NextResponse.json(
      {
        error: otpResult.reason,
        message: otpResult.message || 'Invalid or expired OTP',
        remainingAttempts: otpResult.remainingAttempts,
      },
      { status: 400 }
    );
  }

  // 3. Register this new device as a TrustedDevice for future logins
  const effectiveDeviceHash = deviceHash || tokenDeviceHash || 'default-browser';
  await registerTrustedDevice({
    userId,
    deviceHash: effectiveDeviceHash,
    deviceName: deviceName || 'Web Browser',
    ipAddress: clientIp,
  });

  // 4. Delete 2FA OTPs for this phone
  await prisma.otpVerification
    .deleteMany({
      where: { phone, purpose: 'LOGIN_2FA' },
    })
    .catch(() => {});

  // 5. Create short-lived verified login token for NextAuth
  const verifiedToken = createVerifiedLoginToken({
    userId,
    phone,
    deviceHash: effectiveDeviceHash,
  });

  return NextResponse.json({
    success: true,
    verifiedToken,
    message: 'Device verified and trusted successfully.',
  });
});
