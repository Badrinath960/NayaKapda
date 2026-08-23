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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Credit Line</h1>
        <div className="card p-8 sm:p-12 text-center bg-white border-slate-200 shadow-xs max-w-md mx-auto">
          <div className="text-5xl mb-3">💳</div>
          <p className="text-slate-800 font-bold text-base">{error ?? 'No credit line assigned'}</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Contact support to request a Buy-Now-Pay-Later credit line for your wholesale printing business.
          </p>
          <a
            href="https://wa.me/918735045268"
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-5 py-2.5 px-5 text-xs font-bold shadow-xs inline-flex items-center gap-2"
          >
            <span>💬</span> Request Credit Line (+91 87350 45268)
          </a>
        </div>
      </div>
    );
  }

  const usedPct = data.limitAmount > 0 ? Math.min((data.usedAmount / data.limitAmount) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Credit Line</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Your B2B Buy-Now-Pay-Later revolving facility
          </p>
        </div>
        {data.usedAmount > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary py-2 px-4 text-xs font-bold shadow-xs self-start sm:self-auto cursor-pointer"
          >
            💰 Pay to Settle
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5 bg-white border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Credit Limit
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {formatINR(data.limitAmount)}
          </p>
        </div>
        <div className="card p-4 sm:p-5 bg-white border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Used Amount
          </p>
          <p className={`text-lg sm:text-xl font-black truncate ${data.usedAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatINR(data.usedAmount)}
          </p>
        </div>
        <div className="card p-4 sm:p-5 bg-white border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Available Credit
          </p>
          <p className={`text-lg sm:text-xl font-black truncate ${data.availableAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatINR(data.availableAmount)}
          </p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="card p-4 sm:p-5 bg-white border-slate-200 shadow-xs space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-500">Credit Utilisation</span>
          <span className={`font-bold ${usedPct > 80 ? 'text-rose-600' : 'text-slate-800'}`}>
            {usedPct.toFixed(1)}%
          </span>
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
      <div className="card p-4 sm:p-5 bg-white border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Transaction Ledger
        </h2>
        {data.transactions.length === 0 ? (
          <p className="text-slate-400 text-xs font-medium text-center py-6">No credit transactions recorded yet</p>
        ) : (
          <div className="table-container border-slate-200 shadow-none overflow-x-auto">
            <table className="table min-w-[500px]">
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

      {/* Settlement Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card p-6 max-w-sm w-full text-center bg-white border-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-slate-900 font-bold text-base mb-1">Credit Settlement</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              To settle your outstanding balance of <strong className="text-slate-900">{formatINR(data.usedAmount)}</strong> via NEFT/UPI/Bank Transfer, please connect with our accounts team.
            </p>
            <div className="flex gap-2 justify-center">
              <a
                href="https://wa.me/918735045268"
                target="_blank"
                rel="noreferrer"
                className="btn-primary py-2 px-4 text-xs font-bold"
              >
                WhatsApp (+91 87350 45268)
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary py-2 px-4 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
