import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler, checkRateLimit, getClientIP } from '@/lib/middleware';
import { verifyOtpRecord } from '@/lib/otp';

// POST /api/auth/reset-password
export const POST = withErrorHandler(async (request: NextRequest) => {
  const clientIp = getClientIP(request);
  if (!checkRateLimit(`reset_pwd:${clientIp}`, 10, 10 * 60 * 1000)) { // 10 requests per 10 min window
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many password reset attempts. Please wait a few minutes before trying again.',
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const validation = validateRequest(resetPasswordSchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { phone, otp, newPassword } = validation.data;

  // 1. Verify user exists and is active
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

  // 2. Verify OTP
  const otpResult = await verifyOtpRecord({ phone, purpose: 'RESET_PASSWORD', otp });
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

  // 3. Hash new password and update user record
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // 4. Delete verified OTP records for this phone
  await prisma.otpVerification
    .deleteMany({
      where: { phone, purpose: 'RESET_PASSWORD' },
    })
    .catch(() => {});

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully. Please sign in with your new password.',
  });
});
