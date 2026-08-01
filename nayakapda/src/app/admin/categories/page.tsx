'use client';

import { useEffect, useState, useCallback } from 'react';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  qtyMultiple: number;
  sortOrder: number;
  active: boolean;
  _count?: { products: number };
};

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', qtyMultiple: 10, sortOrder: 0, active: true,
  });

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch {
      showToast('Failed to load categories', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', qtyMultiple: 10, sortOrder: 0, active: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editId;
    const url = isEdit ? `/api/admin/categories/${editId}` : '/api/admin/categories';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          qtyMultiple: Number(form.qtyMultiple),
          sortOrder: Number(form.sortOrder),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isEdit ? 'Category updated' : 'Category created');
        resetForm();
        fetchCategories();
      } else {
        showToast(data.message || 'Operation failed', 'err');
      }
    } catch {
      showToast('Network error', 'err');
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !cat.active }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${cat.name} ${!cat.active ? 'enabled' : 'disabled'}`);
        fetchCategories();
      } else {
        showToast(data.message || 'Toggle failed', 'err');
      }
    } catch {
      showToast('Network error', 'err');
    }
  };

  const deleteCategory = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Category deleted');
        fetchCategories();
      } else {
        showToast(data.message || 'Delete failed', 'err');
      }
    } catch {
      showToast('Network error', 'err');
    }
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      qtyMultiple: cat.qtyMultiple,
      sortOrder: cat.sortOrder,
      active: cat.active,
    });
    setShowForm(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-bold shadow-lg ${
            toast.type === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Product Categories</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            {categories.length} categories • {categories.filter(c => c.active).length} active
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="btn-primary py-2 px-4 text-xs font-bold shadow-md"
        >
          {showForm ? '✕ Cancel' : '+ Add Category'}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 bg-white border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">
            {editId ? 'Edit Category' : 'New Category'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input text-xs"
                value={form.name}
                onChange={e => {
                  const name = e.target.value;
                  setForm(f => ({ ...f, name, slug: editId ? f.slug : generateSlug(name) }));
                }}
                required
              />
            </div>
            <div>
              <label className="label">Slug *</label>
              <input
                className="input text-xs"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                pattern="^[a-z0-9-]+$"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input
                className="input text-xs"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Min Order Multiple *</label>
              <input
                className="input text-xs"
                type="number"
                min={1}
                value={form.qtyMultiple}
                onChange={e => setForm(f => ({ ...f, qtyMultiple: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input
                className="input text-xs"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary py-2 px-4 text-xs font-bold shadow-md">
              {editId ? 'Save Changes' : 'Create Category'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary py-2 px-4 text-xs font-bold">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs font-medium">Loading categories...</div>
      ) : (
        <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Min Multiple</th>
                  <th>Products</th>
                  <th>Sort</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} className={cat.active ? '' : 'opacity-50'}>
                    <td className="font-bold text-slate-900 text-xs">{cat.name}</td>
                    <td>
                      <code className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm border border-slate-200">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="text-slate-700 text-xs font-semibold">×{cat.qtyMultiple}</td>
                    <td className="text-slate-700 text-xs font-semibold">{cat._count?.products ?? '—'}</td>
                    <td className="text-slate-500 text-xs font-medium">{cat.sortOrder}</td>
                    <td>
                      <button
                        onClick={() => toggleActive(cat)}
                        className={`cursor-pointer border-0 bg-transparent p-0 ${cat.active ? 'badge-green' : 'badge-red'}`}
                        title={`Click to ${cat.active ? 'disable' : 'enable'}`}
                      >
                        {cat.active ? '● Active' : '○ Disabled'}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(cat)}
                          className="btn-secondary py-1 px-2.5 text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(cat)}
                          className="py-1 px-2.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
