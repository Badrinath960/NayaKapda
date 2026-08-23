'use client';

import { useEffect, useState } from 'react';
import { formatINR, formatDate } from '@/lib/utils';

interface ReferralData {
  code: string;
  link: string;
  earningsTotal: number;
  commissionRate: number;
  earnings: { orderId: string; amount: number; paid: boolean; createdAt: string }[];
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/account/referral')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const copy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const requestPayout = async () => {
    setPayoutMsg('Payout request submitted! Our team will contact you within 48 hours to transfer your commission.');
    setTimeout(() => setPayoutMsg(null), 6000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Referral Program</h1>
        <div className="card p-8 sm:p-12 text-center bg-white border-slate-200 shadow-xs max-w-md mx-auto">
          <p className="text-slate-500 text-xs">Unable to load referral data. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Referral Program</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">
          Earn {(data.commissionRate * 100).toFixed(0)}% commission on every wholesale order placed through your link
        </p>
      </div>

      {/* Earnings banner */}
      <div className="card p-5 sm:p-6 bg-gradient-to-r from-orange-50 via-white to-orange-50/50 border-orange-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wider mb-1">
            Total Commission Earned
          </p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">
            {formatINR(data.earningsTotal)}
          </p>
        </div>
        {data.earningsTotal > 0 && (
          <button
            onClick={requestPayout}
            className="btn-primary py-2.5 px-6 text-xs font-bold shadow-xs cursor-pointer"
          >
            💸 Request Payout
          </button>
        )}
      </div>

      {payoutMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          ✓ {payoutMsg}
        </div>
      )}

      {/* Referral Code */}
      <div className="card p-4 sm:p-6 bg-white border-slate-200 shadow-xs space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Your Unique Referral Code
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 p-3 sm:p-4 bg-orange-50 border-2 border-dashed border-orange-300 rounded-xl text-center font-mono text-xl sm:text-2xl font-black text-orange-600 tracking-wider select-all">
            {data.code}
          </div>
          <button
            onClick={() => copy(data.code, 'code')}
            className="btn-secondary py-3 px-5 text-xs font-bold cursor-pointer"
          >
            {copied === 'code' ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card p-4 sm:p-6 bg-white border-slate-200 shadow-xs space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Direct Share Link
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-sky-700 font-mono font-bold break-all select-all">
            {data.link}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copy(data.link, 'link')}
              className="btn-secondary flex-1 sm:flex-none py-2.5 px-4 text-xs font-bold cursor-pointer"
            >
              {copied === 'link' ? '✓ Copied!' : '📋 Copy Link'}
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() =>
                  navigator.share({
                    title: 'NayaKapda.com Wholesale Apparel',
                    text: 'Shop bulk plain T-shirts, hoodies, and polos on NayaKapda.com!',
                    url: data.link,
                  })
                }
                className="btn-primary flex-1 sm:flex-none py-2.5 px-4 text-xs font-bold shadow-xs cursor-pointer"
              >
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-4 sm:p-6 bg-white border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          How Referral Earnings Work
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              icon: '🔗',
              title: '1. Share Your Link',
              desc: 'Share your link with screen printers, DTF pros, and garment resellers.',
            },
            {
              icon: '🛒',
              title: '2. They Place Bulk Orders',
              desc: 'When they register and purchase wholesale apparel on NayaKapda.',
            },
            {
              icon: '💰',
              title: '3. You Earn Commission',
              desc: `You earn ${(data.commissionRate * 100).toFixed(0)}% commission directly on their order total.`,
            },
          ].map((step) => (
            <div key={step.title} className="text-center p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-2xl sm:text-3xl mb-1.5">{step.icon}</div>
              <p className="font-bold text-slate-900 text-xs mb-1">{step.title}</p>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings ledger */}
      {data.earnings.length > 0 && (
        <div className="card p-4 sm:p-5 bg-white border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Commission Earnings History
          </h2>
          <div className="table-container border-slate-200 shadow-none overflow-x-auto">
            <table className="table min-w-[500px]">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Earned</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.earnings.map((e) => (
                  <tr key={e.orderId}>
                    <td className="font-mono text-orange-600 font-bold text-xs">
                      #{e.orderId.slice(-8).toUpperCase()}
                    </td>
                    <td className="text-emerald-600 font-bold text-xs">{formatINR(e.amount)}</td>
                    <td className="text-slate-500 text-xs font-medium">{formatDate(e.createdAt)}</td>
                    <td>
                      <span className={e.paid ? 'badge-green' : 'badge-orange'}>
                        {e.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
