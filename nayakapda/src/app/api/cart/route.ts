import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCustomerAuth } from '@/lib/middleware';

// GET /api/cart
export const GET = withCustomerAuth(async (_req: NextRequest, _ctx: any, session) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  category: { select: { qtyMultiple: true } },
                  photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!cart) {
    return NextResponse.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } });
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    qty: item.qty,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.unitPrice) * item.qty,
    variant: {
      id: item.variant.id,
      size: item.variant.size,
      color: item.variant.color,
      sku: item.variant.sku,
      stockQty: item.variant.stockQty,
      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        slug: item.variant.product.slug,
        photo: item.variant.product.photos[0] ?? null,
        qtyMultiple: item.variant.product.category.qtyMultiple,
      },
    },
  }));

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  return NextResponse.json({ success: true, data: { items, subtotal, itemCount } });
});
