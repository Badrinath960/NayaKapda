import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().cuid('Invalid category ID'),
  description: z.string().optional(),
  gsm: z.number().int().positive().nullable().optional(),
  fabricComposition: z.string().optional(),
  basePrice: z.number().positive('Base price must be positive'),
});

// GET /api/admin/products — list products for admin
export const GET = withAdminAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const offset = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        _count: { select: { variants: true, photos: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      products: products.map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
      })),
      total,
      page,
      limit,
    },
  });
});

// POST /api/admin/products — create product
export const POST = withAdminAuth(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });
  }

  // Generate unique slug
  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  // Check unique slug
  const existing = await prisma.product.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      slug: finalSlug,
    },
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
});
