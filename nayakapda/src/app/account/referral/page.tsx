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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb' }}>Referral Program</h1>
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af' }}>Unable to load referral data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>Referral Program</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Earn {(data.commissionRate * 100).toFixed(0)}% commission on every referred order
        </p>
      </div>

      {/* Earnings banner */}
      <div className="glass-orange" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ color: '#fdba74', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>
            Total Earnings
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80', margin: 0 }}>
            {formatINR(data.earningsTotal)}
          </p>
        </div>
        {data.earningsTotal > 0 && (
          <button onClick={requestPayout} className="btn-primary">
            💸 Request Payout
          </button>
        )}
      </div>

      {payoutMsg && (
        <div className="badge-green" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}>
          ✓ {payoutMsg}
        </div>
      )}

      {/* Referral Code */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Your Referral Code
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              background: 'rgba(249,115,22,0.08)',
              border: '2px dashed rgba(249,115,22,0.4)',
              borderRadius: '0.75rem',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#f97316',
              letterSpacing: '0.15em',
            }}
          >
            {data.code}
          </div>
          <button
            onClick={() => copy(data.code, 'code')}
            className="btn-secondary"
            style={{ flexShrink: 0 }}
          >
            {copied === 'code' ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Referral Link
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: '#1f2937',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              color: '#60a5fa',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              border: '1px solid #374151',
            }}
          >
            {data.link}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => copy(data.link, 'link')}
              className="btn-secondary"
              style={{ padding: '0.625rem 1rem', fontSize: '0.8rem' }}
            >
              {copied === 'link' ? '✓ Copied!' : '📋 Copy'}
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() =>
                  navigator.share({ title: 'NayaKapda', text: 'Shop bulk apparel on NayaKapda!', url: data.link })
                }
                className="btn-primary"
                style={{ padding: '0.625rem 1rem', fontSize: '0.8rem' }}
              >
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[
            { icon: '🔗', title: 'Share Your Link', desc: 'Share your unique referral link with friends and resellers' },
            { icon: '🛒', title: 'They Order', desc: 'When someone registers and places an order using your link' },
            { icon: '💰', title: 'You Earn', desc: `You earn ${(data.commissionRate * 100).toFixed(0)}% commission on their total order value` },
          ].map((step) => (
            <div key={step.title} style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{step.icon}</div>
              <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem', fontSize: '0.875rem' }}>{step.title}</p>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings ledger */}
      {data.earnings.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Earnings History
          </h2>
          <div className="table-container">
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
                    <td style={{ fontFamily: 'monospace', color: '#f97316', fontSize: '0.8rem' }}>
                      #{e.orderId.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ color: '#4ade80', fontWeight: 600 }}>{formatINR(e.amount)}</td>
                    <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{formatDate(e.createdAt)}</td>
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
