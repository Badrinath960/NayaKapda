import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bulkAddSchema, validateRequest } from '@/lib/validation';
import { withCustomerAuth } from '@/lib/middleware';
import { resolvePrice, validateMultiple } from '@/lib/pricing';

// POST /api/cart/bulk-add
export const POST = withCustomerAuth(async (request: NextRequest, _ctx: any, session) => {
  const body = await request.json();
  const validation = validateRequest(bulkAddSchema, body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { rows } = validation.data;
  const errors: string[] = [];

  // Get cart (create if not exists)
  let cart = await prisma.cart.findUnique({ where: { userId: session.userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: session.userId } });
  }

  const addedItems = [];

  for (const row of rows) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: row.variantId },
      include: {
        product: { include: { category: { select: { qtyMultiple: true } } } },
      },
    });

    if (!variant || !variant.active) {
      errors.push(`Variant ${row.variantId} not found or inactive`);
      continue;
    }

    const multiple = variant.product.category.qtyMultiple;
    if (!validateMultiple(row.qty, multiple)) {
      errors.push(`Qty for ${variant.sku} must be a multiple of ${multiple}`);
      continue;
    }

    // Compute unit price based on total qty in this batch
    const totalNewQty = rows.reduce((sum, r) => sum + r.qty, 0);
    const priceResult = await resolvePrice(variant.productId, totalNewQty);

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variantId: row.variantId },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + row.qty, unitPrice: priceResult.unitPrice },
      });
      addedItems.push(updated);
    } else {
      const created = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: row.variantId,
          qty: row.qty,
          unitPrice: priceResult.unitPrice,
        },
      });
      addedItems.push(created);
    }
  }

  const cartItemCount = await prisma.cartItem.count({ where: { cartId: cart.id } });

  return NextResponse.json({
    data: { cartItemCount, addedItems: addedItems.length, errors },
    message: errors.length ? 'Some items had errors' : 'Added to cart',
  });
});
