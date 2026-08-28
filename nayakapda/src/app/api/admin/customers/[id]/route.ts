import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth, withCustomerAuth } from '@/lib/middleware';
import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { recordAuditLog } from '@/lib/audit';

// GET /api/admin/customers/[id]
export const GET = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const customer = await prisma.user.findUnique({
    where: { id, role: 'CUSTOMER' },
    include: {
      creditLine: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } },
      orders: { orderBy: { createdAt: 'desc' }, include: { _count: { select: { items: true } } } },
    },
  });
  if (!customer) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: customer });
});

// PATCH /api/admin/customers/[id] — update credit limit (SUPER_ADMIN only)
export const PATCH = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, admin) => {
  const { id } = await context.params;
  const body = await request.json();
  const schema = z.object({ limitAmount: z.number().min(0) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });

  const creditLine = await prisma.creditLine.findUnique({ where: { userId: id } });
  if (!creditLine) return NextResponse.json({ success: false, message: 'No credit line' }, { status: 404 });

  await recordAuditLog({
    adminId: admin.adminId,
    action: AuditAction.UPDATE,
    entity: 'CreditLine',
    entityId: creditLine.id,
    before: { limitAmount: Number(creditLine.limitAmount) },
    after: { limitAmount: parsed.data.limitAmount },
  });

  const updated = await prisma.creditLine.update({
    where: { userId: id },
    data: { limitAmount: parsed.data.limitAmount },
  });
  return NextResponse.json({ success: true, data: updated });
}, 'SUPER_ADMIN');
