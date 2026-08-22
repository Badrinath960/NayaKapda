import { NextRequest, NextResponse } from 'next/server';
import { otpVerifySchema, validateRequest } from '@/lib/validation';
import { withErrorHandler, checkRateLimit, getClientIP } from '@/lib/middleware';
import { verifyOtpRecord } from '@/lib/otp';

// POST /api/auth/otp/verify
export const POST = withErrorHandler(async (request: NextRequest) => {
  const clientIp = getClientIP(request);
  if (!checkRateLimit(`otp_verify:${clientIp}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many verification attempts. Please wait before trying again.',
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const validation = validateRequest(otpVerifySchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { phone, purpose, otp } = validation.data;

  const result = await verifyOtpRecord({ phone, purpose, otp });

  if (!result.valid) {
    return NextResponse.json(
      {
        error: result.reason,
        message: result.message,
        remainingAttempts: result.remainingAttempts,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'OTP verified successfully',
  });
});
