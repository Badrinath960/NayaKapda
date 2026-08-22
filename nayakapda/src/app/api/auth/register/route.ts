import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler, getClientIP } from '@/lib/middleware';
import { sendWelcomeMessage } from '@/lib/whatsapp';
import { verifyOtpRecord } from '@/lib/otp';
import { registerTrustedDevice } from '@/lib/device';

// POST /api/auth/register
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateRequest(registerSchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { phone, password, name, email, referralCode, otp, deviceHash, deviceName } =
    validation.data;

  // 1. Mandatory OTP Verification before account creation
  if (!otp) {
    // Check if an OTP was recently verified in DB
    const recentVerifiedOtp = await prisma.otpVerification.findFirst({
      where: {
        phone,
        purpose: 'REGISTER',
        verified: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const isRecentlyVerified =
      recentVerifiedOtp &&
      Date.now() - recentVerifiedOtp.updatedAt.getTime() < 15 * 60 * 1000;

    if (!isRecentlyVerified) {
      return NextResponse.json(
        {
          error: 'OTP_REQUIRED',
          message: 'Mobile number OTP verification is required to create an account.',
        },
        { status: 400 }
      );
    }
  } else {
    // Verify user-provided OTP
    const otpResult = await verifyOtpRecord({ phone, purpose: 'REGISTER', otp });
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
  }

  // 2. Check if phone is already registered
  const existingByPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingByPhone) {
    return NextResponse.json(
      { error: 'CONFLICT', field: 'phone', message: 'Phone number is already registered' },
      { status: 409 }
    );
  }

  // 3. Check email uniqueness only if provided
  if (email) {
    const existingByEmail = await prisma.user.findFirst({ where: { email } });
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'CONFLICT', field: 'email', message: 'Email address is already in use' },
        { status: 409 }
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // 4. Create User in Database
  const user = await prisma.user.create({
    data: {
      phone,
      email: email ?? null,
      passwordHash,
      name: name ?? null,
      role: 'CUSTOMER',
    },
  });

  // 5. Create empty Cart for user
  await prisma.cart.create({ data: { userId: user.id } });

  // 6. Automatically register current device as Trusted Device upon registration
  if (deviceHash) {
    const clientIp = getClientIP(request);
    await registerTrustedDevice({
      userId: user.id,
      deviceHash,
      deviceName: deviceName || 'Web Browser',
      ipAddress: clientIp,
    });
  }

  // 7. Cleanup verified OTPs for this phone
  await prisma.otpVerification
    .deleteMany({
      where: { phone, purpose: 'REGISTER' },
    })
    .catch(() => {});

  // 8. Handle referral code
  if (referralCode) {
    const referral = await prisma.referral.findUnique({
      where: { code: referralCode.toUpperCase() },
    });
    if (referral) {
      // Linked to user's first order during checkout
    }
  }

  // 9. Send WhatsApp welcome message (non-blocking)
  sendWelcomeMessage(phone, user.id, name ?? undefined).catch(() => {});

  return NextResponse.json(
    {
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      message: 'Account created and verified successfully',
    },
    { status: 201 }
  );
});
