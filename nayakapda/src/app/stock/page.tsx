'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface StockVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stockQty: number;
  product: { name: string; slug: string };
  subscribed?: boolean;
}

export default function StockPage() {
  const { data: session } = useSession();
  const [variants, setVariants] = useState<StockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock');
      const json = await res.json();
      if (json.data) {
        setVariants(json.data);
        const subIds = new Set<string>(
          json.data.filter((v: StockVariant) => v.subscribed).map((v: StockVariant) => v.id)
        );
        setSubscribedIds(subIds);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
    // Auto-refresh every 60s
    const interval = setInterval(fetchStock, 60_000);
    return () => clearInterval(interval);
  }, [fetchStock]);

  const handleSubscribe = async (variantId: string) => {
    if (!session) {
      window.location.href = '/login?redirect=/stock';
      return;
    }
    setSubscribing(variantId);
    try {
      const res = await fetch('/api/stock/alert-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });
      if (res.ok) {
        setSubscribedIds((prev) => new Set([...prev, variantId]));
      }
    } finally {
      setSubscribing(null);
    }
  };

  const filtered = variants.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.sku.toLowerCase().includes(q) ||
      v.product.name.toLowerCase().includes(q) ||
      v.size.toLowerCase().includes(q) ||
      v.color.toLowerCase().includes(q)
    );
  });

  const stockBadge = (qty: number) => {
    if (qty === 0) return <span className="badge-red">Out of Stock</span>;
    if (qty < 10) return <span className="badge-orange">{qty} left</span>;
    return <span className="badge-green">{qty} in stock</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <div className="bg-white border-b border-slate-200 py-10">
          <div className="page-container">
            <div className="flex items-center gap-3 mb-2">
              <span className="badge-green text-xs">
                🟢 Live Stock
              </span>
              <span className="text-slate-400 text-xs font-medium">Auto-updates every 60 seconds</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
              Live Stock Availability
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              Real-time inventory across all products, sizes and colors
            </p>
          </div>
        </div>

        <div className="page-container py-8">
          {/* Search */}
          <div className="mb-6 max-w-md">
            <input
              className="input text-xs"
              placeholder="Search by SKU, product, size or color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-xs font-medium mb-3">
                Showing {filtered.length} of {variants.length} variants
              </p>
              <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
                <div className="table-container border-0 rounded-none shadow-none">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Stock</th>
                        <th>Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((v) => {
                        const isSubscribed = subscribedIds.has(v.id);
                        return (
                          <tr key={v.id}>
                            <td>
                              <span className="font-mono text-slate-500 text-xs font-semibold">
                                {v.sku}
                              </span>
                            </td>
                            <td className="font-bold text-slate-900 text-xs">{v.product.name}</td>
                            <td>
                              <span className="badge-gray">{v.size}</span>
                            </td>
                            <td className="text-slate-700 text-xs font-medium">{v.color}</td>
                            <td>{stockBadge(v.stockQty)}</td>
                            <td>
                              {v.stockQty === 0 ? (
                                isSubscribed ? (
                                  <span className="badge-green">✓ Notified</span>
                                ) : (
                                  <button
                                    onClick={() => handleSubscribe(v.id)}
                                    disabled={subscribing === v.id}
                                    className="btn-secondary py-1 px-3 text-xs font-bold"
                                  >
                                    {subscribing === v.id ? '...' : '🔔 Notify Me'}
                                  </button>
                                )
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {filtered.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500 text-xs font-medium">
                  No variants match your search.
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
