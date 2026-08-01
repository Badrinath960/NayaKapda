'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

type CartItem = {
  id: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  variant: { id: string; size: string; color: string; sku: string; stockQty: number; product: { name: string; slug: string; photo: { url: string } | null; qtyMultiple: number } };
};

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { guestItems, removeGuestItem, updateGuestQty, setItemCount } = useCartStore();

  const [dbItems, setDbItems] = useState<CartItem[]>([]);
  const [dbSubtotal, setDbSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    const res = await fetch('/api/cart');
    const data = await res.json();
    if (data.data) {
      setDbItems(data.data.items);
      setDbSubtotal(data.data.subtotal);
      setItemCount(data.data.items.reduce((s: number, i: CartItem) => s + i.qty, 0));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false);
    } else if (status === 'authenticated') {
      fetchCart();
    }
  }, [status]);

  const items = status === 'authenticated'
    ? dbItems
    : guestItems.map(gi => ({
        id: gi.variantId,
        qty: gi.qty,
        unitPrice: gi.unitPrice,
        subtotal: gi.qty * gi.unitPrice,
        variant: gi.variant
      }));

  const subtotal = status === 'authenticated'
    ? dbSubtotal
    : guestItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);

  const removeItem = async (id: string) => {
    if (status === 'authenticated') {
      await fetch(`/api/cart/item/${id}`, { method: 'DELETE' });
      fetchCart();
    } else {
      removeGuestItem(id);
    }
  };

  const updateQty = async (id: string, qty: number, multiple: number) => {
    if (qty % multiple !== 0) return;
    if (status === 'authenticated') {
      await fetch(`/api/cart/item/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      });
      fetchCart();
    } else {
      updateGuestQty(id, qty);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-slate-500 font-medium text-sm flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            Loading cart...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container py-10">
          <h1 className="text-3xl font-black mb-8 text-slate-900">Your Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-20 card bg-white border-slate-200 p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-bold mb-2 text-slate-900">Your cart is empty</h2>
              <p className="text-slate-500 text-xs mb-8">Browse our products and add items to order.</p>
              <Link href="/products" className="btn-primary">Browse Products</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="card p-5 flex gap-4 bg-white border-slate-200 shadow-sm">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.variant.product.photo ? (
                        <img src={item.variant.product.photo.url} alt={item.variant.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">👕</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={`/products/${item.variant.product.slug}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors text-base">
                            {item.variant.product.name}
                          </Link>
                          <p className="text-xs text-slate-500 mt-1 font-medium">
                            {item.variant.size} / {item.variant.color} • SKU: {item.variant.sku}
                          </p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-rose-600 transition-colors flex-shrink-0 p-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, item.qty - item.variant.product.qtyMultiple, item.variant.product.qtyMultiple)}
                            disabled={item.qty <= item.variant.product.qtyMultiple}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold disabled:opacity-30 flex items-center justify-center transition-colors text-sm"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-bold text-slate-900 text-sm">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + item.variant.product.qtyMultiple, item.variant.product.qtyMultiple)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors text-sm"
                          >
                            +
                          </button>
                          <span className="text-xs text-slate-500 font-medium">× {item.variant.product.qtyMultiple}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 font-medium">{formatINR(item.unitPrice)}/pc</p>
                          <p className="font-black text-orange-600 text-lg">{formatINR(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <div className="card p-6 sticky top-24 space-y-4 bg-white border-slate-200 shadow-sm">
                  <h2 className="font-bold text-lg text-slate-900">Order Summary</h2>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} pcs)</span>
                      <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Shipping</span>
                      <span className="text-emerald-600 font-semibold">Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex justify-between font-bold text-lg text-slate-900">
                    <span>Total</span>
                    <span className="text-orange-600 font-black">{formatINR(subtotal)}</span>
                  </div>

                  <Link
                    href={status === 'authenticated' ? '/checkout' : '/login?redirect=/checkout'}
                    className="btn-primary w-full py-3 text-center text-sm font-bold shadow-md"
                  >
                    Proceed to Checkout →
                  </Link>

                  <Link href="/products" className="btn-ghost w-full py-2 text-center text-xs font-semibold text-slate-600">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
