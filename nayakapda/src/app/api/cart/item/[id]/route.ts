import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCustomerAuth } from '@/lib/middleware';
import { z } from 'zod';

// PATCH /api/cart/item/[id]  — update quantity
// DELETE /api/cart/item/[id] — remove item
export const PATCH = withCustomerAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await params;
  const body = await request.json();
  const parsed = z.object({ qty: z.number().int().positive() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 422 });
  }

  const item = await prisma.cartItem.findFirst({
    where: { id, cart: { userId: session.userId } },
    include: { variant: { include: { product: { include: { category: true } } } } },
  });

  if (!item) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const multiple = item.variant.product.category.qtyMultiple;
  if (parsed.data.qty % multiple !== 0) {
    return NextResponse.json({ error: `Quantity must be a multiple of ${multiple}` }, { status: 422 });
  }

  const updated = await prisma.cartItem.update({
    where: { id },
    data: { qty: parsed.data.qty },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withCustomerAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  const { id } = await params;

  const item = await prisma.cartItem.findFirst({
    where: { id, cart: { userId: session.userId } },
  });

  if (!item) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  await prisma.cartItem.delete({ where: { id } });
  return NextResponse.json({ message: 'Item removed' });
});
