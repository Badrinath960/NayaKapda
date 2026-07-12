'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Category = {
  id: string;
  name: string;
};

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    gsm: '',
    fabricComposition: '',
    basePrice: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.data) {
        setCategories(data.data);
        if (data.data.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: data.data[0].id }));
        }
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      gsm: form.gsm ? parseInt(form.gsm) : null,
      basePrice: parseFloat(form.basePrice),
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to create product');
      } else {
        router.push(`/admin/products/${data.data.id}`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/products" className="text-gray-500 text-sm hover:text-white mb-2 flex items-center gap-1">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
        <p className="text-gray-500 text-sm mt-1">Set up a base wholesale catalog item</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Product Name *</label>
          <input
            type="text"
            className="input"
            placeholder="Plain Premium Cotton Hoodie"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">Category *</label>
          <select
            className="input"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Base Price (₹) *</label>
          <input
            type="number"
            className="input"
            placeholder="350"
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            required
            min={0}
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">GSM (Weight)</label>
            <input
              type="number"
              className="input"
              placeholder="320"
              value={form.gsm}
              onChange={(e) => setForm({ ...form, gsm: e.target.value })}
              min={0}
            />
          </div>
          <div>
            <label className="label">Fabric Composition</label>
            <input
              type="text"
              className="input"
              placeholder="100% Cotton / 80-20 Blend"
              value={form.fabricComposition}
              onChange={(e) => setForm({ ...form, fabricComposition: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px] resize-none"
            placeholder="Describe the fabric quality, styling, stitching, fit..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Creating...' : 'Create Product & Continue to Details'}
        </button>
      </form>
    </div>
  );
}
