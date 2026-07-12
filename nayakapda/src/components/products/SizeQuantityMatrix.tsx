'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatINR } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

type Variant = { id: string; size: string; color: string; sku: string; stockQty: number };
type Tier    = { id: string; minQty: number; maxQty: number | null; pricePerPiece: number };

type Props = {
  productId: string;
  productName: string;
  variants: Variant[];
  sizes: string[];
  colors: string[];
  tiers: Tier[];
  basePrice: number;
  qtyMultiple: number;
  categoryId: string;
};

// Resolve price from tiers (pure, client-side)
function resolveUnitPrice(tiers: Tier[], totalQty: number, basePrice: number): number {
  const match = tiers.find(
    (t) => t.minQty <= totalQty && (t.maxQty === null || t.maxQty >= totalQty)
  );
  return match ? match.pricePerPiece : basePrice;
}

export function SizeQuantityMatrix({
  productId, productName, variants, sizes, colors, tiers, basePrice, qtyMultiple,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { setItemCount } = useCartStore();

  // matrix[color][size] = qty
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(colors.map((c) => [c, Object.fromEntries(sizes.map((s) => [s, 0]))]))
  );
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? '');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const variantMap = useMemo(() => {
    const map: Record<string, Record<string, Variant>> = {};
    for (const v of variants) {
      if (!map[v.color]) map[v.color] = {};
      map[v.color][v.size] = v;
    }
    return map;
  }, [variants]);

  const totalQty = useMemo(() =>
    Object.values(matrix).flatMap(Object.values).reduce((a, b) => a + b, 0),
    [matrix]
  );

  const unitPrice = useMemo(() => resolveUnitPrice(tiers, totalQty, basePrice), [tiers, totalQty, basePrice]);
  const subtotal = totalQty * unitPrice;

  const activeTier = tiers.find((t) => t.minQty <= totalQty && (t.maxQty === null || t.maxQty >= totalQty));
  const nextTier = tiers.find((t) => t.minQty > totalQty);

  const isValidMultiple = totalQty === 0 || totalQty % qtyMultiple === 0;

  const handleQtyChange = useCallback((color: string, size: string, val: string) => {
    const num = parseInt(val) || 0;
    setMatrix((prev) => ({ ...prev, [color]: { ...prev[color], [size]: Math.max(0, num) } }));
    setError(null);
    setSuccess(false);
  }, []);

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (totalQty === 0) { setError('Please enter at least one quantity.'); return; }
    if (!isValidMultiple) { setError(`Total quantity must be a multiple of ${qtyMultiple}.`); return; }

    const rows = variants
      .map((v) => ({ variantId: v.id, qty: matrix[v.color]?.[v.size] ?? 0 }))
      .filter((r) => r.qty > 0);

    setAdding(true);
    setError(null);

    try {
      const res = await fetch('/api/cart/bulk-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.errors?.fieldErrors?.rows?.[0] ?? 'Failed to add to cart'); return; }

      setItemCount(data.data.cartItemCount);
      setSuccess(true);
      // Reset matrix
      setMatrix(Object.fromEntries(colors.map((c) => [c, Object.fromEntries(sizes.map((s) => [s, 0]))])));
    } catch {
      setError('Network error — please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleCopyOrder = () => {
    const lines = variants
      .filter((v) => (matrix[v.color]?.[v.size] ?? 0) > 0)
      .map((v) => `${productName} (${v.size} / ${v.color}) × ${matrix[v.color][v.size]} = ${formatINR((matrix[v.color][v.size]) * unitPrice)}`);
    const text = `Order Summary — ${productName}\n\n${lines.join('\n')}\n\nTotal: ${formatINR(subtotal)} (${totalQty} pcs @ ${formatINR(unitPrice)}/pc)`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Select Sizes & Quantities</h2>
          <p className="text-sm text-gray-500 mt-1">Min. {qtyMultiple} pcs multiples • Price updates as you add</p>
        </div>
        {totalQty > 0 && (
          <button onClick={handleCopyOrder} className="btn-ghost text-sm" title="Copy order summary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Order
          </button>
        )}
      </div>

      {/* Color Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-800 overflow-x-auto">
        {colors.map((color) => {
          const colorQty = Object.values(matrix[color] ?? {}).reduce((a, b) => a + b, 0);
          return (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedColor === color
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {color}
              {colorQty > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${selectedColor === color ? 'bg-orange-600' : 'bg-gray-700'}`}>
                  {colorQty}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Size Quantity Grid */}
      <div className="p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-gray-400 font-medium pb-3 pr-4">Size</th>
              <th className="text-center text-gray-400 font-medium pb-3 px-2">Stock</th>
              <th className="text-center text-gray-400 font-medium pb-3 px-2">Quantity</th>
              <th className="text-right text-gray-400 font-medium pb-3 pl-4">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sizes.map((size) => {
              const variant = variantMap[selectedColor]?.[size];
              const qty = matrix[selectedColor]?.[size] ?? 0;
              const isOutOfStock = !variant || variant.stockQty === 0;

              return (
                <tr key={size} className={isOutOfStock ? 'opacity-40' : ''}>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 font-bold text-sm">
                      {size}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {isOutOfStock ? (
                      <span className="badge-red text-xs">Out</span>
                    ) : (
                      <span className="text-gray-400 text-xs">{variant.stockQty}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      step={qtyMultiple}
                      value={qty || ''}
                      placeholder="0"
                      disabled={isOutOfStock}
                      onChange={(e) => handleQtyChange(selectedColor, size, e.target.value)}
                      className="qty-cell"
                    />
                  </td>
                  <td className="py-3 pl-4 text-right font-medium text-orange-400">
                    {qty > 0 ? formatINR(qty * unitPrice) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Pricing Summary */}
      <div className="p-6 bg-gray-900/60 border-t border-gray-800 space-y-4">
        {/* Tier Indicator */}
        {nextTier && totalQty < nextTier.minQty && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-300">
              Add <strong>{nextTier.minQty - totalQty} more pcs</strong> to unlock{' '}
              <strong className="text-blue-200">{formatINR(nextTier.pricePerPiece)}/pc</strong>
            </span>
          </div>
        )}

        {!isValidMultiple && totalQty > 0 && (
          <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-300">
            ⚠️ Total qty ({totalQty}) must be a multiple of {qtyMultiple}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-300">
            ✅ Added to cart successfully!
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{totalQty} pcs</span>
              <span>×</span>
              <span className="text-orange-400 font-semibold">{formatINR(unitPrice)}/pc</span>
              {activeTier && <span className="badge-orange text-xs">{activeTier.minQty}+ tier</span>}
            </div>
            <div className="text-2xl font-black gradient-text">{formatINR(subtotal)}</div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding || totalQty === 0}
            className="btn-primary px-8 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding...
              </span>
            ) : (
              <>Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
