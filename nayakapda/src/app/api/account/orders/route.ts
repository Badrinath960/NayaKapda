import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/account/orders - return user's orders with items
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' }, data: null }, { status: 401 });
  }

  const userId = (session.user as any)?.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
        },
      },
      address: true,
      shippingMethod: { select: { name: true, etaText: true } },
      discountCode: { select: { code: true, type: true, value: true } },
    },
  });

  const mapped = orders.map((o) => ({
    id: o.id,
    status: o.status,
    paymentMode: o.paymentMode,
    subtotal: Number(o.subtotal),
    discountAmount: Number(o.discountAmount),
    shippingCost: Number(o.shippingCost),
    totalAmount: Number(o.totalAmount),
    trackingNumber: o.trackingNumber,
    courierName: o.courierName,
    createdAt: o.createdAt,
    itemCount: o.items.reduce((s, i) => s + i.qty, 0),
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.variant.product.name,
      productSlug: i.variant.product.slug,
      size: i.variant.size,
      color: i.variant.color,
      qty: i.qty,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
    })),
    address: o.address,
    shippingMethod: o.shippingMethod,
    discountCode: o.discountCode
      ? { code: o.discountCode.code, type: o.discountCode.type, value: Number(o.discountCode.value) }
      : null,
  }));

  return NextResponse.json({ success: true, data: mapped });
}
