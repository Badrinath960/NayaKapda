import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { updateOrderStatusSchema, validateRequest } from '@/lib/validation';
import { sendDispatchAlert } from '@/lib/whatsapp';

// GET /api/admin/orders
export const GET = withAdminAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const paymentMode = searchParams.get('paymentMode');
  const search = searchParams.get('search');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const format = searchParams.get('format');

  const where: any = {};
  if (status) where.status = status;
  if (paymentMode) where.paymentMode = paymentMode;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        address: true,
        items: { include: { variant: { include: { product: { select: { name: true } } } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  if (format === 'csv') {
    const rows = ['Order ID,Customer,Phone,Status,Payment,Total,Date'];
    for (const o of orders) {
      rows.push(`${o.id},${o.user.name ?? ''},${o.user.phone},${o.status},${o.paymentMode},${o.totalAmount},${o.createdAt.toISOString()}`);
    }
    return new NextResponse(rows.join('\n'), {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=orders.csv' },
    });
  }

  return NextResponse.json({ data: { orders, total, page, totalPages: Math.ceil(total / limit) } });
});
