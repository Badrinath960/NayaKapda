'use client';

import { useState, useEffect } from 'react';
import { formatINR } from '@/lib/utils';

type DiscountCode = {
  id: string;
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minOrderQty: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
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
    try {
      const res = await fetch('/api/admin/discounts');
      if (!res.ok) {
        setDiscounts([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data?.data)) {
        setDiscounts(data.data);
      } else if (Array.isArray(data?.data?.discounts)) {
        setDiscounts(data.data.discounts);
      } else {
        setDiscounts([]);
      }
    } catch {
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          type: form.type,
          value: parseFloat(form.value),
          minOrderQty: form.minOrderQty ? parseInt(form.minOrderQty) : null,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.errors?.[0]?.message || 'Failed to create discount code');
        return;
      }
      setForm(INITIAL_FORM);
      setShowForm(false);
      fetchDiscounts();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const list = discounts ?? [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Discount Codes</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Manage promo codes and percentage offers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary py-2 px-4 text-xs font-bold shadow-sm"
        >
          {showForm ? 'Cancel' : '+ Create Code'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 bg-white border-slate-200 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-slate-900">New Discount Code</h3>
          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Code Name</label>
              <input
                type="text"
                required
                placeholder="e.g. WELCOME10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="input py-2 px-3 text-xs uppercase"
              />
            </div>
            <div>
              <label className="label">Discount Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="input py-2 px-3 text-xs"
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Flat Rupee (₹)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Value</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder={form.type === 'PERCENT' ? '10 (%)' : '100 (₹)'}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="input py-2 px-3 text-xs"
              />
            </div>
            <div>
              <label className="label">Min Qty (Pcs)</label>
              <input
                type="number"
                placeholder="Optional"
                value={form.minOrderQty}
                onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })}
                className="input py-2 px-3 text-xs"
              />
            </div>
            <div>
              <label className="label">Max Uses</label>
              <input
                type="number"
                placeholder="Optional"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="input py-2 px-3 text-xs"
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary py-2 px-5 text-xs font-bold">
            {saving ? 'Creating...' : 'Save Discount Code'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="table-container border-0 rounded-none shadow-none">
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
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">
                    Loading discounts...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">
                    No discount codes created yet
                  </td>
                </tr>
              ) : (
                list.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-mono font-bold text-orange-600 text-xs">{d.code}</span>
                    </td>
                    <td>
                      <span className="badge-gray text-xs">{d.type}</span>
                    </td>
                    <td className="font-bold text-slate-900 text-xs">
                      {d.type === 'PERCENT' ? `${d.value}%` : formatINR(d.value)}
                    </td>
                    <td className="text-xs text-slate-700 font-semibold">
                      {d.usedCount}
                      {d.maxUses ? ` / ${d.maxUses}` : ' / ∞'}
                    </td>
                    <td className="text-slate-500 text-xs font-medium">{d.minOrderQty ?? '—'}</td>
                    <td className="text-slate-500 text-xs font-medium">
                      {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <span className={d.active ? 'badge-green text-xs' : 'badge-red text-xs'}>
                        {d.active ? 'Active' : 'Disabled'}
                      </span>
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
