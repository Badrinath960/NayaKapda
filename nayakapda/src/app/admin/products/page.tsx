'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';

type Product = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  basePrice: number;
  gsm: number | null;
  category: { name: string };
  _count: { variants: number; photos: number };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) {
        setProducts([]);
        setTotal(0);
        return;
      }
      const data = await res.json();
      if (data?.data) {
        setProducts(data.data.products ?? []);
        setTotal(data.data.total ?? 0);
      }
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    });
    fetchProducts();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Products Catalog</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">{total} products configured</p>
        </div>
        <Link
          href="/admin/products/new"
          className="btn-primary py-2 px-4 text-xs font-bold shadow-md self-start sm:self-auto cursor-pointer"
        >
          + Add Product
        </Link>
      </div>

      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search products by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input py-2 px-3 text-xs w-full sm:w-72"
        />
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden bg-white border-slate-200 shadow-xs">
        <div className="table-container rounded-none border-0 shadow-none overflow-x-auto">
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Variants</th>
                <th>Photos</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                      {p.gsm && <div className="text-[10px] text-slate-500 font-medium">{p.gsm} GSM</div>}
                    </td>
                    <td className="text-slate-600 text-xs font-medium">{p.category.name}</td>
                    <td className="font-bold text-slate-900 text-xs">{formatINR(p.basePrice)}</td>
                    <td className="text-slate-700 text-xs font-semibold">{p._count.variants}</td>
                    <td className="text-slate-700 text-xs font-semibold">{p._count.photos}</td>
                    <td>
                      <button
                        onClick={() => toggleActive(p.id, p.active)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                          p.active
                            ? 'badge-green hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            : 'badge-gray hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                        }`}
                      >
                        {p.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="text-orange-600 hover:underline text-xs font-bold"
                        >
                          Edit →
                        </Link>
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="text-slate-400 hover:text-slate-700 text-xs font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {Math.ceil(total / 20) > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-200">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="btn-ghost py-1 px-3 text-xs font-bold disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === Math.ceil(total / 20)}
              className="btn-ghost py-1 px-3 text-xs font-bold disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
