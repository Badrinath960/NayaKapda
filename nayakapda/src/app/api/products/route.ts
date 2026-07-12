import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productQuerySchema, validateRequest } from '@/lib/validation';
import { withErrorHandler } from '@/lib/middleware';

// GET /api/products?category=&page=&limit=
// Requirements: 3.1, 3.2, 3.3, 3.4
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const validation = validateRequest(productQuerySchema, {
    category: searchParams.get('category') ?? undefined,
    page: searchParams.get('page') ?? 1,
    limit: searchParams.get('limit') ?? 20,
  });

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { category, page, limit } = validation.data;
  const skip = (page - 1) * limit;

  const where = {
    active: true,
    ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),
    variants: {
      some: { active: true }, // Only show products with at least one active variant
    },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true, qtyMultiple: true } },
        photos: {
          orderBy: { sortOrder: 'asc' },
          take: 1, // First photo for card
        },
        pricingTiers: {
          orderBy: { minQty: 'asc' },
          take: 1, // Lowest tier = "from" price
        },
        _count: { select: { variants: { where: { active: true } } } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const productCards = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    gsm: p.gsm,
    fabricComposition: p.fabricComposition,
    basePrice: Number(p.basePrice),
    priceFrom: p.pricingTiers[0] ? Number(p.pricingTiers[0].pricePerPiece) : Number(p.basePrice),
    category: p.category,
    photo: p.photos[0] ?? null,
    variantCount: p._count.variants,
  }));

  return NextResponse.json({
    data: {
      products: productCards,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});
