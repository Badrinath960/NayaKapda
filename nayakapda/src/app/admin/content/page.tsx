'use client';

import { useState, useEffect } from 'react';

type FAQEntry = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  etaText: string | null;
  cost: number;
  regionLimited: boolean;
  active: boolean;
};

const INITIAL_FAQ = { question: '', answer: '', sortOrder: 0 };
const INITIAL_SHIPPING = { name: '', description: '', etaText: '', cost: '', regionLimited: false, active: true };

export default function AdminContentPage() {
  const [tab, setTab] = useState<'faq' | 'shipping'>('faq');
  const [faqs, setFaqs] = useState<FAQEntry[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [faqForm, setFaqForm] = useState(INITIAL_FAQ);
  const [shippingForm, setShippingForm] = useState(INITIAL_SHIPPING);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [faqRes, shRes] = await Promise.all([
      fetch('/api/admin/faq'),
      fetch('/api/admin/shipping-methods'),
    ]);
    const [faqData, shData] = await Promise.all([faqRes.json(), shRes.json()]);
    if (faqData.data) setFaqs(faqData.data);
    if (shData.data) setShippingMethods(shData.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editId ? 'PATCH' : 'POST';
    const url = editId ? `/api/admin/faq/${editId}` : '/api/admin/faq';
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(faqForm),
    });
    setShowFAQForm(false);
    setFaqForm(INITIAL_FAQ);
    setEditId(null);
    fetchData();
    setSaving(false);
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const saveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editId ? 'PATCH' : 'POST';
    const url = editId ? `/api/admin/shipping-methods/${editId}` : '/api/admin/shipping-methods';
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...shippingForm, cost: parseFloat(shippingForm.cost) }),
    });
    setShowShippingForm(false);
    setShippingForm(INITIAL_SHIPPING);
    setEditId(null);
    fetchData();
    setSaving(false);
  };

  const toggleShipping = async (id: string, active: boolean) => {
    await fetch(`/api/admin/shipping-methods/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    fetchData();
  };

  const startEditShipping = (m: ShippingMethod) => {
    setEditId(m.id);
    setShippingForm({
      name: m.name,
      description: m.description || '',
      etaText: m.etaText || '',
      cost: String(m.cost),
      regionLimited: m.regionLimited,
      active: m.active,
    });
    setShowShippingForm(true);
  };

  const deleteShipping = async (id: string) => {
    if (!confirm('Delete this shipping method?')) return;
    await fetch(`/api/admin/shipping-methods/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage FAQs and shipping methods</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 w-fit mb-6 border border-gray-800">
        {(['faq', 'shipping'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'faq' ? '❓ FAQs' : '🚚 Shipping Methods'}
          </button>
        ))}
      </div>

      {/* FAQ Tab */}
      {tab === 'faq' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-500 text-sm">{faqs.length} entries</p>
            <button onClick={() => { setShowFAQForm(!showFAQForm); setEditId(null); setFaqForm(INITIAL_FAQ); }}
              className="btn-primary py-2 px-4 text-sm">
              {showFAQForm ? '✕ Cancel' : '+ Add FAQ'}
            </button>
          </div>

          {showFAQForm && (
            <form onSubmit={saveFAQ} className="card p-5 mb-4 space-y-3">
              <input type="text" className="input" placeholder="Question" value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} required />
              <textarea className="input min-h-[100px] resize-none" placeholder="Answer"
                value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} required />
              <div className="flex items-center gap-3">
                <input type="number" className="input w-28" placeholder="Sort" value={faqForm.sortOrder}
                  onChange={(e) => setFaqForm({ ...faqForm, sortOrder: parseInt(e.target.value) })} />
                <button type="submit" disabled={saving} className="btn-primary py-2 px-5 text-sm">
                  {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {loading ? <p className="text-gray-500">Loading...</p> : faqs.length === 0 ? (
              <p className="text-gray-500 text-sm">No FAQs yet.</p>
            ) : faqs.map((faq) => (
              <div key={faq.id} className="card p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{faq.question}</p>
                    <p className="text-gray-500 text-sm mt-1">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setFaqForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder }); setEditId(faq.id); setShowFAQForm(true); }}
                      className="text-xs text-orange-400 hover:text-orange-300">Edit</button>
                    <button onClick={() => deleteFAQ(faq.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Tab */}
      {tab === 'shipping' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-500 text-sm">{shippingMethods.length} methods</p>
            <button onClick={() => { setShowShippingForm(!showShippingForm); setEditId(null); setShippingForm(INITIAL_SHIPPING); }}
              className="btn-primary py-2 px-4 text-sm">
              {showShippingForm ? '✕ Cancel' : '+ Add Method'}
            </button>
          </div>

          {showShippingForm && (
            <form onSubmit={saveShipping} className="card p-5 mb-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Name *</label>
                <input type="text" className="input" placeholder="Standard Delivery" value={shippingForm.name}
                  onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Cost (₹) *</label>
                <input type="number" className="input" placeholder="150" value={shippingForm.cost}
                  onChange={(e) => setShippingForm({ ...shippingForm, cost: e.target.value })} required />
              </div>
              <div>
                <label className="label">ETA Text</label>
                <input type="text" className="input" placeholder="3-5 business days" value={shippingForm.etaText}
                  onChange={(e) => setShippingForm({ ...shippingForm, etaText: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <input type="text" className="input" placeholder="Optional description" value={shippingForm.description}
                  onChange={(e) => setShippingForm({ ...shippingForm, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={shippingForm.regionLimited}
                    onChange={(e) => setShippingForm({ ...shippingForm, regionLimited: e.target.checked })} />
                  Region Limited
                </label>
              </div>
              <div className="col-span-2">
                <button type="submit" disabled={saving} className="btn-primary py-2 px-5 text-sm">
                  {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}

          <div className="card overflow-hidden">
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Cost</th><th>ETA</th><th>Region Limited</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400 text-xs font-medium">Loading...</td></tr>
                  ) : shippingMethods.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-400 text-xs font-medium">No methods</td></tr>
                  ) : shippingMethods.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="font-bold text-slate-900 text-xs">{m.name}</div>
                        {m.description && <div className="text-[10px] text-slate-500 font-medium mt-0.5">{m.description}</div>}
                      </td>
                      <td className="font-bold text-slate-900 text-xs">₹{m.cost}</td>
                      <td className="text-slate-500 text-xs font-medium">{m.etaText ?? '—'}</td>
                      <td>{m.regionLimited ? <span className="badge-orange">Yes</span> : <span className="text-slate-400 text-xs">No</span>}</td>
                      <td>
                        <button onClick={() => toggleShipping(m.id, m.active)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                            m.active ? 'badge-green hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' : 'badge-gray hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                          }`}>
                          {m.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => startEditShipping(m)}
                            className="text-xs text-orange-600 hover:underline font-bold cursor-pointer">Edit</button>
                          <button onClick={() => deleteShipping(m.id)}
                            className="text-xs text-rose-500 hover:underline font-bold cursor-pointer">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
