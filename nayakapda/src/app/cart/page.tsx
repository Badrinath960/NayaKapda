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
  const { setItemCount } = useCartStore();

  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    const res = await fetch('/api/cart');
    const data = await res.json();
    if (data.data) {
      setItems(data.data.items);
      setSubtotal(data.data.subtotal);
      setItemCount(data.data.items.reduce((s: number, i: CartItem) => s + i.qty, 0));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login?redirect=/cart'); return; }
    if (status === 'authenticated') fetchCart();
  }, [status]);

  const removeItem = async (id: string) => {
    await fetch(`/api/cart/item/${id}`, { method: 'DELETE' });
    fetchCart();
  };

  const updateQty = async (id: string, qty: number, multiple: number) => {
    if (qty % multiple !== 0) return;
    await fetch(`/api/cart/item/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty }),
    });
    fetchCart();
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading cart...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="page-container py-10">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8">Browse our products and add items to order.</p>
              <Link href="/products" className="btn-primary">Browse Products</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="card p-5 flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.variant.product.photo ? (
                        <img src={item.variant.product.photo.url} alt={item.variant.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">👕</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={`/products/${item.variant.product.slug}`} className="font-semibold hover:text-orange-400 transition-colors">
                            {item.variant.product.name}
                          </Link>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {item.variant.size} / {item.variant.color} • SKU: {item.variant.sku}
                          </p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, item.qty - item.variant.product.qtyMultiple, item.variant.product.qtyMultiple)}
                            disabled={item.qty <= item.variant.product.qtyMultiple}
                            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 flex items-center justify-center transition-colors"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-medium">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + item.variant.product.qtyMultiple, item.variant.product.qtyMultiple)}
                            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                          <span className="text-xs text-gray-500">× {item.variant.product.qtyMultiple}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatINR(item.unitPrice)}/pc</p>
                          <p className="font-bold gradient-text">{formatINR(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <div className="card p-6 sticky top-24 space-y-4">
                  <h2 className="font-bold text-lg">Order Summary</h2>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} pcs)</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Shipping</span>
                      <span className="text-green-400">Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="gradient-text">{formatINR(subtotal)}</span>
                  </div>

                  <Link href="/checkout" className="btn-primary w-full py-3 text-center">
                    Proceed to Checkout →
                  </Link>

                  <Link href="/products" className="btn-ghost w-full py-2 text-center text-sm">
                    ← Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
