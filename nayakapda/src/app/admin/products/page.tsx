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
  const [showCreate, setShowCreate] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    if (data.data) { setProducts(data.data.products); setTotal(data.data.total); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    });
    fetchProducts();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{total} products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary py-2 px-4 text-sm">
          + Add Product
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input py-2 px-4 text-sm w-72"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
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
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium">{p.name}</div>
                    {p.gsm && <div className="text-xs text-gray-500">{p.gsm} GSM</div>}
                  </td>
                  <td className="text-gray-400 text-sm">{p.category.name}</td>
                  <td className="font-medium">{formatINR(p.basePrice)}</td>
                  <td>{p._count.variants}</td>
                  <td>{p._count.photos}</td>
                  <td>
                    <button
                      onClick={() => toggleActive(p.id, p.active)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        p.active
                          ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                          : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
                      }`}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/products/${p.id}`} className="text-orange-400 hover:text-orange-300 text-sm">
                        Edit →
                      </Link>
                      <Link href={`/products/${p.slug}`} target="_blank" className="text-gray-500 hover:text-gray-400 text-xs">
                        View
                      </Link>
                    </div>
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
