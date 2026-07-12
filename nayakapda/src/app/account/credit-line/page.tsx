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
      <div>
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1rem' }}>Credit Line</h1>
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
          <p style={{ color: '#9ca3af' }}>{error ?? 'No credit line found'}</p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Contact support to request a credit line for your account.
          </p>
        </div>
      </div>
    );
  }

  const usedPct = data.limitAmount > 0 ? Math.min((data.usedAmount / data.limitAmount) * 100, 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>Credit Line</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Your buy-now-pay-later facility
          </p>
        </div>
        {data.usedAmount > 0 && (
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ fontSize: '0.875rem' }}>
            💰 Pay to Settle
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        <div className="glass" style={{ padding: '1.25rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
            Credit Limit
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>
            {formatINR(data.limitAmount)}
          </p>
        </div>
        <div className="glass" style={{ padding: '1.25rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
            Used
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: data.usedAmount > 0 ? '#f87171' : '#f9fafb', margin: 0 }}>
            {formatINR(data.usedAmount)}
          </p>
        </div>
        <div className="glass" style={{ padding: '1.25rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
            Available
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: data.availableAmount > 0 ? '#4ade80' : '#f87171', margin: 0 }}>
            {formatINR(data.availableAmount)}
          </p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
          <span style={{ color: '#9ca3af' }}>Credit Utilisation</span>
          <span style={{ color: usedPct > 80 ? '#f87171' : '#d1d5db', fontWeight: 600 }}>{usedPct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${usedPct}%`,
              background: usedPct > 80 ? '#ef4444' : usedPct > 50 ? '#f97316' : '#22c55e',
              borderRadius: 9999,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Transaction ledger */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Transaction History
        </h2>
        {data.transactions.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>No transactions yet</p>
        ) : (
          <div className="table-container">
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
                    <td style={{ fontWeight: 600, color: tx.type === 'CHARGE' ? '#f87171' : '#4ade80' }}>
                      {tx.type === 'CHARGE' ? '+' : '−'}{formatINR(tx.amount)}
                    </td>
                    <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{formatDate(tx.createdAt)}</td>
                    <td style={{ color: '#d1d5db', fontSize: '0.8rem' }}>{tx.note ?? '—'}</td>
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card"
            style={{ padding: '2rem', maxWidth: 400, width: '100%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
            <h3 style={{ color: '#f9fafb', fontWeight: 700, marginBottom: '0.5rem' }}>Coming Soon</h3>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              Razorpay settlement integration is coming soon. Please contact support to settle your outstanding balance.
            </p>
            <a href="https://wa.me/919999999901" target="_blank" rel="noreferrer" className="btn-primary" style={{ marginRight: '0.75rem' }}>
              WhatsApp Support
            </a>
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
