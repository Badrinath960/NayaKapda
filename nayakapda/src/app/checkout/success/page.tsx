'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';

type OrderItem = {
  id: string;
  productName: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

type Order = {
  id: string;
  status: string;
  paymentMode: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  items: OrderItem[];
  address: {
    name: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
  };
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Missing order ID.');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to retrieve order history');
        const json = await res.json();
        
        // Find the matched order
        const matched = (json.data || []).find((o: any) => o.id === orderId);
        if (matched) {
          setOrder(matched);
        } else {
          setError('Order details could not be found.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-grow page-container py-12 max-w-4xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-xs font-semibold">Loading order confirmation...</p>
          </div>
        ) : error || !order ? (
          <div className="text-center py-16 card p-8 max-w-md mx-auto space-y-4 bg-white border-slate-200 shadow-sm">
            <div className="text-amber-500 text-5xl">⚠️</div>
            <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
            <p className="text-slate-500 text-xs">{error || 'Unable to retrieve order info.'}</p>
            <Link href="/products" className="btn-primary inline-block px-6 py-2 text-xs font-bold">
              Back to Products
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Success Banner */}
            <div className="text-center space-y-3 card p-8 bg-emerald-50/60 border-emerald-200 shadow-sm">
              <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center text-3xl font-black mx-auto animate-pulse">
                ✓
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Order Confirmed!</h1>
              <p className="text-slate-600 text-xs max-w-md mx-auto font-medium">
                Thank you for your purchase. Your payment was successful and your order is now being processed.
              </p>
              <div className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-xs">
                <span className="text-slate-500 text-xs mr-1 font-medium">Order ID:</span>
                <span className="font-mono text-orange-600 text-sm font-black">#{order.id.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            {/* Main Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Ordered Items (Span 2) */}
              <div className="md:col-span-2 space-y-5">
                <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-600">
                    Ordered Items ({order.items.reduce((acc, item) => acc + item.qty, 0)} pcs)
                  </div>
                  <div className="table-container border-0 rounded-none shadow-none">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Variant</th>
                          <th>Qty</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="font-bold text-slate-900 text-xs">
                              {item.productName}
                            </td>
                            <td className="text-slate-500 text-xs font-medium">
                              {item.size} / {item.color}
                            </td>
                            <td className="font-bold text-orange-600 text-xs">{item.qty} pcs</td>
                            <td className="font-bold text-slate-900 text-xs">{formatINR(Number(item.subtotal))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Shipping & Delivery Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Address */}
                  <div className="card p-4 space-y-2 bg-white border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Address</h3>
                    {order.address ? (
                      <div className="text-xs text-slate-700 space-y-0.5 font-medium">
                        <p className="font-bold text-slate-900 text-sm">{order.address.name}</p>
                        <p className="pt-1">{order.address.line1}</p>
                        <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                        <p className="text-slate-500 text-[10px] pt-1">Phone: {order.address.phone}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs">No delivery address details found</p>
                    )}
                  </div>

                  {/* Shipping Method */}
                  <div className="card p-4 space-y-2 bg-white border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shipping Method</h3>
                    <div className="text-xs text-slate-700 font-medium">
                      <p className="font-bold text-slate-900 text-sm">Courier Shipping</p>
                      <p className="text-slate-500 mt-1">Delivery through ShipRocket</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold">Expected delivery: 3-7 business days</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Totals Summary */}
              <div className="card p-5 space-y-4 h-fit bg-white border-slate-200 shadow-sm">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Order Summary</h3>
                
                {/* GST and pricing calculations */}
                {(() => {
                  const subTotalVal = Number(order.subtotal);
                  const discountVal = Number(order.discountAmount);
                  const shippingVal = Number(order.shippingCost);
                  const taxableVal = subTotalVal - discountVal;
                  const gstVal = taxableVal * 0.05;
                  const totalVal = Number(order.totalAmount);
                  
                  return (
                    <div className="space-y-2.5 text-xs text-slate-600 font-medium">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-900">{formatINR(subTotalVal)}</span>
                      </div>
                      {discountVal > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Discount</span>
                          <span>−{formatINR(discountVal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Taxable Value</span>
                        <span className="font-semibold text-slate-900">{formatINR(taxableVal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>5% GST (Textiles)</span>
                        <span className="font-semibold text-slate-900">{formatINR(gstVal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Cost</span>
                        <span className="font-semibold text-slate-900">{shippingVal === 0 ? <span className="text-emerald-700 font-bold">Free</span> : formatINR(shippingVal)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-1" />
                      <div className="flex justify-between font-bold text-slate-900 text-sm pt-0.5">
                        <span>Total Amount</span>
                        <span className="text-orange-600 text-base font-black">{formatINR(totalVal)}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-2 pt-2">
                  <Link href="/account" className="btn-secondary w-full text-center block py-2.5 text-xs font-bold rounded-xl">
                    View Order History
                  </Link>
                  <Link href="/products" className="btn-primary w-full text-center block py-2.5 text-xs font-bold rounded-xl shadow-md">
                    Continue Shopping
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
