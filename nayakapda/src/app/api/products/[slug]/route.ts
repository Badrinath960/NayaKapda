import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/middleware';

// GET /api/products/[slug]
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: {
        select: { id: true, name: true, slug: true, qtyMultiple: true },
      },
      variants: {
        where: { active: true },
        orderBy: [{ size: 'asc' }, { color: 'asc' }],
      },
      photos: {
        orderBy: { sortOrder: 'asc' },
      },
      pricingTiers: {
        orderBy: { minQty: 'asc' },
      },
      sizeChart: true,
      videos: true,
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Product not found' },
      { status: 404 }
    );
  }

  // Group variants by size
  const variantsBySize = product.variants.reduce(
    (acc, variant) => {
      if (!acc[variant.size]) acc[variant.size] = [];
      acc[variant.size].push(variant);
      return acc;
    },
    {} as Record<string, typeof product.variants>
  );

  return NextResponse.json({
    data: {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        gsm: product.gsm,
        fabricComposition: product.fabricComposition,
        basePrice: Number(product.basePrice),
        category: product.category,
      },
      variants: product.variants.map((v) => ({
        ...v,
        stockQty: v.stockQty,
      })),
      variantsBySize,
      tiers: product.pricingTiers.map((t) => ({
        id: t.id,
        minQty: t.minQty,
        maxQty: t.maxQty,
        pricePerPiece: Number(t.pricePerPiece),
      })),
      photos: product.photos,
      sizeChart: product.sizeChart,
      videos: product.videos,
    },
  });
});
