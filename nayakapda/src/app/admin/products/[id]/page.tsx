'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';

type Variant = {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stockQty: number;
  active: boolean;
  _delete?: boolean; // mark for deletion
};

type PricingTier = {
  id?: string;
  minQty: number;
  maxQty: number | null;
  pricePerPiece: number;
};

type ProductPhoto = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  publicId: string | null;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
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

  // Photos
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Temp inputs for adding
  const [newVar, setNewVar] = useState({ size: 'M', color: 'Black', sku: '', stockQty: '100', active: true });
  const [newTier, setNewTier] = useState({ minQty: '', maxQty: '', pricePerPiece: '' });

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch(`/api/admin/products/${id}`),
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
        setPhotos(p.photos || []);
      }
    } catch (err) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Clear success message after 3s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

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

  const handleRemoveVariant = (index: number) => {
    const copy = [...variants];
    if (copy[index].id) {
      // Existing variant: mark for deletion
      copy[index] = { ...copy[index], _delete: true };
    } else {
      // New unsaved variant: just remove from array
      copy.splice(index, 1);
    }
    setVariants(copy);
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

    // Build variant payload — exclude _delete items as "deletions" if they have an id
    const activeVariants = variants.filter(v => !v._delete);
    const deletedVariantIds = variants.filter(v => v._delete && v.id).map(v => v.id!);

    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      description: form.description,
      gsm: form.gsm ? parseInt(form.gsm) : null,
      fabricComposition: form.fabricComposition,
      basePrice: parseFloat(form.basePrice) || 0,
      active: form.active,
      variants: activeVariants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        size: v.size,
        color: v.color,
        sku: v.sku,
        stockQty: Number(v.stockQty) || 0,
        active: v.active !== false,
      })),
      deletedVariantIds,
      pricingTiers: tiers.map((t) => ({
        minQty: Number(t.minQty),
        maxQty: t.maxQty ? Number(t.maxQty) : null,
        pricePerPiece: Number(t.pricePerPiece),
      })),
    };

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || (data.errors ? JSON.stringify(data.errors) : 'Failed to update product'));
      } else {
        setSuccess('Product saved successfully ✓');
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
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/products');
      } else {
        setError('Failed to delete product');
      }
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  // ─── Photo Upload ─────────────────────────────────────────────────────────

  const uploadPhoto = async (file: File) => {
    setUploadingPhoto(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', form.name || 'Product image');

    try {
      const res = await fetch(`/api/admin/products/${id}/photos`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.message || 'Upload failed');
      } else {
        setPhotos(prev => [...prev, data.data]);
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadPhoto(file);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      } else {
        setUploadError('Failed to delete photo');
      }
    } catch {
      setUploadError('Failed to delete photo');
    }
  };

  const handleUpdateAltText = async (photoId: string, altText: string) => {
    await fetch(`/api/admin/products/${id}/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ altText }),
    });
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, altText } : p));
  };

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-slate-500">
      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold">Loading Product...</span>
    </div>
  );

  const visibleVariants = variants.filter(v => !v._delete);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <Link
            href="/admin/products"
            className="text-slate-500 text-xs font-semibold hover:text-slate-900 mb-1.5 flex items-center gap-1"
          >
            ← Back to Products
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Edit: {form.name}</h1>
        </div>
        <button
          onClick={handleDelete}
          className="py-2 px-4 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors self-start sm:self-auto cursor-pointer"
        >
          🗑 Delete Product
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Basic details + Variants + Images */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* ─── Basic Info ─────────────────────────────────────── */}
          <form onSubmit={handleSave} className="card p-5 sm:p-6 space-y-4 bg-white border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Basic Info</h3>

            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                className="input text-sm w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="label">Category *</label>
                <select
                  className="input text-sm w-full"
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
                  className="input text-sm w-full"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                  required
                  min={0}
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="label">GSM (Weight)</label>
                <input
                  type="number"
                  className="input text-sm w-full"
                  value={form.gsm}
                  onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                  min={0}
                />
              </div>
              <div>
                <label className="label">Fabric Composition</label>
                <input
                  type="text"
                  className="input text-sm w-full"
                  value={form.fabricComposition}
                  onChange={(e) => setForm({ ...form, fabricComposition: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input text-sm min-h-[100px] resize-none w-full"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-xs font-semibold text-slate-700">Active in Catalog</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
            >
              {saving ? 'Saving Details...' : 'Save Product Details'}
            </button>
          </form>

          {/* ─── Variants ───────────────────────────────────────── */}
          <div className="card p-5 sm:p-6 space-y-4 bg-white border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Variants (SKUs) <span className="text-slate-400 font-normal">({visibleVariants.length})</span>
            </h3>

            <div className="table-container border-slate-200 overflow-x-auto">
              <table className="table min-w-[500px]">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleVariants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                        No variants yet. Add one below.
                      </td>
                    </tr>
                  ) : (
                    variants.map((v, i) => {
                      if (v._delete) return null;
                      return (
                        <tr key={v.id || v.sku}>
                          <td className="font-mono text-xs text-slate-700">{v.sku}</td>
                          <td className="text-xs font-medium text-slate-600">{v.size}</td>
                          <td className="text-xs font-medium text-slate-600">{v.color}</td>
                          <td>
                            <input
                              type="number"
                              value={v.stockQty}
                              onChange={(e) => {
                                const copy = [...variants];
                                copy[i].stockQty = parseInt(e.target.value) || 0;
                                setVariants(copy);
                              }}
                              className="w-20 border border-slate-200 rounded-lg text-xs px-2 py-1 text-center font-semibold text-slate-800 focus:outline-none focus:border-orange-400"
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
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                                v.active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {v.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(i)}
                              className="text-rose-400 hover:text-rose-600 text-xs font-bold px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Add Variant */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Size</label>
                <select
                  className="input text-xs py-1.5 w-full"
                  value={newVar.size}
                  onChange={(e) => setNewVar({ ...newVar, size: e.target.value })}
                >
                  {['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Color</label>
                <input
                  type="text"
                  placeholder="Black"
                  className="input text-xs py-1.5 w-full"
                  value={newVar.color}
                  onChange={(e) => setNewVar({ ...newVar, color: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">SKU *</label>
                <input
                  type="text"
                  placeholder="HOD-BLK-M"
                  className="input text-xs py-1.5 w-full"
                  value={newVar.sku}
                  onChange={(e) => setNewVar({ ...newVar, sku: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="btn-secondary py-1.5 text-xs font-bold w-full cursor-pointer"
              >
                + Add
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Changes to variants are saved when you click "Save Product Details" above.
            </p>
          </div>

          {/* ─── Product Images ──────────────────────────────────── */}
          <div className="card p-5 sm:p-6 space-y-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Product Images
                <span className="text-slate-400 font-normal ml-1">({photos.length}/8)</span>
              </h3>
              {photos.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="btn-primary py-1.5 px-3 sm:px-4 text-xs font-bold cursor-pointer"
                >
                  {uploadingPhoto ? '⏳ Uploading...' : '+ Upload Photo'}
                </button>
              )}
            </div>

            {uploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                {uploadError}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Drag-and-Drop Zone */}
            {photos.length < 8 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-slate-300 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/50'
                }`}
              >
                {uploadingPhoto ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Uploading to Cloudinary...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-xs font-bold text-slate-600">Drag & drop image here</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      or tap to browse • JPEG, PNG, WebP • Max 5 MB
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={photo.url}
                        alt={photo.altText || 'Product image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* Delete overlay */}
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        title="Delete photo"
                      >
                        ✕
                      </button>
                    </div>
                    {/* Alt text input */}
                    <div className="p-1.5">
                      <input
                        type="text"
                        value={photo.altText || ''}
                        placeholder="Alt text..."
                        className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-orange-400 bg-white"
                        onBlur={(e) => {
                          if (e.target.value !== photo.altText) {
                            handleUpdateAltText(photo.id, e.target.value);
                          }
                        }}
                        onChange={(e) => {
                          setPhotos((prev) =>
                            prev.map((p) =>
                              p.id === photo.id ? { ...p, altText: e.target.value } : p
                            )
                          );
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && !uploadingPhoto && (
              <p className="text-center text-xs text-slate-400 font-medium py-2">
                No images uploaded yet. Add up to 8 product photos.
              </p>
            )}

            {photos.length >= 8 && (
              <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-semibold">
                ⚠️ Maximum 8 photos reached. Delete a photo to upload a new one.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Tiers */}
        <div className="card p-5 sm:p-6 space-y-4 bg-white border-slate-200 shadow-xs h-fit lg:sticky lg:top-6">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Wholesale Pricing Tiers
          </h3>

          <div className="space-y-2">
            {tiers.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium">
                No tiers set. Using base price for all quantities.
              </p>
            ) : (
              tiers.map((t, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-xs p-3 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <div>
                    <span className="font-bold text-orange-600">
                      {t.minQty}
                      {t.maxQty ? ` – ${t.maxQty}` : '+'} pcs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{formatINR(t.pricePerPiece)}</span>
                    <button
                      type="button"
                      onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                      className="text-rose-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold uppercase text-orange-600">Add Tier</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  Min Qty *
                </label>
                <input
                  type="number"
                  placeholder="50"
                  className="input text-xs py-1.5 w-full"
                  value={newTier.minQty}
                  onChange={(e) => setNewTier({ ...newTier, minQty: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  Max (blank=∞)
                </label>
                <input
                  type="number"
                  placeholder="100"
                  className="input text-xs py-1.5 w-full"
                  value={newTier.maxQty}
                  onChange={(e) => setNewTier({ ...newTier, maxQty: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                Price/Piece (₹) *
              </label>
              <input
                type="number"
                placeholder="280"
                className="input text-xs py-1.5 w-full"
                value={newTier.pricePerPiece}
                onChange={(e) => setNewTier({ ...newTier, pricePerPiece: e.target.value })}
                step="0.01"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTier}
              className="btn-secondary w-full py-1.5 text-xs font-bold cursor-pointer"
            >
              + Add Tier
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Tiers are saved when you click "Save Product Details".
          </p>
        </div>
      </div>
    </div>
  );
}
