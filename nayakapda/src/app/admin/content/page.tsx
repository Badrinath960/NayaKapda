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
const INITIAL_SHIPPING = {
  name: '',
  description: '',
  etaText: '',
  cost: '',
  regionLimited: false,
  active: true,
};

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

  useEffect(() => {
    fetchData();
  }, []);

  const saveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editId ? 'PATCH' : 'POST';
    const url = editId ? `/api/admin/faq/${editId}` : '/api/admin/faq';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(faqForm),
    });
    setShowFAQForm(false);
    setEditId(null);
    setFaqForm(INITIAL_FAQ);
    setSaving(false);
    fetchData();
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
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...shippingForm, cost: parseFloat(shippingForm.cost) }),
    });
    setShowShippingForm(false);
    setEditId(null);
    setShippingForm(INITIAL_SHIPPING);
    setSaving(false);
    fetchData();
  };

  const toggleShipping = async (id: string, active: boolean) => {
    await fetch(`/api/admin/shipping-methods/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Content Management</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Manage store FAQs and shipping methods</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-200/80 p-1 rounded-xl w-fit border border-slate-300">
        {(['faq', 'shipping'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === t ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'faq' ? '❓ FAQs' : '🚚 Shipping Methods'}
          </button>
        ))}
      </div>

      {/* FAQ Tab */}
      {tab === 'faq' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <p className="text-slate-500 text-xs font-medium">{faqs.length} entries configured</p>
            <button
              onClick={() => {
                setShowFAQForm(!showFAQForm);
                setEditId(null);
                setFaqForm(INITIAL_FAQ);
              }}
              className="btn-primary py-2 px-4 text-xs font-bold self-start sm:self-auto cursor-pointer shadow-xs"
            >
              {showFAQForm ? '✕ Cancel' : '+ Add FAQ'}
            </button>
          </div>

          {showFAQForm && (
            <form onSubmit={saveFAQ} className="card p-5 bg-white border-slate-200 shadow-xs space-y-3 max-w-xl">
              <h3 className="font-bold text-slate-900 text-sm">{editId ? 'Edit FAQ' : 'New FAQ'}</h3>
              <input
                type="text"
                className="input text-xs w-full"
                placeholder="Question"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                required
              />
              <textarea
                className="input text-xs min-h-[100px] resize-none w-full"
                placeholder="Answer"
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                required
              />
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="input text-xs w-28"
                  placeholder="Sort"
                  value={faqForm.sortOrder}
                  onChange={(e) => setFaqForm({ ...faqForm, sortOrder: parseInt(e.target.value) || 0 })}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2 px-5 text-xs font-bold cursor-pointer"
                >
                  {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {loading ? (
              <p className="text-slate-400 text-xs font-medium">Loading FAQs...</p>
            ) : faqs.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium">No FAQs added yet.</p>
            ) : (
              faqs.map((faq) => (
                <div key={faq.id} className="card p-4 bg-white border-slate-200 shadow-xs">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900">{faq.question}</p>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setFaqForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder });
                          setEditId(faq.id);
                          setShowFAQForm(true);
                        }}
                        className="text-xs text-orange-600 hover:underline font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFAQ(faq.id)}
                        className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Shipping Tab */}
      {tab === 'shipping' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <p className="text-slate-500 text-xs font-medium">{shippingMethods.length} methods active</p>
            <button
              onClick={() => {
                setShowShippingForm(!showShippingForm);
                setEditId(null);
                setShippingForm(INITIAL_SHIPPING);
              }}
              className="btn-primary py-2 px-4 text-xs font-bold self-start sm:self-auto cursor-pointer shadow-xs"
            >
              {showShippingForm ? '✕ Cancel' : '+ Add Method'}
            </button>
          </div>

          {showShippingForm && (
            <form
              onSubmit={saveShipping}
              className="card p-5 bg-white border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl"
            >
              <div className="sm:col-span-2">
                <label className="label">Name *</label>
                <input
                  type="text"
                  className="input text-xs w-full"
                  placeholder="Standard Courier (Surface)"
                  value={shippingForm.name}
                  onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Cost (₹) *</label>
                <input
                  type="number"
                  className="input text-xs w-full"
                  placeholder="150"
                  value={shippingForm.cost}
                  onChange={(e) => setShippingForm({ ...shippingForm, cost: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">ETA Text</label>
                <input
                  type="text"
                  className="input text-xs w-full"
                  placeholder="3-5 business days"
                  value={shippingForm.etaText}
                  onChange={(e) => setShippingForm({ ...shippingForm, etaText: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <input
                  type="text"
                  className="input text-xs w-full"
                  placeholder="Optional description"
                  value={shippingForm.description}
                  onChange={(e) => setShippingForm({ ...shippingForm, description: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingForm.regionLimited}
                    onChange={(e) =>
                      setShippingForm({ ...shippingForm, regionLimited: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  Region Limited (Delhi / NCR Pincodes only)
                </label>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2 px-5 text-xs font-bold cursor-pointer"
                >
                  {saving ? 'Saving...' : editId ? 'Update Method' : 'Create Method'}
                </button>
              </div>
            </form>
          )}

          <div className="card overflow-hidden bg-white border-slate-200 shadow-xs">
            <div className="table-container rounded-none border-0 shadow-none overflow-x-auto">
              <table className="table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Cost</th>
                    <th>ETA</th>
                    <th>Region Limited</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 text-xs font-medium">
                        Loading shipping methods...
                      </td>
                    </tr>
                  ) : shippingMethods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 text-xs font-medium">
                        No shipping methods configured
                      </td>
                    </tr>
                  ) : (
                    shippingMethods.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="font-bold text-slate-900 text-xs">{m.name}</div>
                          {m.description && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{m.description}</div>
                          )}
                        </td>
                        <td className="font-bold text-slate-900 text-xs">₹{m.cost}</td>
                        <td className="text-slate-500 text-xs font-medium">{m.etaText ?? '—'}</td>
                        <td>
                          {m.regionLimited ? (
                            <span className="badge-orange text-[10px]">Yes</span>
                          ) : (
                            <span className="text-slate-400 text-xs">No</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => toggleShipping(m.id, m.active)}
                            className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                              m.active
                                ? 'badge-green hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                : 'badge-gray hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                            }`}
                          >
                            {m.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEditShipping(m)}
                              className="text-xs text-orange-600 hover:underline font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteShipping(m.id)}
                              className="text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
