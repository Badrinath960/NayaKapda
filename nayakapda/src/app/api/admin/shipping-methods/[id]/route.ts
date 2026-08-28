import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { z } from 'zod';

const updateShippingSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  etaText: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  regionLimited: z.boolean().optional(),
  active: z.boolean().optional(),
});

// PATCH /api/admin/shipping-methods/[id]
export const PATCH = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateShippingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });
  }

  const updated = await prisma.shippingMethod.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: { ...updated, cost: Number(updated.cost) } });
});

// DELETE /api/admin/shipping-methods/[id]
export const DELETE = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  await prisma.shippingMethod.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
