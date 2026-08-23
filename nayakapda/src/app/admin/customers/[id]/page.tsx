'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  PLACED: 'badge-orange',
  CONFIRMED: 'badge-blue',
  DISPATCHED: 'badge-blue',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
};

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editLimit, setEditLimit] = useState('');
  const [editingLimit, setEditingLimit] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCustomer = async () => {
    const res = await fetch(`/api/admin/customers/${id}`);
    const data = await res.json();
    if (data.data) {
      setCustomer(data.data);
      setEditLimit(String(data.data.creditLine?.limitAmount ?? 0));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const saveLimit = async () => {
    setSaving(true);
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limitAmount: parseFloat(editLimit) }),
    });
    setSaving(false);
    setEditingLimit(false);
    fetchCustomer();
  };

  if (loading) return <div className="p-6 text-slate-500 text-xs font-semibold">Loading customer details...</div>;
  if (!customer) return <div className="p-6 text-rose-600 text-xs font-semibold">Customer not found</div>;

  const available = customer.creditLine
    ? Number(customer.creditLine.limitAmount) - Number(customer.creditLine.usedAmount)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div>
        <button
          onClick={() => router.back()}
          className="text-slate-500 text-xs font-semibold hover:text-slate-900 mb-1.5 flex items-center gap-1 cursor-pointer"
        >
          ← Back to Customers
        </button>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">{customer.name ?? 'Customer Profile'}</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-slate-500 font-medium">
          <span className="font-semibold text-slate-700">{customer.phone}</span>
          {customer.email && <span>• {customer.email}</span>}
          <span>• Joined {formatDate(customer.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Credit Line Card */}
        <div className="card p-5 space-y-4 bg-white border-slate-200 shadow-xs h-fit">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Credit Line</h3>
          {customer.creditLine ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Limit</p>
                  <p className="font-bold text-xs sm:text-sm text-slate-900">
                    {formatINR(Number(customer.creditLine.limitAmount))}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Used</p>
                  <p className="font-bold text-xs sm:text-sm text-rose-600">
                    {formatINR(Number(customer.creditLine.usedAmount))}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Available</p>
                  <p
                    className={`font-bold text-xs sm:text-sm ${
                      available >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatINR(available)}
                  </p>
                </div>
              </div>

              {editingLimit ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    className="input text-xs w-full"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveLimit}
                      disabled={saving}
                      className="btn-primary flex-1 py-2 text-xs font-bold cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Save Limit'}
                    </button>
                    <button
                      onClick={() => setEditingLimit(false)}
                      className="btn-secondary flex-1 py-2 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingLimit(true)}
                  className="btn-secondary w-full py-2 text-xs font-bold cursor-pointer"
                >
                  Edit Credit Limit
                </button>
              )}

              {/* Transactions */}
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Recent Credit Transactions
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customer.creditLine.transactions.length === 0 ? (
                    <p className="text-slate-400 text-xs font-medium">No transactions recorded</p>
                  ) : (
                    customer.creditLine.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100"
                      >
                        <div>
                          <span
                            className={`font-bold ${
                              tx.type === 'CHARGE' ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {tx.type}
                          </span>
                          {tx.note && <span className="text-slate-500 ml-1.5 text-[11px]">{tx.note}</span>}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{formatINR(Number(tx.amount))}</div>
                          <div className="text-[10px] text-slate-400">{formatDate(tx.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-xs font-medium">No credit line assigned to this customer.</p>
          )}
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 card overflow-hidden bg-white border-slate-200 shadow-xs">
          <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-sm">
            Order History ({customer.orders.length})
          </div>
          <div className="table-container rounded-none border-0 shadow-none overflow-x-auto">
            <table className="table min-w-[600px]">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs font-medium">
                      No orders placed yet
                    </td>
                  </tr>
                ) : (
                  customer.orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-bold text-orange-600 hover:underline"
                        >
                          #{order.id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <span className={STATUS_COLORS[order.status] ?? 'badge-gray'}>{order.status}</span>
                      </td>
                      <td>
                        <span className="badge-gray text-xs">{order.paymentMode}</span>
                      </td>
                      <td className="text-slate-700 text-xs font-semibold">{order._count.items} items</td>
                      <td className="font-bold text-slate-900 text-xs">
                        {formatINR(Number(order.totalAmount))}
                      </td>
                      <td className="text-slate-500 text-xs font-medium">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
