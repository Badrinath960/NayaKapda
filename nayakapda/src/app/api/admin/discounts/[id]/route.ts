import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { recordAuditLog } from '@/lib/audit';

// PATCH /api/admin/discounts/[id]
export const PATCH = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, admin) => {
  const { id } = await context.params;
  const body = await request.json();
  const schema = z.object({
    active: z.boolean().optional(),
    value: z.number().optional(),
    maxUses: z.number().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  await recordAuditLog({
    adminId: admin.adminId, action: AuditAction.UPDATE,
    entity: 'DiscountCode', entityId: id,
    before: { active: existing.active, value: Number(existing.value) },
    after: parsed.data,
  });

  const updated = await prisma.discountCode.update({
    where: { id },
    data: {
      ...(parsed.data.active !== undefined && { active: parsed.data.active }),
      ...(parsed.data.value !== undefined && { value: parsed.data.value }),
      ...(parsed.data.maxUses !== undefined && { maxUses: parsed.data.maxUses }),
      ...(parsed.data.expiresAt !== undefined && {
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      }),
    },
  });
  return NextResponse.json({ success: true, data: updated });
}, 'SUPER_ADMIN');

// DELETE /api/admin/discounts/[id]
export const DELETE = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, admin) => {
  const { id } = await context.params;
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  await recordAuditLog({
    adminId: admin.adminId, action: AuditAction.DELETE,
    entity: 'DiscountCode', entityId: id,
    before: { code: existing.code },
  });

  await prisma.discountCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, 'SUPER_ADMIN');
