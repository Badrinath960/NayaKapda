import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCustomerAuth } from '@/lib/middleware';

// POST /api/account/credit-line/settle
// { razorpayPaymentId, amount }
export const POST = withCustomerAuth(async (req: NextRequest, _ctx: any, session) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_JSON' }, data: null }, { status: 400 });
  }

  const { razorpayPaymentId, amount } = body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', details: 'Valid amount is required' }, data: null },
      { status: 400 }
    );
  }

  const creditLine = await prisma.creditLine.findUnique({ where: { userId: session.userId } });

  if (!creditLine) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', details: 'No credit line found' }, data: null }, { status: 404 });
  }

  if (amount > Number(creditLine.usedAmount)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', details: 'Amount exceeds outstanding balance' }, data: null },
      { status: 400 }
    );
  }

  // Record settlement transaction and reduce usedAmount
  const [transaction, updatedLine] = await prisma.$transaction([
    prisma.creditTransaction.create({
      data: {
        creditLineId: creditLine.id,
        type: 'SETTLEMENT',
        amount,
        razorpayPaymentId: razorpayPaymentId ?? null,
        note: razorpayPaymentId ? `Razorpay settlement: ${razorpayPaymentId}` : 'Manual settlement',
      },
    }),
    prisma.creditLine.update({
      where: { id: creditLine.id },
      data: { usedAmount: { decrement: amount } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      transactionId: transaction.id,
      newUsedAmount: Number(updatedLine.usedAmount),
      newAvailableAmount: Number(updatedLine.limitAmount) - Number(updatedLine.usedAmount),
    },
    message: 'Settlement recorded successfully',
  });
});
