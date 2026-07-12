'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';

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
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(0,0,0,0) 60%)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            padding: '3rem 0 2rem',
          }}
        >
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 9999, fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>
                🟢 Live
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Updates every 60 seconds</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#f9fafb', margin: '0 0 0.5rem' }}>
              Live Stock Availability
            </h1>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              Real-time inventory across all products, sizes and colors
            </p>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: '2rem' }}>
          {/* Search */}
          <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
            <input
              className="input"
              placeholder="Search by SKU, product, size or color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" style={{ height: 56 }} />
              ))}
            </div>
          ) : (
            <>
              <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Showing {filtered.length} of {variants.length} variants
              </p>
              <div className="table-container">
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
                            <span style={{ fontFamily: 'monospace', color: '#9ca3af', fontSize: '0.75rem' }}>
                              {v.sku}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500, color: '#f9fafb' }}>{v.product.name}</td>
                          <td>
                            <span className="badge-gray">{v.size}</span>
                          </td>
                          <td style={{ color: '#d1d5db' }}>{v.color}</td>
                          <td>{stockBadge(v.stockQty)}</td>
                          <td>
                            {v.stockQty === 0 ? (
                              isSubscribed ? (
                                <span className="badge-green">✓ Notified</span>
                              ) : (
                                <button
                                  onClick={() => handleSubscribe(v.id)}
                                  disabled={subscribing === v.id}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                                >
                                  {subscribing === v.id ? '...' : '🔔 Notify Me'}
                                </button>
                              )
                            ) : (
                              <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  No variants match your search.
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
