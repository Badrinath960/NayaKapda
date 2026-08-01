import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { auditUpdate, auditDelete } from '@/lib/audit';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional().nullable(),
  qtyMultiple: z.number().int().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// PATCH /api/admin/categories/[id] — update category (including toggle active)
export const PATCH = withAdminAuth(async (request: NextRequest, context: { params: any }, admin) => {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  await auditUpdate(admin.adminId, 'Category', category.id, 
    { name: existing.name, active: existing.active, qtyMultiple: existing.qtyMultiple, sortOrder: existing.sortOrder },
    { ...parsed.data }
  );

  return NextResponse.json({ success: true, data: category });
});

// DELETE /api/admin/categories/[id] — delete category (only if no products linked)
export const DELETE = withAdminAuth(async (request: NextRequest, context: { params: any }, admin) => {
  const { id } = await context.params;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!existing) {
    return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
  }

  if (existing._count.products > 0) {
    return NextResponse.json(
      { success: false, message: `Cannot delete category with ${existing._count.products} linked product(s). Deactivate it instead.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  await auditDelete(admin.adminId, 'Category', id, {
    name: existing.name,
    slug: existing.slug,
  });

  return NextResponse.json({ success: true, message: 'Category deleted' });
}, 'SUPER_ADMIN');
