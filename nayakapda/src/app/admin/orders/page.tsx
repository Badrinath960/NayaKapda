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
  PLACED: 'badge-orange', CONFIRMED: 'badge-blue', DISPATCHED: 'badge bg-purple-500/20 text-purple-400 border border-purple-500/30',
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total orders</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary py-2 px-4 text-sm">📥 Export CSV</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" placeholder="Search by name or phone..." value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="input py-2 px-4 text-sm w-64" />
        <select className="input py-2 px-3 text-sm w-40" value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input py-2 px-3 text-sm w-40" value={filters.paymentMode}
          onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}>
          <option value="">All Payment</option>
          <option value="PREPAID">Prepaid</option>
          <option value="COD">COD</option>
          <option value="CREDIT">Credit</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
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
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono text-xs text-orange-400">#{order.id.slice(-8).toUpperCase()}</span>
                  </td>
                  <td>
                    <div className="text-sm">{order.user.name ?? '—'}</div>
                    <div className="text-xs text-gray-500">{order.user.phone}</div>
                  </td>
                  <td><span className={STATUS_COLORS[order.status] ?? 'badge-gray'}>{order.status}</span></td>
                  <td><span className="badge-gray text-xs">{order.paymentMode}</span></td>
                  <td className="font-medium">{formatINR(Number(order.totalAmount))}</td>
                  <td className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="text-orange-400 hover:text-orange-300 text-sm">
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
          <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-800">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-ghost py-1 px-3 text-sm disabled:opacity-30">← Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-ghost py-1 px-3 text-sm disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
