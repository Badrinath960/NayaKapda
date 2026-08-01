import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCustomerAuth } from '@/lib/middleware';

// GET /api/account/credit-line
export const GET = withCustomerAuth(async (_req: NextRequest, _ctx: any, session) => {
  const creditLine = await prisma.creditLine.findUnique({
    where: { userId: session.userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!creditLine) {
    return NextResponse.json({ success: true, data: null, message: 'No credit line assigned' });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: creditLine.id,
      limitAmount: Number(creditLine.limitAmount),
      usedAmount: Number(creditLine.usedAmount),
      availableAmount: Number(creditLine.limitAmount) - Number(creditLine.usedAmount),
      transactions: creditLine.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        orderId: t.orderId,
        note: t.note,
        createdAt: t.createdAt,
      })),
    },
  });
});
