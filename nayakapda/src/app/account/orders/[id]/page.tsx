import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { formatINR, formatDate } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Order #${params.id.slice(-8).toUpperCase()} — NayaKapda` };
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { cls: string; label: string }> = {
    PLACED: { cls: 'badge-orange', label: 'Placed' },
    CONFIRMED: { cls: 'badge-blue', label: 'Confirmed' },
    DISPATCHED: { cls: 'badge-gray', label: 'Dispatched' },
    DELIVERED: { cls: 'badge-green', label: 'Delivered' },
    CANCELLED: { cls: 'badge-red', label: 'Cancelled' },
  };
  const { cls, label } = map[status] ?? { cls: 'badge-gray', label: status };
  const style =
    status === 'DISPATCHED'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.125rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 500,
          background: 'rgba(139,92,246,0.15)',
          color: '#a78bfa',
          border: '1px solid rgba(139,92,246,0.3)',
        }
      : undefined;
  return (
    <span className={style ? undefined : cls} style={style}>
      {label}
    </span>
  );
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?redirect=/account');

  const userId = (session.user as any)?.id as string;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <Link href="/account" style={{ color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
          ← Back to Orders
        </Link>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>
              Order{' '}
              <span style={{ fontFamily: 'monospace', color: '#f97316' }}>
                #{order.id.slice(-8).toUpperCase()}
              </span>
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
              Placed on {formatDate(order.createdAt)} · {order.paymentMode}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StatusBadge status={order.status} />
            <a
              href={`/api/account/orders/${order.id}/invoice`}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              📄 Download Invoice
            </a>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Order Items
        </h2>
        <div className="table-container">
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
                  <td>
                    <Link
                      href={`/products/${item.variant.product.slug}`}
                      style={{ color: '#f9fafb', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {item.variant.product.name}
                    </Link>
                  </td>
                  <td style={{ color: '#d1d5db' }}>{item.variant.size}</td>
                  <td style={{ color: '#d1d5db' }}>{item.variant.color}</td>
                  <td style={{ color: '#f97316', fontWeight: 600 }}>{item.qty}</td>
                  <td>{formatINR(Number(item.unitPrice))}</td>
                  <td style={{ color: '#f9fafb', fontWeight: 600 }}>{formatINR(Number(item.subtotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Address */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Delivery Address
          </h2>
          <div style={{ color: '#d1d5db', lineHeight: 1.7, fontSize: '0.875rem' }}>
            {order.address.label && (
              <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem' }}>{order.address.label}</p>
            )}
            <p style={{ margin: 0 }}>{order.address.line1}</p>
            <p style={{ margin: 0 }}>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
            <p style={{ margin: 0 }}>{order.address.country}</p>
          </div>
        </div>

        {/* Shipping */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Shipping
          </h2>
          {order.shippingMethod && (
            <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
              <p style={{ fontWeight: 600, color: '#f9fafb', margin: '0 0 0.25rem' }}>{order.shippingMethod.name}</p>
              <p style={{ margin: 0, color: '#9ca3af' }}>{order.shippingMethod.etaText}</p>
            </div>
          )}
          {order.trackingNumber && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.5rem' }}>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Number</p>
              <p style={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600, margin: 0 }}>{order.trackingNumber}</p>
              {order.courierName && <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>via {order.courierName}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="card" style={{ padding: '1.25rem', maxWidth: 400 }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Price Breakdown
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d1d5db' }}>
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
              <span>Discount {order.discountCode && `(${order.discountCode.code.toUpperCase()})`}</span>
              <span>−{formatINR(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d1d5db' }}>
            <span>Shipping</span>
            <span>{shipping === 0 ? <span style={{ color: '#4ade80' }}>Free</span> : formatINR(shipping)}</span>
          </div>
          <div style={{ height: 1, background: '#1f2937', margin: '0.25rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f9fafb', fontWeight: 700, fontSize: '1rem' }}>
            <span>Total</span>
            <span style={{ color: '#f97316' }}>{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
