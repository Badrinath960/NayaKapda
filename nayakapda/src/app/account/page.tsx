import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatINR, formatDate } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

export const metadata = { title: 'My Orders — NayaKapda' };

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { cls: string; label: string }> = {
    PLACED: { cls: 'badge-orange', label: 'Placed' },
    CONFIRMED: { cls: 'badge-blue', label: 'Confirmed' },
    DISPATCHED: { cls: 'badge-gray', label: 'Dispatched' },
    DELIVERED: { cls: 'badge-green', label: 'Delivered' },
    CANCELLED: { cls: 'badge-red', label: 'Cancelled' },
  };
  const { cls, label } = map[status] ?? { cls: 'badge-gray', label: status };
  // Override dispatched to purple
  const style =
    status === 'DISPATCHED'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
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

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?redirect=/account');

  const userId = (session.user as any)?.id as string;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
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
    },
  });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>Order History</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ color: '#f9fafb', fontWeight: 600, marginBottom: '0.5rem' }}>No orders yet</h3>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Start shopping to see your orders here.</p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Tracking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
                return (
                  <tr key={order.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          color: '#f97316',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{formatDate(order.createdAt)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ color: '#d1d5db' }}>{itemCount} pcs</td>
                    <td style={{ color: '#f9fafb', fontWeight: 600 }}>{formatINR(Number(order.totalAmount))}</td>
                    <td>
                      {order.trackingNumber ? (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#60a5fa' }}>
                          {order.trackingNumber}
                          {order.courierName && (
                            <span style={{ color: '#9ca3af', display: 'block', fontSize: '0.7rem' }}>
                              {order.courierName}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
