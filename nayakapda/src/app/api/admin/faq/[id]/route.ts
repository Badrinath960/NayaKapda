import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { z } from 'zod';

const updateFaqSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

// PATCH /api/admin/faq/[id]
export const PATCH = withAdminAuth(async (request: NextRequest, context: { params: { id: string } }) => {
  const id = context.params.id;
  const body = await request.json();
  const parsed = updateFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });
  }

  const updated = await prisma.fAQEntry.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: updated });
});

// DELETE /api/admin/faq/[id]
export const DELETE = withAdminAuth(async (request: NextRequest, context: { params: { id: string } }) => {
  const id = context.params.id;
  await prisma.fAQEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
