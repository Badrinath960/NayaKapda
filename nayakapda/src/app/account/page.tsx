import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatINR, formatDate } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

export const metadata = { title: 'Account Overview — NayaKapda' };

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { cls: string; label: string }> = {
    PLACED: { cls: 'badge-orange', label: 'Placed' },
    CONFIRMED: { cls: 'badge-blue', label: 'Confirmed' },
    DISPATCHED: { cls: 'badge-gray', label: 'Dispatched' },
    DELIVERED: { cls: 'badge-green', label: 'Delivered' },
    CANCELLED: { cls: 'badge-red', label: 'Cancelled' },
  };
  const { cls, label } = map[status] ?? { cls: 'badge-gray', label: status };

  return <span className={cls}>{label}</span>;
}

export default async function AccountOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?redirect=/account');

  const userId = (session.user as any)?.id as string;

  // Fetch customer details, credit line, referral, and recent orders
  const [user, creditLine, referral, recentOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true, email: true, createdAt: true },
    }),
    prisma.creditLine.findUnique({
      where: { userId },
    }),
    prisma.referral.findUnique({
      where: { userId },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { _count: { select: { items: true } } },
    }),
  ]);

  if (!user) {
    redirect('/login');
  }

  const limit = creditLine ? Number(creditLine.limitAmount) : 0;
  const used = creditLine ? Number(creditLine.usedAmount) : 0;
  const available = limit - used;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Card */}
      <div className="card p-6" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(3,7,18,0.2) 100%)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f9fafb', margin: 0 }}>
          Welcome back, <span className="gradient-text">{user.name || 'Valued Customer'}</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Registered business partner since {formatDate(user.createdAt)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Credit Line BNPL Summary */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>💳 Business Credit Line</span>
              {limit > 0 && <span style={{ color: '#10b981', fontSize: '0.75rem' }}>Active</span>}
            </h3>
            {limit > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                <div className="glass p-2 rounded-xl">
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>Limit</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6', margin: '0.25rem 0 0' }}>{formatINR(limit)}</p>
                </div>
                <div className="glass p-2 rounded-xl">
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>Used</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', margin: '0.25rem 0 0' }}>{formatINR(used)}</p>
                </div>
                <div className="glass p-2 rounded-xl">
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>Available</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', margin: '0.25rem 0 0' }}>{formatINR(available)}</p>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No active business credit line. Contact admin to apply.</p>
            )}
          </div>
          <Link href="/account/credit-line" className="btn-secondary text-center" style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            View Credit Statement →
          </Link>
        </div>

        {/* Referral Affiliate Summary */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1rem' }}>
              🤝 Affiliate Program
            </h3>
            {referral ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>Your Invite Code:</span>
                  <span style={{ fontFamily: 'monospace', color: '#f97316', fontWeight: 700 }}>{referral.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9ca3af' }}>Total Earnings:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{formatINR(Number(referral.earningsTotal))}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Setup your affiliate account to earn commission on buyer referrals.</p>
            )}
          </div>
          <Link href="/account/referral" className="btn-secondary text-center" style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Invite Partners →
          </Link>
        </div>
      </div>

      {/* Recent Orders Widget */}
      <div className="card p-5">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>Recent Orders</h3>
          <Link href="/account/orders" style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 600 }} className="hover:underline">
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>No orders placed yet.</p>
        ) : (
          <div className="table-container" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: '#f97316', fontWeight: 600, fontSize: '0.8rem' }}>
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{formatDate(order.createdAt)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ color: '#d1d5db' }}>{order._count.items} items</td>
                    <td style={{ color: '#f9fafb', fontWeight: 600 }}>{formatINR(Number(order.totalAmount))}</td>
                    <td>
                      <Link href={`/account/orders/${order.id}`} className="text-orange-400 hover:underline text-xs">
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
