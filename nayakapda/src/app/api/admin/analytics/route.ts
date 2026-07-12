import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';

// GET /api/admin/analytics?from=&to=&groupBy=day|week|month
export const GET = withAdminAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date();

  const [totalOrders, totalRevenue, topProducts, discountReport] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } } }),

    prisma.order.aggregate({
      where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),

    prisma.orderItem.groupBy({
      by: ['variantId'],
      where: { order: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } } },
      _sum: { qty: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    }),

    prisma.discountCode.findMany({
      select: { code: true, type: true, value: true, usedCount: true },
      orderBy: { usedCount: 'desc' },
      take: 10,
    }),
  ]);

  const totalRevenueAmount = Number(totalRevenue._sum.totalAmount ?? 0);

  return NextResponse.json({
    data: {
      period: { from, to },
      summary: {
        totalOrders,
        totalRevenue: totalRevenueAmount,
        avgOrderValue: totalOrders > 0 ? totalRevenueAmount / totalOrders : 0,
      },
      topProducts: topProducts.map((p) => ({
        variantId: p.variantId,
        totalQty: p._sum.qty ?? 0,
        totalRevenue: Number(p._sum.subtotal ?? 0),
      })),
      discountReport: discountReport.map((d) => ({ ...d, value: Number(d.value) })),
    },
  });
}, 'SUPER_ADMIN');
