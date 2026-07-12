'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR, formatDate } from '@/lib/utils';

type Customer = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  createdAt: string;
  _count: { orders: number };
  totalOrderValue: number;
  creditLine: { limitAmount: number; usedAmount: number } | null;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/customers?${params}`);
    const data = await res.json();
    if (data.data) { setCustomers(data.data.customers); setTotal(data.data.total); }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, [page, search]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">{total} customers</p>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search by name or phone..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input py-2 px-4 text-sm w-72" />
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Credit</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No customers found</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium">{c.name ?? 'Unknown'}</div>
                    {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                  </td>
                  <td className="font-mono text-sm">{c.phone}</td>
                  <td>{c._count.orders}</td>
                  <td className="font-medium">{formatINR(c.totalOrderValue)}</td>
                  <td>
                    {c.creditLine ? (
                      <div>
                        <span className="text-xs text-gray-400">Used: </span>
                        <span className="text-sm font-medium">{formatINR(Number(c.creditLine.usedAmount))}</span>
                        <span className="text-xs text-gray-500"> / {formatINR(Number(c.creditLine.limitAmount))}</span>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                  <td>
                    <Link href={`/admin/customers/${c.id}`} className="text-orange-400 hover:text-orange-300 text-sm">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / 20) > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-800">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost py-1 px-3 text-sm disabled:opacity-30">← Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === Math.ceil(total / 20)} className="btn-ghost py-1 px-3 text-sm disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
