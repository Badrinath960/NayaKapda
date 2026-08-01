'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR, formatDate } from '@/lib/utils';

type OrderDetail = {
  id: string;
  status: string;
  paymentMode: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  trackingNumber: string | null;
  courierName: string | null;
  cancelReason: string | null;
  createdAt: string;
  razorpayPaymentId: string | null;
  user: { name: string | null; phone: string; email: string | null };
  address: { name: string; line1: string; city: string; state: string; pincode: string; country: string } | null;
  shippingMethod: { name: string; etaText: string | null } | null;
  discountCode: { code: string } | null;
  items: Array<{
    id: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
    variant: { size: string; color: string; sku: string; product: { name: string; slug: string } };
  }>;
};

const STATUSES = ['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  PLACED: 'badge-orange', CONFIRMED: 'badge-blue',
  DISPATCHED: 'badge-blue',
  DELIVERED: 'badge-green', CANCELLED: 'badge-red',
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', trackingNumber: '', courierName: '', cancelReason: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOrder = async () => {
    const res = await fetch(`/api/admin/orders/${id}`);
    const data = await res.json();
    if (data.data) {
      setOrder(data.data);
      setStatusForm({ status: data.data.status, trackingNumber: data.data.trackingNumber ?? '', courierName: data.data.courierName ?? '', cancelReason: data.data.cancelReason ?? '' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusForm),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? 'Update failed'); }
    else { setSuccess('Order updated successfully'); fetchOrder(); }
    setUpdating(false);
  };

  if (loading) return <div className="p-8 text-slate-500 text-xs font-semibold">Loading...</div>;
  if (!order) return <div className="p-8 text-rose-600 text-xs font-semibold">Order not found</div>;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-slate-500 text-xs font-semibold hover:text-slate-900 mb-2 flex items-center gap-1">
            ← Back to Orders
          </button>
          <h1 className="text-xl font-black text-slate-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={STATUS_COLORS[order.status] ?? 'badge-gray'}>{order.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Price */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-600">Order Items</div>
            <div className="table-container rounded-none border-0 shadow-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-bold text-slate-900 text-xs">{item.variant.product.name}</td>
                      <td className="text-slate-500 text-xs font-medium">{item.variant.size} / {item.variant.color}</td>
                      <td className="text-slate-700 text-xs font-semibold">{item.qty} pcs</td>
                      <td className="text-slate-700 text-xs font-medium">{formatINR(item.unitPrice)}</td>
                      <td className="font-bold text-orange-600 text-xs">{formatINR(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Price Breakdown */}
            <div className="p-4 border-t border-slate-200 space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span><span>{formatINR(Number(order.subtotal))}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount ({order.discountCode?.code})</span>
                  <span>−{formatINR(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping ({order.shippingMethod?.name})</span>
                <span>{formatINR(Number(order.shippingCost))}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Total</span><span className="text-orange-600 font-black">{formatINR(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Customer + Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-2">
              <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Customer</h3>
              <p className="font-bold text-slate-900 text-sm">{order.user.name ?? 'Unknown'}</p>
              <p className="text-slate-500 text-xs font-medium">{order.user.phone}</p>
              {order.user.email && <p className="text-slate-500 text-xs font-medium">{order.user.email}</p>}
              <p className="mt-2 text-xs"><span className="badge-gray">{order.paymentMode}</span></p>
              {order.razorpayPaymentId && (
                <p className="text-[10px] text-slate-400 font-mono mt-1">Razorpay: {order.razorpayPaymentId}</p>
              )}
            </div>
            {order.address && (
              <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-2">
                <h3 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Delivery Address</h3>
                <p className="font-bold text-slate-900 text-sm">{order.address.name}</p>
                <p className="text-slate-600 text-xs font-medium">{order.address.line1}</p>
                <p className="text-slate-600 text-xs font-medium">{order.address.city}, {order.address.state} {order.address.pincode}</p>
                <p className="text-slate-600 text-xs font-medium">{order.address.country}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Status Update */}
        <div>
          <div className="card p-5 space-y-4 sticky top-6 bg-white border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm">Update Status</h3>

            <div>
              <label className="label">Status</label>
              <select
                className="input py-2 text-xs font-medium"
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {statusForm.status === 'DISPATCHED' && (
              <>
                <div>
                  <label className="label">Tracking Number</label>
                  <input type="text" className="input text-xs" placeholder="TRK123456789IN" value={statusForm.trackingNumber} onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })} />
                </div>
                <div>
                  <label className="label">Courier Name</label>
                  <input type="text" className="input text-xs" placeholder="Delhivery" value={statusForm.courierName} onChange={(e) => setStatusForm({ ...statusForm, courierName: e.target.value })} />
                </div>
              </>
            )}

            {statusForm.status === 'CANCELLED' && (
              <div>
                <label className="label">Cancel Reason</label>
                <textarea className="input text-xs min-h-[80px] resize-none" placeholder="Reason for cancellation..." value={statusForm.cancelReason} onChange={(e) => setStatusForm({ ...statusForm, cancelReason: e.target.value })} />
              </div>
            )}

            {error && <div className="text-rose-700 text-xs px-3 py-2 bg-rose-50 border border-rose-200 font-semibold rounded-lg">{error}</div>}
            {success && <div className="text-emerald-800 text-xs px-3 py-2 bg-emerald-50 border border-emerald-200 font-semibold rounded-lg">{success}</div>}

            <button onClick={handleUpdate} disabled={updating} className="btn-primary w-full py-2.5 text-xs font-bold shadow-md">
              {updating ? 'Updating...' : 'Update Order'}
            </button>

            {order.trackingNumber && (
              <div className="pt-3 border-t border-slate-200 text-xs">
                <p className="text-slate-500 font-medium mb-1">Current Tracking</p>
                <p className="font-mono font-bold text-sky-700">{order.trackingNumber}</p>
                {order.courierName && <p className="text-[10px] text-slate-500 font-medium">{order.courierName}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
