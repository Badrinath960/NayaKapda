import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { formatINR, formatDate } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Order #${id.slice(-8).toUpperCase()} — NayaKapda` };
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { cls: string; label: string }> = {
    PLACED: { cls: 'badge-orange', label: 'Placed' },
    CONFIRMED: { cls: 'badge-blue', label: 'Confirmed' },
    DISPATCHED: { cls: 'badge-blue', label: 'Dispatched' },
    DELIVERED: { cls: 'badge-green', label: 'Delivered' },
    CANCELLED: { cls: 'badge-red', label: 'Cancelled' },
  };
  const { cls, label } = map[status] ?? { cls: 'badge-gray', label: status };
  return (
    <span className={cls}>
      {label}
    </span>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?redirect=/account');

  const { id } = await params;
  const userId = (session.user as any)?.id as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
        },
      },
      address: true,
      shippingMethod: true,
      discountCode: true,
    },
  });

  if (!order || order.userId !== userId) notFound();

  const subtotal = Number(order.subtotal);
  const discount = Number(order.discountAmount);
  const shipping = Number(order.shippingCost);
  const total = Number(order.totalAmount);
  
  // Calculate 5% GST and Taxable Value
  const taxableValue = subtotal - discount;
  const gstAmount = taxableValue * 0.05;

  return (
    <div className="space-y-6">
      {/* Header / Breadcrumb */}
      <div>
        <Link href="/account/orders" className="text-slate-500 text-xs font-semibold hover:text-orange-600 flex items-center gap-1.5 mb-3 transition-colors">
          ← Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Order <span className="font-mono text-orange-600">#{order.id.slice(-8).toUpperCase()}</span>
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Placed on {formatDate(order.createdAt)} · Payment: {order.paymentMode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <a
              href={`/api/account/orders/${order.id}/invoice`}
              className="btn-secondary py-2 px-4 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              📄 Download Invoice
            </a>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Ordered Products</h2>
        </div>
        <div className="table-container border-0 rounded-none shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="font-bold text-slate-900 text-xs">
                    <Link href={`/products/${item.variant.product.slug}`} className="hover:text-orange-600 hover:underline">
                      {item.variant.product.name}
                    </Link>
                  </td>
                  <td className="text-slate-500 text-xs font-medium">{item.variant.size}</td>
                  <td className="text-slate-500 text-xs font-medium">{item.variant.color}</td>
                  <td className="font-bold text-orange-600 text-xs">{item.qty} pcs</td>
                  <td className="text-slate-700 text-xs font-medium">{formatINR(Number(item.unitPrice))}</td>
                  <td className="font-bold text-slate-900 text-xs">{formatINR(Number(item.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Delivery Info + Price Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Delivery Address Card */}
        <div className="card p-5 space-y-3 bg-white border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Address</h3>
          <div className="text-xs text-slate-700 space-y-1 font-medium">
            <p className="font-bold text-slate-900 text-sm">{order.address.name}</p>
            <p className="mt-2">{order.address.line1}</p>
            <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
            <p className="text-slate-500 text-[10px] pt-1">Phone: {order.address.phone}</p>
          </div>
        </div>

        {/* Shipping Method Card */}
        <div className="card p-5 space-y-3 bg-white border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shipping Method</h3>
          {order.shippingMethod ? (
            <div className="text-xs text-slate-700 space-y-1 font-medium">
              <p className="font-bold text-slate-900 text-sm">{order.shippingMethod.name}</p>
              <p className="text-slate-500 text-xs">{order.shippingMethod.etaText}</p>
            </div>
          ) : (
            <p className="text-slate-500 text-xs font-medium">No shipping method selected</p>
          )}

          {order.trackingNumber && (
            <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
              <p className="text-[10px] text-sky-800 uppercase tracking-wider font-bold">Tracking details</p>
              <p className="font-mono text-sky-700 font-bold text-xs">{order.trackingNumber}</p>
              {order.courierName && (
                <p className="text-[10px] text-sky-600">Shipped via {order.courierName}</p>
              )}
            </div>
          )}
        </div>

        {/* Price Summary Card */}
        <div className="card p-5 space-y-3 bg-white border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Breakdown</h3>
          <div className="space-y-2 text-xs text-slate-600 font-medium">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount {order.discountCode && `(${order.discountCode.code.toUpperCase()})`}</span>
                <span>−{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxable Value</span>
              <span className="font-semibold text-slate-900">{formatINR(taxableValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>5% GST</span>
              <span className="font-semibold text-slate-900">{formatINR(gstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-emerald-700 font-bold">Free</span> : formatINR(shipping)}</span>
            </div>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Amount</span>
              <span className="text-orange-600 font-black">{formatINR(total)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
