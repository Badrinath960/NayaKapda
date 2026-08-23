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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <div className="bg-white border-b border-slate-200 py-12 text-center">
          <div className="page-container">
            <div className="text-5xl mb-3">🚚</div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
              Shipping Calculator
            </h1>
            <p className="text-slate-600 text-sm font-medium max-w-md mx-auto">
              Check available shipping methods and rates for your pincode before placing your bulk order.
            </p>
          </div>
        </div>

        <div className="page-container py-10">
          <div className="max-w-xl mx-auto space-y-6">
            {/* Form */}
            <div className="card p-8 bg-white border-slate-200 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="pincode">
                    Delivery Pincode
                  </label>
                  <input
                    id="pincode"
                    className="input text-xs"
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
                    className="input text-xs"
                    type="number"
                    min={1}
                    placeholder="e.g. 100"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-3 text-xs font-bold shadow-md"
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : '🔍 Calculate Shipping'}
                </button>
              </form>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-3 animate-fade-in-up">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-sm font-bold text-slate-900">
                    Available Methods
                  </h2>
                  <span className="text-slate-500 text-xs font-medium">
                    Pincode: <strong className="text-orange-600">{result.pincode}</strong> · {result.totalPieces} pcs
                  </span>
                </div>

                {result.methods.length === 0 ? (
                  <div className="card p-8 text-center bg-white border-slate-200 shadow-sm">
                    <div className="text-4xl mb-3">🚫</div>
                    <p className="text-rose-700 font-bold text-sm mb-1">
                      No shipping available for this pincode
                    </p>
                    <p className="text-slate-500 text-xs mb-4 font-medium">
                      Contact us on WhatsApp for custom shipping arrangements.
                    </p>
                    <a
                      href="https://wa.me/918735045268"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary py-2 px-4 text-xs font-bold shadow-xs inline-flex items-center gap-2"
                    >
                      <span>💬</span> WhatsApp Us (+91 87350 45268)
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.methods.map((method, i) => (
                      <div
                        key={method.id}
                        className={`card p-5 flex items-center justify-between gap-4 bg-white border-slate-200 shadow-sm ${
                          i === 0 ? 'border-orange-300 bg-orange-50/40' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-slate-900 text-sm">{method.name}</p>
                            {i === 0 && <span className="badge-orange text-[10px] font-bold">Recommended</span>}
                          </div>
                          <p className="text-slate-500 text-xs font-medium">
                            🕐 {method.etaText}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-black ${method.cost === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: '⚡', title: 'Fast Dispatch', desc: 'Orders confirmed before 2 PM ship same day' },
                  { icon: '📦', title: 'Bulk Friendly', desc: 'Special rates for orders above 500 pieces' },
                  { icon: '🗺️', title: 'Pan India', desc: 'We ship to all 29 states and UTs' },
                  { icon: '🔍', title: 'Tracking', desc: 'Real-time tracking after dispatch' },
                ].map((card) => (
                  <div key={card.title} className="card p-4 bg-white border-slate-200 shadow-xs">
                    <div className="text-2xl mb-2">{card.icon}</div>
                    <p className="font-bold text-slate-900 text-xs mb-0.5">{card.title}</p>
                    <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
