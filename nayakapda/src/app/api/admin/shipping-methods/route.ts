import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { z } from 'zod';

const shippingMethodSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  etaText: z.string().optional(),
  cost: z.number().nonnegative(),
  regionLimited: z.boolean().default(false),
  active: z.boolean().default(true),
});

// GET /api/admin/shipping-methods
export const GET = withAdminAuth(async (request: NextRequest) => {
  const methods = await prisma.shippingMethod.findMany({
    orderBy: { cost: 'asc' },
  });
  return NextResponse.json({
    success: true,
    data: methods.map((m) => ({ ...m, cost: Number(m.cost) })),
  });
});

// POST /api/admin/shipping-methods
export const POST = withAdminAuth(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = shippingMethodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });
  }

  const method = await prisma.shippingMethod.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      etaText: parsed.data.etaText || "",
      cost: parsed.data.cost,
      regionLimited: parsed.data.regionLimited,
      active: parsed.data.active,
    },
  });

  return NextResponse.json({ success: true, data: { ...method, cost: Number(method.cost) } }, { status: 201 });
});
