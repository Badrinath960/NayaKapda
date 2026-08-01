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
    setPayoutMsg('Payout request submitted! Our team will contact you within 48 hours. (Razorpay integration coming soon)');
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
        <h1 className="text-2xl font-black text-slate-900">Referral Program</h1>
        <div className="card p-12 text-center bg-white border-slate-200 shadow-sm max-w-md mx-auto">
          <p className="text-slate-500 text-xs">Unable to load referral data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Referral Program</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">
          Earn {(data.commissionRate * 100).toFixed(0)}% commission on every referred order
        </p>
      </div>

      {/* Earnings banner */}
      <div className="card p-6 bg-gradient-to-r from-orange-50 via-white to-orange-50/50 border-orange-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wider mb-1">
            Total Earnings
          </p>
          <p className="text-3xl font-black text-emerald-600">
            {formatINR(data.earningsTotal)}
          </p>
        </div>
        {data.earningsTotal > 0 && (
          <button onClick={requestPayout} className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md">
            💸 Request Payout
          </button>
        )}
      </div>

      {payoutMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          ✓ {payoutMsg}
        </div>
      )}

      {/* Referral Code */}
      <div className="card p-6 bg-white border-slate-200 shadow-sm space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Your Referral Code
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 p-4 bg-orange-50 border-2 border-dashed border-orange-300 rounded-xl text-center font-mono text-2xl font-black text-orange-600 tracking-wider">
            {data.code}
          </div>
          <button
            onClick={() => copy(data.code, 'code')}
            className="btn-secondary py-3 px-5 text-xs font-bold"
          >
            {copied === 'code' ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card p-6 bg-white border-slate-200 shadow-sm space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Referral Link
        </p>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-sky-700 font-mono font-bold break-all">
            {data.link}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => copy(data.link, 'link')}
              className="btn-secondary py-2.5 px-4 text-xs font-bold"
            >
              {copied === 'link' ? '✓ Copied!' : '📋 Copy'}
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() =>
                  navigator.share({ title: 'NayaKapda', text: 'Shop bulk apparel on NayaKapda!', url: data.link })
                }
                className="btn-primary py-2.5 px-4 text-xs font-bold shadow-sm"
              >
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔗', title: 'Share Your Link', desc: 'Share your unique referral link with friends and resellers' },
            { icon: '🛒', title: 'They Order', desc: 'When someone registers and places an order using your link' },
            { icon: '💰', title: 'You Earn', desc: `You earn ${(data.commissionRate * 100).toFixed(0)}% commission on their total order value` },
          ].map((step) => (
            <div key={step.title} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-3xl mb-2">{step.icon}</div>
              <p className="font-bold text-slate-900 text-xs mb-1">{step.title}</p>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings ledger */}
      {data.earnings.length > 0 && (
        <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Earnings History
          </h2>
          <div className="table-container border-slate-200 shadow-none">
            <table className="table">
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
