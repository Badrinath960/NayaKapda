'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';

type Variant = {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stockQty: number;
  active: boolean;
};

type PricingTier = {
  id?: string;
  minQty: number;
  maxQty: number | null;
  pricePerPiece: number;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    gsm: '',
    fabricComposition: '',
    basePrice: '',
    active: true,
  });

  // Variants & Tiers
  const [variants, setVariants] = useState<Variant[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);

  // Temp inputs for adding
  const [newVar, setNewVar] = useState({ size: 'M', color: 'Black', sku: '', stockQty: '100', active: true });
  const [newTier, setNewTier] = useState({ minQty: '', maxQty: '', pricePerPiece: '' });

  const loadData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch(`/api/admin/products/${params.id}`),
      ]);
      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (catData.data) setCategories(catData.data);
      if (prodData.data) {
        const p = prodData.data;
        setForm({
          name: p.name,
          categoryId: p.categoryId,
          description: p.description ?? '',
          gsm: p.gsm ? String(p.gsm) : '',
          fabricComposition: p.fabricComposition ?? '',
          basePrice: String(p.basePrice),
          active: p.active,
        });
        setVariants(p.variants || []);
        setTiers(p.pricingTiers || []);
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddVariant = () => {
    if (!newVar.sku.trim()) return;
    setVariants([...variants, {
      size: newVar.size,
      color: newVar.color,
      sku: newVar.sku.toUpperCase(),
      stockQty: parseInt(newVar.stockQty) || 0,
      active: newVar.active,
    }]);
    setNewVar({ ...newVar, sku: '' });
  };

  const handleAddTier = () => {
    if (!newTier.minQty || !newTier.pricePerPiece) return;
    const min = parseInt(newTier.minQty);
    const max = newTier.maxQty ? parseInt(newTier.maxQty) : null;
    const price = parseFloat(newTier.pricePerPiece);

    setTiers([...tiers, { minQty: min, maxQty: max, pricePerPiece: price }].sort((a, b) => a.minQty - b.minQty));
    setNewTier({ minQty: '', maxQty: '', pricePerPiece: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      gsm: form.gsm ? parseInt(form.gsm) : null,
      basePrice: parseFloat(form.basePrice),
      variants,
      pricingTiers: tiers,
    };

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to update product');
      } else {
        setSuccess('Product details saved successfully');
        loadData();
      }
    } catch (err) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action is permanent.')) return;
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/products');
      } else {
        setError('Failed to delete product');
      }
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading Product Details...</div>;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/products" className="text-gray-500 text-sm hover:text-white mb-2 flex items-center gap-1">
            ← Back to Products
          </Link>
          <h1 className="text-2xl font-bold">Edit Product: {form.name}</h1>
        </div>
        <button onClick={handleDelete} className="btn-secondary hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-xs py-2 px-4 border border-gray-800 rounded-xl">
          🗑 Delete Product
        </button>
      </div>

      {success && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm">{success}</div>}
      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic details */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="card p-6 space-y-4">
            <h3 className="font-bold border-b border-gray-900 pb-2">Basic Info</h3>
            <div>
              <label className="label">Name *</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Base Price (₹) *</label>
                <input type="number" className="input" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} required min={0} step="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">GSM</label>
                <input type="number" className="input" value={form.gsm} onChange={(e) => setForm({ ...form, gsm: e.target.value })} min={0} />
              </div>
              <div>
                <label className="label">Fabric Composition</label>
                <input type="text" className="input" value={form.fabricComposition} onChange={(e) => setForm({ ...form, fabricComposition: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[100px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <span className="text-sm font-semibold">Active in Catalog</span>
              </label>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
              {saving ? 'Saving...' : 'Save Product Details'}
            </button>
          </form>

          {/* Variants section */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold border-b border-gray-900 pb-2">Variants (SKUs)</h3>

            {/* Existing Variants Table */}
            <div className="table-container border-gray-800">
              <table className="table">
                <thead>
                  <tr><th>SKU</th><th>Size</th><th>Color</th><th>Stock</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={v.id || v.sku}>
                      <td className="font-mono text-xs">{v.sku}</td>
                      <td>{v.size}</td>
                      <td>{v.color}</td>
                      <td>
                        <input
                          type="number"
                          value={v.stockQty}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 0;
                            const copy = [...variants];
                            copy[i].stockQty = newQty;
                            setVariants(copy);
                          }}
                          className="w-20 bg-gray-950 border border-gray-800 text-sm px-2 py-1 rounded text-white font-semibold text-center"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...variants];
                            copy[i].active = !v.active;
                            setVariants(copy);
                          }}
                          className={`text-xs px-2 py-0.5 border rounded-full ${v.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                        >
                          {v.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Add Variant Form */}
            <div className="glass p-4 rounded-xl grid grid-cols-5 gap-2 items-end">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase">Size</label>
                <select className="input text-xs py-1" value={newVar.size} onChange={(e) => setNewVar({ ...newVar, size: e.target.value })}>
                  {['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase">Color</label>
                <input type="text" className="input text-xs py-1" value={newVar.color} onChange={(e) => setNewVar({ ...newVar, color: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 font-bold uppercase">SKU *</label>
                <input type="text" placeholder="e.g. HOD-BLK-M" className="input text-xs py-1" value={newVar.sku} onChange={(e) => setNewVar({ ...newVar, sku: e.target.value })} />
              </div>
              <button type="button" onClick={handleAddVariant} className="btn-secondary py-1 text-xs">Add SKU</button>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Tiers */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold border-b border-gray-900 pb-2">Wholesale Pricing Tiers</h3>

          <div className="space-y-2">
            {tiers.length === 0 ? (
              <p className="text-gray-500 text-sm">No discount tiers. Using base catalog price.</p>
            ) : (
              tiers.map((t, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-3 border border-gray-900 rounded-xl bg-gray-900/40">
                  <div>
                    <span className="font-semibold text-orange-400">{t.minQty}{t.maxQty ? ` – ${t.maxQty}` : '+'} pieces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatINR(t.pricePerPiece)}</span>
                    <button type="button" onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))} className="text-red-400 text-xs">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="glass p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase text-orange-400">Add Pricing Tier</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Min Qty *</label>
                <input type="number" placeholder="50" className="input text-xs py-1" value={newTier.minQty} onChange={(e) => setNewTier({ ...newTier, minQty: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Max Qty (Or empty)</label>
                <input type="number" placeholder="100" className="input text-xs py-1" value={newTier.maxQty} onChange={(e) => setNewTier({ ...newTier, maxQty: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Price Per Piece (₹) *</label>
              <input type="number" placeholder="280" className="input text-xs py-1" value={newTier.pricePerPiece} onChange={(e) => setNewTier({ ...newTier, pricePerPiece: e.target.value })} step="0.01" />
            </div>
            <button type="button" onClick={handleAddTier} className="btn-secondary w-full py-1 text-xs">Add Tier</button>
          </div>
        </div>
      </div>
    </div>
  );
}
