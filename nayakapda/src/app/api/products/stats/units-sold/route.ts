import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products/stats/units-sold
// Sum of OrderItem.qty for Orders in last 30 days with status != CANCELLED
// No auth required
export async function GET(_req: NextRequest) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.orderItem.aggregate({
    _sum: { qty: true },
    where: {
      order: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
    },
  });

  const unitsSold = result._sum.qty ?? 0;

  return NextResponse.json({
    success: true,
    data: { unitsSold, period: '30d' },
  });
}
