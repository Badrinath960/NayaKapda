import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreditTransactionType, OrderStatus, PaymentMode } from '@prisma/client';
import { placeOrderSchema, validateRequest } from '@/lib/validation';
import { withCustomerAuth, checkRateLimit, getClientIP } from '@/lib/middleware';
import { computeOrderTotal, computeDiscount } from '@/lib/pricing';
import { sendOrderConfirmation } from '@/lib/whatsapp';

// POST /api/orders — place order
export const POST = withCustomerAuth(async (request: NextRequest, _ctx: any, session) => {
  const ip = getClientIP(request);
  if (!checkRateLimit(ip, 5, 60000)) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await request.json();
  const validation = validateRequest(placeOrderSchema, body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { addressId, shippingMethodId, paymentMode, discountCodeId, razorpayPaymentId } = validation.data;

  // Verify address belongs to user
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.userId },
  });
  if (!address) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }

  // Get shipping method
  let shippingCost = 0;
  if (shippingMethodId) {
    const method = await prisma.shippingMethod.findUnique({ where: { id: shippingMethodId } });
    shippingCost = method ? Number(method.cost) : 0;
  }

  // Get cart items
  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const cartItems = cart.items.map((i) => ({ qty: i.qty, unitPrice: Number(i.unitPrice) }));

  // Get discount
  let discountAmount = 0;
  if (discountCodeId) {
    const dc = await prisma.discountCode.findUnique({ where: { id: discountCodeId } });
    if (dc && dc.active) {
      const subtotal = cartItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      discountAmount = computeDiscount(dc.type as 'PERCENT' | 'FLAT', Number(dc.value), subtotal);
    }
  }

  // Server-side total computation (Property 4 — never trust client)
  const totals = computeOrderTotal(cartItems, discountAmount, shippingCost);

  // Credit check
  if (paymentMode === 'CREDIT') {
    const creditLine = await prisma.creditLine.findUnique({ where: { userId: session.userId } });
    if (!creditLine) {
      return NextResponse.json({ error: 'No credit line available' }, { status: 400 });
    }
    const available = Number(creditLine.limitAmount) - Number(creditLine.usedAmount);
    if (totals.totalAmount > available) {
      return NextResponse.json({ error: 'Insufficient credit limit' }, { status: 400 });
    }
  }

  if (paymentMode === 'PREPAID' && !razorpayPaymentId) {
    return NextResponse.json({ error: 'Payment ID required for prepaid orders' }, { status: 400 });
  }

  // Create order in transaction
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true, name: true } });

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: session.userId,
        addressId,
        shippingMethodId: shippingMethodId ?? undefined,
        discountCodeId: discountCodeId ?? undefined,
        status: OrderStatus.PLACED,
        paymentMode: paymentMode as PaymentMode,
        razorpayPaymentId: razorpayPaymentId ?? undefined,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingCost: totals.shippingCost,
        totalAmount: totals.totalAmount,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            subtotal: Number(item.unitPrice) * item.qty,
          })),
        },
      },
    });

    // Decrement stock
    for (const item of cart.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQty: { decrement: item.qty } },
      });
    }

    // Update credit line
    if (paymentMode === 'CREDIT') {
      await tx.creditLine.update({
        where: { userId: session.userId },
        data: { usedAmount: { increment: totals.totalAmount } },
      });
      await tx.creditTransaction.create({
        data: {
          creditLine: { connect: { userId: session.userId } },
          type: CreditTransactionType.CHARGE,
          amount: totals.totalAmount,
          orderId: newOrder.id,
          note: `Order #${newOrder.id}`,
        },
      });
    }

    // Increment discount code usage
    if (discountCodeId) {
      await tx.discountCode.update({
        where: { id: discountCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  // Non-blocking WhatsApp notification
  if (user?.phone) {
    sendOrderConfirmation(user.phone, session.userId, {
      orderId: order.id.slice(-8).toUpperCase(),
      items: `${cart.items.length} item(s)`,
      total: totals.totalAmount.toFixed(2),
      paymentMode,
    }).catch(() => {});
  }

  return NextResponse.json({ data: { orderId: order.id, status: order.status, total: totals.totalAmount } }, { status: 201 });
});

// GET /api/orders — list user's orders
export const GET = withCustomerAuth(async (_req: NextRequest, _ctx: any, session) => {
  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
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
    },
  });

  return NextResponse.json({
    data: orders.map((o) => ({
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
      address: o.address ? {
        name: o.address.name,
        line1: o.address.line1,
        city: o.address.city,
        state: o.address.state,
        pincode: o.address.pincode,
        country: o.address.country,
        phone: o.address.phone,
      } : null,
      items: o.items.map((i) => ({
        id: i.id,
        productName: i.variant.product.name,
        size: i.variant.size,
        color: i.variant.color,
        qty: i.qty,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
    })),
  });
});
