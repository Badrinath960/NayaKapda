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
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Customers</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">{total} customers</p>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search by name or phone..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input py-2 px-4 text-xs w-72" />
      </div>

      <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="table-container border-0 rounded-none shadow-none">
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
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">No customers found</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-bold text-slate-900 text-xs">{c.name ?? 'Unknown'}</div>
                    {c.email && <div className="text-[10px] text-slate-500 font-medium">{c.email}</div>}
                  </td>
                  <td className="font-mono text-xs font-semibold text-slate-700">{c.phone}</td>
                  <td className="text-slate-700 text-xs font-semibold">{c._count.orders}</td>
                  <td className="font-bold text-slate-900 text-xs">{formatINR(c.totalOrderValue)}</td>
                  <td>
                    {c.creditLine ? (
                      <div className="text-xs">
                        <span className="text-slate-500 font-medium">Used: </span>
                        <span className="font-bold text-rose-600">{formatINR(Number(c.creditLine.usedAmount))}</span>
                        <span className="text-slate-400 font-medium"> / {formatINR(Number(c.creditLine.limitAmount))}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="text-slate-500 text-xs font-medium">{formatDate(c.createdAt)}</td>
                  <td>
                    <Link href={`/admin/customers/${c.id}`} className="text-orange-600 hover:underline text-xs font-bold">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / 20) > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-200">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-ghost py-1 px-3 text-xs font-bold disabled:opacity-30">← Prev</button>
            <span className="text-xs font-semibold text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === Math.ceil(total / 20)} className="btn-ghost py-1 px-3 text-xs font-bold disabled:opacity-30">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
