'use client';

import { useEffect, useState } from 'react';
import { formatINR, formatDate } from '@/lib/utils';

interface CreditLineData {
  id: string;
  limitAmount: number;
  usedAmount: number;
  availableAmount: number;
  transactions: {
    id: string;
    type: 'CHARGE' | 'SETTLEMENT';
    amount: number;
    orderId?: string;
    note?: string;
    createdAt: string;
  }[];
}

export default function CreditLinePage() {
  const [data, setData] = useState<CreditLineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch('/api/account/credit-line')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
        else setError(json.message ?? 'No credit line assigned');
      })
      .catch(() => setError('Failed to load credit line'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-900">Credit Line</h1>
        <div className="card p-12 text-center bg-white border-slate-200 shadow-sm max-w-md mx-auto">
          <div className="text-5xl mb-3">💳</div>
          <p className="text-slate-700 font-bold text-base">{error ?? 'No credit line found'}</p>
          <p className="text-slate-500 text-xs mt-1">
            Contact support to request a credit line for your account.
          </p>
        </div>
      </div>
    );
  }

  const usedPct = data.limitAmount > 0 ? Math.min((data.usedAmount / data.limitAmount) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Credit Line</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Your buy-now-pay-later facility
          </p>
        </div>
        {data.usedAmount > 0 && (
          <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4 text-xs font-bold shadow-md">
            💰 Pay to Settle
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-white border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Credit Limit
          </p>
          <p className="text-xl font-black text-slate-900">
            {formatINR(data.limitAmount)}
          </p>
        </div>
        <div className="card p-5 bg-white border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Used
          </p>
          <p className={`text-xl font-black ${data.usedAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatINR(data.usedAmount)}
          </p>
        </div>
        <div className="card p-5 bg-white border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Available
          </p>
          <p className={`text-xl font-black ${data.availableAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatINR(data.availableAmount)}
          </p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-500">Credit Utilisation</span>
          <span className={`font-bold ${usedPct > 80 ? 'text-rose-600' : 'text-slate-800'}`}>{usedPct.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usedPct > 80 ? 'bg-rose-500' : usedPct > 50 ? 'bg-orange-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      {/* Transaction ledger */}
      <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Transaction History
        </h2>
        {data.transactions.length === 0 ? (
          <p className="text-slate-500 text-xs font-medium text-center py-6">No transactions yet</p>
        ) : (
          <div className="table-container border-slate-200 shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className={tx.type === 'CHARGE' ? 'badge-red' : 'badge-green'}>
                        {tx.type === 'CHARGE' ? '↑ Charge' : '↓ Settlement'}
                      </span>
                    </td>
                    <td className={`font-bold text-xs ${tx.type === 'CHARGE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'CHARGE' ? '+' : '−'}{formatINR(tx.amount)}
                    </td>
                    <td className="text-slate-500 text-xs font-medium">{formatDate(tx.createdAt)}</td>
                    <td className="text-slate-700 text-xs font-medium">{tx.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card p-6 max-w-sm w-full text-center bg-white border-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🚧</div>
            <h3 className="text-slate-900 font-bold text-lg mb-1">Coming Soon</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Razorpay settlement integration is coming soon. Please contact support to settle your outstanding balance.
            </p>
            <div className="flex gap-2 justify-center">
              <a href="https://wa.me/919999999901" target="_blank" rel="noreferrer" className="btn-primary py-2 px-4 text-xs font-bold">
                WhatsApp Support
              </a>
              <button onClick={() => setShowModal(false)} className="btn-secondary py-2 px-4 text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
