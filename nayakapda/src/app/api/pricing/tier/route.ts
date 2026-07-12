import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pricingTierQuerySchema, validateRequest } from '@/lib/validation';
import { resolvePriceFromTiers } from '@/lib/pricing';
import { withErrorHandler } from '@/lib/middleware';

// GET /api/pricing/tier?productId=&cumulativeQty=
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const validation = validateRequest(pricingTierQuerySchema, {
    productId: searchParams.get('productId') ?? '',
    cumulativeQty: searchParams.get('cumulativeQty') ?? 0,
  });

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { productId, cumulativeQty } = validation.data;

  const [product, tiers] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId }, select: { basePrice: true } }),
    prisma.pricingTier.findMany({ where: { productId }, orderBy: { minQty: 'asc' } }),
  ]);

  if (!product) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const result = resolvePriceFromTiers(
    tiers.map((t) => ({ id: t.id, minQty: t.minQty, maxQty: t.maxQty, pricePerPiece: Number(t.pricePerPiece) })),
    cumulativeQty,
    Number(product.basePrice)
  );

  return NextResponse.json({ data: result });
});
