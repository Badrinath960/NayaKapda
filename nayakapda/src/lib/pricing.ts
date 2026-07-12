import { prisma } from '@/lib/prisma';

export type TierPriceResult = {
  unitPrice: number;
  tierId: string | null;
  tierMin: number | null;
  tierMax: number | null;
};

/**
 * Resolves the applicable pricing tier for a product given cumulative quantity.
 *
 * Property 3: For any product with non-overlapping PricingTiers and any cumulative
 * quantity Q, the resolved unit price SHALL be the pricePerPiece of the tier where
 * minQty <= Q and (maxQty IS NULL or maxQty >= Q). Price never increases with higher quantity.
 *
 * @param productId - The product CUID
 * @param cumulativeQty - The total quantity across all sizes in the matrix
 * @returns TierPriceResult with resolved unit price
 */
export async function resolvePrice(
  productId: string,
  cumulativeQty: number
): Promise<TierPriceResult> {
  const [product, tiers] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: { basePrice: true },
    }),
    prisma.pricingTier.findMany({
      where: { productId },
      orderBy: { minQty: 'asc' },
    }),
  ]);

  if (!product) {
    throw new Error('Product not found');
  }

  // Find matching tier: minQty <= cumulativeQty AND (maxQty IS NULL OR maxQty >= cumulativeQty)
  const matchedTier = tiers.find(
    (tier) =>
      tier.minQty <= cumulativeQty &&
      (tier.maxQty === null || tier.maxQty >= cumulativeQty)
  );

  if (matchedTier) {
    return {
      unitPrice: Number(matchedTier.pricePerPiece),
      tierId: matchedTier.id,
      tierMin: matchedTier.minQty,
      tierMax: matchedTier.maxQty,
    };
  }

  // Fall back to base price if no tier matches
  return {
    unitPrice: Number(product.basePrice),
    tierId: null,
    tierMin: null,
    tierMax: null,
  };
}

/**
 * Pure function version of resolvePrice for property-based testing.
 * Resolves price from an in-memory tier array — no DB calls.
 *
 * @param tiers - Array of pricing tiers ordered by minQty asc
 * @param cumulativeQty - Total quantity
 * @param basePrice - Fallback price
 */
export function resolvePriceFromTiers(
  tiers: Array<{ id: string; minQty: number; maxQty: number | null; pricePerPiece: number }>,
  cumulativeQty: number,
  basePrice: number
): TierPriceResult {
  const matchedTier = tiers.find(
    (tier) =>
      tier.minQty <= cumulativeQty &&
      (tier.maxQty === null || tier.maxQty >= cumulativeQty)
  );

  if (matchedTier) {
    return {
      unitPrice: matchedTier.pricePerPiece,
      tierId: matchedTier.id,
      tierMin: matchedTier.minQty,
      tierMax: matchedTier.maxQty,
    };
  }

  return {
    unitPrice: basePrice,
    tierId: null,
    tierMin: null,
    tierMax: null,
  };
}

/**
 * Validates that a quantity is a valid multiple.
 *
 * Property 2: For any category multiple M and any quantity Q,
 * validateMultiple(Q, M) returns true if and only if Q > 0 and Q mod M === 0
 */
export function validateMultiple(qty: number, multiple: number): boolean {
  return qty > 0 && qty % multiple === 0;
}

/**
 * Computes order total from items, discount, and shipping.
 * Used for server-side re-validation (Property 4).
 */
export function computeOrderTotal(
  items: Array<{ qty: number; unitPrice: number }>,
  discountAmount: number,
  shippingCost: number
): { subtotal: number; discountAmount: number; shippingCost: number; totalAmount: number } {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    shippingCost: Math.round(shippingCost * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Computes discount amount from a discount code.
 */
export function computeDiscount(
  discountType: 'PERCENT' | 'FLAT',
  discountValue: number,
  subtotal: number
): number {
  if (discountType === 'PERCENT') {
    return Math.round((subtotal * discountValue) / 100 * 100) / 100;
  }
  return Math.min(discountValue, subtotal); // FLAT discount can't exceed subtotal
}
