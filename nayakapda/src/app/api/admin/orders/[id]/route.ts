import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { updateOrderStatusSchema, validateRequest } from '@/lib/validation';
import { sendDispatchAlert } from '@/lib/whatsapp';

// PATCH /api/admin/orders/[id]
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  admin
) => {
  const { id } = await params;
  const body = await request.json();
  const validation = validateRequest(updateOrderStatusSchema, body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { status, trackingNumber, courierName, cancelReason } = validation.data;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { phone: true, id: true } } },
  });
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: status as any,
      ...(trackingNumber && { trackingNumber }),
      ...(courierName && { courierName }),
      ...(cancelReason && { cancelReason }),
    },
  });

  // Send WhatsApp on dispatch
  if (status === 'DISPATCHED' && order.user.phone && trackingNumber && courierName) {
    sendDispatchAlert(order.user.phone, order.user.id, {
      orderId: id.slice(-8).toUpperCase(),
      trackingNumber,
      courierName,
    }).catch(() => {});
  }

  return NextResponse.json({ data: updated });
});

// GET /api/admin/orders/[id]
export const GET = withAdminAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      address: true,
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true, slug: true } } },
          },
        },
      },
      discountCode: true,
      shippingMethod: true,
    },
  });
  if (!order) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ data: order });
});
