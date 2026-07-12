import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { createDiscountCodeSchema, validateRequest } from '@/lib/validation';
import { auditCreate } from '@/lib/audit';
import { AuditAction } from '@prisma/client';

// GET /api/admin/discounts
export const GET = withAdminAuth(async () => {
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ data: codes.map(c => ({ ...c, value: Number(c.value) })) });
});

// POST /api/admin/discounts
export const POST = withAdminAuth(async (request: NextRequest, _ctx: any, admin) => {
  const body = await request.json();
  const validation = validateRequest(createDiscountCodeSchema, body);
  if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 422 });

  const code = await prisma.discountCode.create({ data: validation.data as any });
  await auditCreate(admin.adminId, 'DiscountCode', code.id, { code: code.code, type: code.type, value: Number(code.value) });
  return NextResponse.json({ data: code }, { status: 201 });
}, 'SUPER_ADMIN');
