'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';

type Order = {
  id: string;
  status: string;
  paymentMode: string;
  totalAmount: number;
  createdAt: string;
  user: { name: string | null; phone: string };
};

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'badge-orange', CONFIRMED: 'badge-blue', DISPATCHED: 'badge-blue',
  DELIVERED: 'badge-green', CANCELLED: 'badge-red',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', paymentMode: '', search: '' });
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.status) params.set('status', filters.status);
    if (filters.paymentMode) params.set('paymentMode', filters.paymentMode);
    if (filters.search) params.set('search', filters.search);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    if (data.data) { setOrders(data.data.orders); setTotal(data.data.total); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [page, filters]);

  const exportCSV = () => {
    const params = new URLSearchParams({ format: 'csv', limit: '10000' });
    if (filters.status) params.set('status', filters.status);
    window.open(`/api/admin/orders?${params}`);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">{total} total orders</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary py-2 px-4 text-xs font-bold shadow-xs">📥 Export CSV</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search by name or phone..." value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="input py-2 px-4 text-xs w-64" />
        <select className="input py-2 px-3 text-xs w-40" value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input py-2 px-3 text-xs w-40" value={filters.paymentMode}
          onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}>
          <option value="">All Payment</option>
          <option value="PREPAID">Prepaid</option>
          <option value="COD">COD</option>
          <option value="CREDIT">Credit</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="table-container rounded-none border-0 shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-orange-600">#{order.id.slice(-8).toUpperCase()}</span>
                  </td>
                  <td>
                    <div className="text-xs font-bold text-slate-900">{order.user.name ?? '—'}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{order.user.phone}</div>
                  </td>
                  <td><span className={STATUS_COLORS[order.status] ?? 'badge-gray'}>{order.status}</span></td>
                  <td><span className="badge-gray text-xs">{order.paymentMode}</span></td>
                  <td className="font-bold text-slate-900 text-xs">{formatINR(Number(order.totalAmount))}</td>
                  <td className="text-slate-500 text-xs font-medium">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="text-orange-600 hover:underline text-xs font-bold">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-200">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-ghost py-1 px-3 text-xs font-bold disabled:opacity-30">← Prev</button>
            <span className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-ghost py-1 px-3 text-xs font-bold disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
