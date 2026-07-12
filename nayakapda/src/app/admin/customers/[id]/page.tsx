'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR, formatDate } from '@/lib/utils';

type CustomerDetail = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  createdAt: string;
  creditLine: {
    id: string;
    limitAmount: number;
    usedAmount: number;
    transactions: Array<{ id: string; type: string; amount: number; createdAt: string; note: string | null }>;
  } | null;
  orders: Array<{
    id: string;
    status: string;
    paymentMode: string;
    totalAmount: number;
    createdAt: string;
    _count: { items: number };
  }>;
};

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'badge-orange', CONFIRMED: 'badge-blue',
  DISPATCHED: 'bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-500/20',
  DELIVERED: 'badge-green', CANCELLED: 'badge-red',
};

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editLimit, setEditLimit] = useState('');
  const [editingLimit, setEditingLimit] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCustomer = async () => {
    const res = await fetch(`/api/admin/customers/${params.id}`);
    const data = await res.json();
    if (data.data) {
      setCustomer(data.data);
      setEditLimit(String(data.data.creditLine?.limitAmount ?? 0));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCustomer(); }, []);

  const saveLimit = async () => {
    setSaving(true);
    await fetch(`/api/admin/customers/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limitAmount: parseFloat(editLimit) }),
    });
    setSaving(false);
    setEditingLimit(false);
    fetchCustomer();
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!customer) return <div className="p-8 text-red-400">Customer not found</div>;

  const available = customer.creditLine
    ? Number(customer.creditLine.limitAmount) - Number(customer.creditLine.usedAmount)
    : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-white mb-2">← Back</button>
        <h1 className="text-xl font-bold">{customer.name ?? 'Customer'}</h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>{customer.phone}</span>
          {customer.email && <span>• {customer.email}</span>}
          <span>• Joined {formatDate(customer.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Line Card */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold">Credit Line</h3>
          {customer.creditLine ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-gray-500">Limit</p>
                  <p className="font-bold text-sm">{formatINR(Number(customer.creditLine.limitAmount))}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-gray-500">Used</p>
                  <p className="font-bold text-sm text-red-400">{formatINR(Number(customer.creditLine.usedAmount))}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className={`font-bold text-sm ${available >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatINR(available)}</p>
                </div>
              </div>

              {editingLimit ? (
                <div className="space-y-2">
                  <input type="number" className="input" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={saveLimit} disabled={saving} className="btn-primary flex-1 py-2 text-sm">{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditingLimit(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingLimit(true)} className="btn-secondary w-full py-2 text-sm">Edit Credit Limit</button>
              )}

              {/* Transactions */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transactions</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customer.creditLine.transactions.length === 0 ? (
                    <p className="text-gray-600 text-xs">No transactions</p>
                  ) : customer.creditLine.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-800">
                      <div>
                        <span className={tx.type === 'CHARGE' ? 'text-red-400' : 'text-green-400'}>{tx.type}</span>
                        {tx.note && <span className="text-gray-500 ml-2">{tx.note}</span>}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatINR(Number(tx.amount))}</div>
                        <div className="text-gray-600">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No credit line assigned</p>
          )}
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-gray-800 font-semibold">Order History ({customer.orders.length})</div>
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr><th>Order ID</th><th>Status</th><th>Payment</th><th>Items</th><th>Total</th><th>Date</th></tr>
              </thead>
              <tbody>
                {customer.orders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-500">No orders</td></tr>
                ) : customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td><a href={`/admin/orders/${order.id}`} className="font-mono text-xs text-orange-400 hover:text-orange-300">#{order.id.slice(-8).toUpperCase()}</a></td>
                    <td><span className={STATUS_COLORS[order.status] ?? 'badge-gray'}>{order.status}</span></td>
                    <td><span className="badge-gray text-xs">{order.paymentMode}</span></td>
                    <td>{order._count.items} items</td>
                    <td className="font-medium">{formatINR(Number(order.totalAmount))}</td>
                    <td className="text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
