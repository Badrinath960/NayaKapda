import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { discountValidateSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler, checkRateLimit, getClientIP } from '@/lib/middleware';
import { computeDiscount } from '@/lib/pricing';

// POST /api/discount/validate
export const POST = withErrorHandler(async (request: NextRequest) => {
  const ip = getClientIP(request);
  if (!checkRateLimit(ip, 20, 60000)) {
    return NextResponse.json({ error: 'RATE_LIMITED', message: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json();
  const validation = validateRequest(discountValidateSchema, body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { code, cartTotal, totalQty } = validation.data;

  const discount = await prisma.discountCode.findUnique({
    where: { code: code.toLowerCase() },
  });

  if (!discount || !discount.active) {
    return NextResponse.json({ data: { valid: false, message: 'Invalid or expired discount code' } });
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return NextResponse.json({ data: { valid: false, message: 'This discount code has expired' } });
  }

  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return NextResponse.json({ data: { valid: false, message: 'This discount code has been fully used' } });
  }

  if (discount.minOrderQty !== null && totalQty < discount.minOrderQty) {
    return NextResponse.json({
      data: {
        valid: false,
        message: `Minimum ${discount.minOrderQty} pieces required for this code`,
      },
    });
  }

  const discountAmount = computeDiscount(
    discount.type as 'PERCENT' | 'FLAT',
    Number(discount.value),
    cartTotal
  );

  return NextResponse.json({
    data: {
      valid: true,
      discountCodeId: discount.id,
      type: discount.type,
      value: Number(discount.value),
      discountAmount,
      message: discount.type === 'PERCENT'
        ? `${discount.value}% off applied`
        : `₹${discount.value} off applied`,
    },
  });
});
