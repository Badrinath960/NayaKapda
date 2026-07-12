'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';

interface ShippingMethod {
  id: string;
  name: string;
  etaText: string;
  cost: number;
}

interface CalcResult {
  methods: ShippingMethod[];
  pincode: string;
  totalPieces: number;
}

export default function ShippingCalculatorPage() {
  const [pincode, setPincode] = useState('');
  const [pieces, setPieces] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }
    const piecesNum = parseInt(pieces);
    if (!piecesNum || piecesNum < 1) {
      setError('Please enter at least 1 piece');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode, totalPieces: piecesNum }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Failed to calculate shipping');
        return;
      }
      const methods = json.data?.methods ?? json.data ?? [];
      setResult({ methods, pincode, totalPieces: piecesNum });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, transparent 60%)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            padding: '4rem 0 3rem',
          }}
        >
          <div className="page-container" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#f9fafb', margin: '0 0 0.75rem' }}>
              Shipping Calculator
            </h1>
            <p style={{ color: '#9ca3af', maxWidth: 480, margin: '0 auto' }}>
              Check available shipping methods and rates for your pincode before placing your bulk order.
            </p>
          </div>
        </div>

        <div className="page-container" style={{ paddingTop: '3rem' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {/* Form */}
            <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="label" htmlFor="pincode">
                    Delivery Pincode
                  </label>
                  <input
                    id="pincode"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="pieces">
                    Number of Pieces
                  </label>
                  <input
                    id="pieces"
                    className="input"
                    type="number"
                    min={1}
                    placeholder="e.g. 100"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="badge-red" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', fontSize: '1rem', padding: '0.875rem' }}
                >
                  {loading ? 'Calculating...' : '🔍 Calculate Shipping'}
                </button>
              </form>
            </div>

            {/* Results */}
            {result && (
              <div style={{ animationName: 'fadeInUp', animationDuration: '0.4s', animationFillMode: 'both' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f9fafb', margin: 0 }}>
                    Available Methods
                  </h2>
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                    Pincode: <strong style={{ color: '#f97316' }}>{result.pincode}</strong> · {result.totalPieces} pcs
                  </span>
                </div>

                {result.methods.length === 0 ? (
                  <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚫</div>
                    <p style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.5rem' }}>
                      No shipping available for this pincode
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      Contact us on WhatsApp for custom shipping arrangements.
                    </p>
                    <a
                      href="https://wa.me/919999999901"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                      style={{ marginTop: '1rem', fontSize: '0.875rem' }}
                    >
                      WhatsApp Us
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {result.methods.map((method, i) => (
                      <div
                        key={method.id}
                        className="card"
                        style={{
                          padding: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          border: i === 0 ? '1px solid rgba(249,115,22,0.3)' : undefined,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <p style={{ fontWeight: 600, color: '#f9fafb', margin: 0 }}>{method.name}</p>
                            {i === 0 && <span className="badge-orange">Recommended</span>}
                          </div>
                          <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>
                            🕐 {method.etaText}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: method.cost === 0 ? '#4ade80' : '#f97316', margin: 0 }}>
                            {method.cost === 0 ? 'Free' : formatINR(method.cost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info cards */}
            {!result && !loading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                {[
                  { icon: '⚡', title: 'Fast Dispatch', desc: 'Orders confirmed before 2 PM ship same day' },
                  { icon: '📦', title: 'Bulk Friendly', desc: 'Special rates for orders above 500 pieces' },
                  { icon: '🗺️', title: 'Pan India', desc: 'We ship to all 29 states and UTs' },
                  { icon: '🔍', title: 'Tracking', desc: 'Real-time tracking after dispatch' },
                ].map((card) => (
                  <div key={card.title} className="glass" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{card.icon}</div>
                    <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem', fontSize: '0.875rem' }}>{card.title}</p>
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>{card.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
