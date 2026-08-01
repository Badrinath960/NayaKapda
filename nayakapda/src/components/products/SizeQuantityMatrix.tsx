'use client';

import { useState, useCallback, useMemo } from 'react';
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
  productSlug: string;
  productPhotoUrl: string | null;
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
  productSlug, productPhotoUrl,
}: Props) {
  const { data: session } = useSession();
  const { setItemCount, addGuestItemsBulk } = useCartStore();

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
    if (totalQty === 0) { setError('Please enter at least one quantity.'); return; }
    if (!isValidMultiple) { setError(`Total quantity must be a multiple of ${qtyMultiple}.`); return; }

    const selectedRows = variants
      .map((v) => {
        const qty = matrix[v.color]?.[v.size] ?? 0;
        return {
          variantId: v.id,
          qty,
          unitPrice: unitPrice,
          variant: {
            id: v.id,
            size: v.size,
            color: v.color,
            sku: v.sku,
            stockQty: v.stockQty,
            product: {
              id: productId,
              name: productName,
              slug: productSlug,
              photo: productPhotoUrl ? { url: productPhotoUrl } : null,
              qtyMultiple: qtyMultiple,
            },
          },
        };
      })
      .filter((r) => r.qty > 0);

    setAdding(true);
    setError(null);

    if (!session) {
      // Guest User -> Add to Zustand Cart
      addGuestItemsBulk(selectedRows as any);
      setSuccess(true);
      setAdding(false);
      return;
    }

    // Authenticated User -> Add to DB Cart
    try {
      const res = await fetch('/api/cart/bulk-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: selectedRows.map((r) => ({ variantId: r.variantId, qty: r.qty })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to add items to cart.');
      } else {
        setSuccess(true);
        if (data.data?.cartItemCount !== undefined) {
          setItemCount(data.data.cartItemCount);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleCopyOrder = () => {
    const text = selectedColor + ': ' + sizes.map(s => `${s}:${matrix[selectedColor]?.[s] ?? 0}`).filter(str => !str.endsWith(':0')).join(', ');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Select Sizes & Quantities</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Min. {qtyMultiple} pcs multiples • Price updates dynamically as you add</p>
        </div>
        {totalQty > 0 && (
          <button onClick={handleCopyOrder} className="btn-secondary py-1.5 px-3 text-xs font-semibold" title="Copy order summary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Order
          </button>
        )}
      </div>

      {/* Color Tabs */}
      <div className="flex gap-2 p-4 border-b border-slate-200 overflow-x-auto bg-white">
        {colors.map((color) => {
          const colorQty = Object.values(matrix[color] ?? {}).reduce((a, b) => a + b, 0);
          return (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedColor === color
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {color}
              {colorQty > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${selectedColor === color ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
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
              <th className="text-left text-slate-500 font-bold text-xs uppercase tracking-wider pb-3 pr-4">Size</th>
              <th className="text-center text-slate-500 font-bold text-xs uppercase tracking-wider pb-3 px-2">Stock</th>
              <th className="text-center text-slate-500 font-bold text-xs uppercase tracking-wider pb-3 px-2">Quantity</th>
              <th className="text-right text-slate-500 font-bold text-xs uppercase tracking-wider pb-3 pl-4">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sizes.map((size) => {
              const variant = variantMap[selectedColor]?.[size];
              const qty = matrix[selectedColor]?.[size] ?? 0;
              const isOutOfStock = !variant || variant.stockQty === 0;
              const isLowStock = variant && variant.stockQty > 0 && variant.stockQty <= 10;

              return (
                <tr
                  key={size}
                  className={isOutOfStock ? 'opacity-40' : ''}
                  style={isOutOfStock ? {
                    backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(226,232,240,0.8) 5px, rgba(226,232,240,0.8) 6px)',
                  } : undefined}
                >
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 font-bold text-xs text-slate-800 border border-slate-200">
                      {size}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {isOutOfStock ? (
                      <span className="badge-red text-xs">Out</span>
                    ) : isLowStock ? (
                      <span className="text-amber-600 text-xs font-bold">Only {variant.stockQty}</span>
                    ) : (
                      <span className="text-slate-500 text-xs font-medium">{variant.stockQty}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      step={qtyMultiple}
                      value={qty || ''}
                      placeholder={isOutOfStock ? '✕' : '0'}
                      disabled={isOutOfStock}
                      onChange={(e) => handleQtyChange(selectedColor, size, e.target.value)}
                      className="qty-cell shadow-xs"
                    />
                  </td>
                  <td className="py-3 pl-4 text-right font-bold text-orange-600">
                    {qty > 0 ? formatINR(qty * unitPrice) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pricing Tiers Table */}
        {tiers.length > 0 && (
          <div className="mt-6 rounded-xl overflow-hidden border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50/80 border-b border-orange-100">
                  <th className="py-2.5 px-4 text-left font-bold text-xs uppercase tracking-wider text-orange-900">Size</th>
                  <th className="py-2.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-emerald-700">
                    ≥{tiers.find(t => t.maxQty === null)?.minQty ?? qtyMultiple}pcs
                  </th>
                  <th className="py-2.5 px-4 text-center font-bold text-xs uppercase tracking-wider text-slate-600">
                    &lt;{tiers.find(t => t.maxQty === null)?.minQty ?? qtyMultiple}pcs
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700 font-medium text-xs">{sizes.join(', ')}</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-black text-sm">
                    {formatINR(tiers.find(t => t.maxQty === null)?.pricePerPiece ?? basePrice)}
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-600 font-semibold text-sm">
                    {formatINR(basePrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Pricing Summary */}
      <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
        {/* Tier Indicator */}
        {nextTier && totalQty < nextTier.minQty && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-sm">
            <svg className="w-4 h-4 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sky-900 text-xs font-medium">
              Add <strong>{nextTier.minQty - totalQty} more pcs</strong> to unlock{' '}
              <strong className="text-sky-700 font-bold">{formatINR(nextTier.pricePerPiece)}/pc</strong>
            </span>
          </div>
        )}

        {!isValidMultiple && totalQty > 0 && (
          <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
            ⚠️ Total qty ({totalQty}) must be a multiple of {qtyMultiple}
          </div>
        )}

        {error && (
          error.includes('login') ? (
            <div className="px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-900 flex items-center justify-between gap-3">
              <span>🔒 {error}</span>
              <a
                href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
                className="btn-primary px-4 py-1.5 text-xs whitespace-nowrap"
              >
                Login Now
              </a>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900">
              {error}
            </div>
          )
        )}

        {success && (
          <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
            ✅ Added to cart successfully!
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>{totalQty} pcs</span>
              <span>×</span>
              <span className="text-orange-600 font-bold">{formatINR(unitPrice)}/pc</span>
              {activeTier && <span className="badge-orange text-[10px] font-bold">{activeTier.minQty}+ tier</span>}
            </div>
            <div className="text-2xl font-black text-slate-900">{formatINR(subtotal)}</div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding || totalQty === 0}
            className="btn-primary px-8 py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
