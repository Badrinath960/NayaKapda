'use client';

import { useState, useEffect } from 'react';
import { formatINR, formatDate } from '@/lib/utils';

type DiscountCode = {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  minOrderQty: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
};

const INITIAL_FORM = { code: '', type: 'PERCENT', value: '', minOrderQty: '', maxUses: '', expiresAt: '' };

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscounts = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/discounts');
    const data = await res.json();
    if (data.data) setDiscounts(data.data.discounts);
    setLoading(false);
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minOrderQty: form.minOrderQty ? parseInt(form.minOrderQty) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? 'Failed to create code'); }
    else { setShowForm(false); setForm(INITIAL_FORM); fetchDiscounts(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/discounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    });
    fetchDiscounts();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Discount Codes</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-4 text-sm">
          {showForm ? '✕ Cancel' : '+ New Code'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 grid grid-cols-2 gap-4">
          <h3 className="col-span-2 font-semibold mb-2">Create Discount Code</h3>
          <div>
            <label className="label">Code *</label>
            <input type="text" className="input" placeholder="SUMMER20" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="PERCENT">Percent (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label className="label">Value *</label>
            <input type="number" className="input" placeholder={form.type === 'PERCENT' ? '10' : '500'} value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })} required min={0} />
          </div>
          <div>
            <label className="label">Min Order Qty</label>
            <input type="number" className="input" placeholder="Optional" value={form.minOrderQty}
              onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })} min={0} />
          </div>
          <div>
            <label className="label">Max Uses</label>
            <input type="number" className="input" placeholder="Unlimited if empty" value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })} min={1} />
          </div>
          <div>
            <label className="label">Expires At</label>
            <input type="datetime-local" className="input" value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          {error && <div className="col-span-2 text-red-400 text-sm px-3 py-2 bg-red-500/10 rounded-lg">{error}</div>}
          <div className="col-span-2">
            <button type="submit" disabled={saving} className="btn-primary py-2 px-6">
              {saving ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Uses</th>
                <th>Min Qty</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : discounts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No discount codes</td></tr>
              ) : discounts.map((d) => (
                <tr key={d.id}>
                  <td><span className="font-mono font-bold text-orange-400">{d.code}</span></td>
                  <td><span className="badge-gray text-xs">{d.type}</span></td>
                  <td className="font-medium">
                    {d.type === 'PERCENT' ? `${d.value}%` : formatINR(d.value)}
                  </td>
                  <td className="text-sm">
                    {d.usedCount}{d.maxUses ? ` / ${d.maxUses}` : ' / ∞'}
                  </td>
                  <td className="text-gray-400 text-sm">{d.minOrderQty ?? '—'}</td>
                  <td className="text-gray-400 text-xs">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(d.id, d.active)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        d.active
                          ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                          : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-green-500/10 hover:text-green-400'
                      }`}
                    >
                      {d.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
