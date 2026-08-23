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
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) {
        setCustomers([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      if (data?.data) {
        setCustomers(data.data.customers ?? []);
        setTotal(data.data.total ?? 0);
      }
    } catch {
      setCustomers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Customers</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">
          {total} customer{total !== 1 ? 's' : ''} registered
        </p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input py-2 px-3 text-xs w-full sm:w-80"
        />
      </div>

      <div className="card overflow-hidden bg-white border-slate-200 shadow-xs">
        <div className="table-container border-0 rounded-none shadow-none overflow-x-auto">
          <table className="table min-w-[700px]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Credit Line</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{c.name ?? 'Unregistered Guest'}</p>
                        {c.email && <p className="text-[10px] text-slate-500 font-medium">{c.email}</p>}
                      </div>
                    </td>
                    <td className="font-mono text-xs font-semibold text-slate-700">{c.phone}</td>
                    <td>
                      <span className="badge-blue text-xs font-semibold">{c._count?.orders ?? 0} orders</span>
                    </td>
                    <td className="font-bold text-emerald-600 text-xs">{formatINR(c.totalOrderValue)}</td>
                    <td>
                      {c.creditLine ? (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-700">
                            {formatINR(c.creditLine.usedAmount)} / {formatINR(c.creditLine.limitAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">—</span>
                      )}
                    </td>
                    <td className="text-slate-500 text-xs font-medium">{formatDate(c.createdAt)}</td>
                    <td>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="btn-ghost py-1 px-3 text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
