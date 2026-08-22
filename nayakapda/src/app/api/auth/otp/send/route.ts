import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { otpSendSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler, checkRateLimit, getClientIP } from '@/lib/middleware';
import { createOtpRecord } from '@/lib/otp';

// POST /api/auth/otp/send
export const POST = withErrorHandler(async (request: NextRequest) => {
  const clientIp = getClientIP(request);
  if (!checkRateLimit(`otp_send:${clientIp}`, 10, 10 * 60 * 1000)) { // 10 requests per 10 min window
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many OTP requests. Please wait a few minutes before trying again.',
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const validation = validateRequest(otpSendSchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { phone, purpose } = validation.data;

  // Purpose-specific pre-checks
  if (purpose === 'REGISTER') {
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return NextResponse.json(
        {
          error: 'CONFLICT',
          field: 'phone',
          message: 'Phone number is already registered. Please sign in instead.',
        },
        { status: 409 }
      );
    }
  } else if (purpose === 'LOGIN_2FA') {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.active) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'No active account found with this phone number.',
        },
        { status: 404 }
      );
    }
  }

  const result = await createOtpRecord({ phone, purpose });

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    expiresAt: result.expiresAt,
    debugOtp: result.debugOtp,
  });
});
