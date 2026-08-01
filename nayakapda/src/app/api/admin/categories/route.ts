import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { auditCreate } from '@/lib/audit';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  qtyMultiple: z.number().int().min(1).max(100).default(10),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

// GET /api/admin/categories — list all categories for admin (including inactive)
export const GET = withAdminAuth(async (_request: NextRequest) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ success: true, data: categories });
});

// POST /api/admin/categories — create new category
export const POST = withAdminAuth(async (request: NextRequest, _ctx, admin) => {
  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  // Check slug uniqueness
  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ success: false, message: 'Category slug already exists' }, { status: 409 });
  }

  const category = await prisma.category.create({ data: parsed.data });

  await auditCreate(admin.adminId, 'Category', category.id, {
    name: category.name,
    slug: category.slug,
  });

  return NextResponse.json({ success: true, data: category }, { status: 201 });
});
