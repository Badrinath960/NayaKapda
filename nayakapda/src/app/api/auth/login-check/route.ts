import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginCheckSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler, checkRateLimit, getClientIP } from '@/lib/middleware';
import { createOtpRecord } from '@/lib/otp';
import { isTrustedDevice, createDeviceChallengeToken } from '@/lib/device';

// POST /api/auth/login-check
export const POST = withErrorHandler(async (request: NextRequest) => {
  const clientIp = getClientIP(request);
  if (!checkRateLimit(`login_check:${clientIp}`, 15, 10 * 60 * 1000)) { // 15 attempts per 10 mins
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many login attempts. Please wait a few minutes.',
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const validation = validateRequest(loginCheckSchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { phone, password, deviceHash, deviceName } = validation.data;

  // 1. Verify User credentials
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user || !user.active || user.role !== 'CUSTOMER') {
    return NextResponse.json(
      {
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid phone number or password. Please try again.',
      },
      { status: 401 }
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json(
      {
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid phone number or password. Please try again.',
      },
      { status: 401 }
    );
  }

  // 2. Check Device Recognition
  const effectiveDeviceHash = deviceHash || 'default-browser';
  const trusted = await isTrustedDevice(user.id, effectiveDeviceHash);

  if (trusted) {
    // Recognized device — allow immediate login without OTP
    return NextResponse.json({
      status: 'TRUSTED',
      requiresOtp: false,
      message: 'Trusted device recognized.',
    });
  }

  // 3. New / Unrecognized Device — trigger 2FA Mobile OTP Challenge
  const otpResult = await createOtpRecord({ phone, purpose: 'LOGIN_2FA' });

  if (!otpResult.success) {
    return NextResponse.json(
      {
        error: otpResult.error,
        message: otpResult.message,
        retryAfterSeconds: otpResult.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const challengeToken = createDeviceChallengeToken({
    userId: user.id,
    phone: user.phone,
    deviceHash: effectiveDeviceHash,
  });

  const phoneMasked = `+91 ${phone.slice(0, 2)}******${phone.slice(-2)}`;

  return NextResponse.json({
    status: 'NEW_DEVICE',
    requiresOtp: true,
    challengeToken,
    phoneMasked,
    message: 'New or unrecognized device detected. Please verify with the 6-digit OTP sent to your phone.',
  });
});
