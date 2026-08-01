import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shippingCalculateSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler } from '@/lib/middleware';

// POST /api/shipping/calculate
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateRequest(shippingCalculateSchema, body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { pincode, totalPieces } = validation.data;

  const allMethods = await prisma.shippingMethod.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  const available = allMethods.filter((method) => {
    if (!method.regionLimited) return true;
    return method.regionPincodes.some((prefix) => pincode.startsWith(prefix));
  });

  return NextResponse.json({
    success: true,
    data: {
      methods: available.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        etaText: m.etaText,
        cost: Number(m.cost),
      })),
      pincode,
      totalPieces,
    },
  });
});
