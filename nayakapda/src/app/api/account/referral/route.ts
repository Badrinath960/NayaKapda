import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCustomerAuth } from '@/lib/middleware';
import { generateReferralCode } from '@/lib/utils';

// GET /api/account/referral
export const GET = withCustomerAuth(async (_req: NextRequest, _ctx: any, session) => {
  let referral = await prisma.referral.findUnique({ where: { userId: session.userId } });

  if (!referral) {
    const code = generateReferralCode(session.userId);
    referral = await prisma.referral.create({
      data: { userId: session.userId, code, earningsTotal: 0, commissionRate: 5 },
    });
  }

  const earnings = await prisma.referralEarning.findMany({
    where: { referralId: referral.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    data: {
      code: referral.code,
      link: `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/?ref=${referral.code}`,
      earningsTotal: Number(referral.earningsTotal),
      commissionRate: Number(referral.commissionRate),
      earnings: earnings.map((e) => ({ orderId: e.orderId, amount: Number(e.amount), paid: e.paid, createdAt: e.createdAt })),
    },
  });
});
