import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler } from '@/lib/middleware';
import { sendWelcomeMessage } from '@/lib/whatsapp';

// POST /api/auth/register
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateRequest(registerSchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { phone, password, name, email, referralCode } = validation.data;

  // Check if phone already exists
  const existingByPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingByPhone) {
    return NextResponse.json(
      { error: 'CONFLICT', field: 'phone', message: 'Phone number is already registered' },
      { status: 409 }
    );
  }

  // Check email uniqueness only if provided (Requirement 1.7)
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

  const user = await prisma.user.create({
    data: {
      phone,
      email: email ?? null,
      passwordHash,
      name: name ?? null,
      role: 'CUSTOMER',
    },
  });

  // Create empty cart for user
  await prisma.cart.create({ data: { userId: user.id } });

  // Handle referral code association
  if (referralCode) {
    const referral = await prisma.referral.findUnique({
      where: { code: referralCode.toUpperCase() },
    });
    if (referral) {
      // Store referral code on user's first order (tracked via Order.referralCode)
      // We store it in a cookie or pass it to the order — handled in checkout flow
      // For now, we note the referralCode on the user via a separate mechanism
    }
  }

  // Send WhatsApp welcome message (non-blocking)
  sendWelcomeMessage(phone, user.id, name ?? undefined).catch(() => {});

  return NextResponse.json(
    {
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      message: 'Account created successfully',
    },
    { status: 201 }
  );
});
