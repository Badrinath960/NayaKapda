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
    DISPATCHED: { cls: 'badge-blue', label: 'Dispatched' },
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
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="card p-6 bg-gradient-to-r from-orange-50 via-white to-orange-50/50 border-orange-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">
          Welcome back, <span className="gradient-text">{user.name || 'Valued Customer'}</span>
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          Registered business partner since {formatDate(user.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Line BNPL Summary */}
        <div className="card p-5 flex flex-col justify-between bg-white border-slate-200 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex justify-between items-center">
              <span>💳 Business Credit Line</span>
              {limit > 0 && <span className="badge-green text-[10px]">Active</span>}
            </h3>
            {limit > 0 ? (
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-medium">Limit</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{formatINR(limit)}</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  <p className="text-[10px] text-rose-600 font-medium">Used</p>
                  <p className="text-xs font-bold text-rose-700 mt-0.5">{formatINR(used)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                  <p className="text-[10px] text-emerald-600 font-medium">Available</p>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">{formatINR(available)}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs font-medium">No active business credit line. Contact admin to apply.</p>
            )}
          </div>
          <Link href="/account/credit-line" className="btn-secondary text-center block text-xs font-bold py-2 mt-4">
            View Credit Statement →
          </Link>
        </div>

        {/* Referral Affiliate Summary */}
        <div className="card p-5 flex flex-col justify-between bg-white border-slate-200 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              🤝 Affiliate Program
            </h3>
            {referral ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Your Invite Code:</span>
                  <span className="font-mono text-orange-600 font-bold">{referral.code}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Total Earnings:</span>
                  <span className="text-emerald-600 font-bold">{formatINR(Number(referral.earningsTotal))}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs font-medium">Setup your affiliate account to earn commission on buyer referrals.</p>
            )}
          </div>
          <Link href="/account/referral" className="btn-secondary text-center block text-xs font-bold py-2 mt-4">
            Invite Partners →
          </Link>
        </div>
      </div>

      {/* Recent Orders Widget */}
      <div className="card p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
          <Link href="/account/orders" className="text-xs text-orange-600 font-bold hover:underline">
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-slate-500 text-xs font-medium text-center py-6">No orders placed yet.</p>
        ) : (
          <div className="table-container border-slate-200 shadow-none">
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
                      <span className="font-mono text-orange-600 font-bold text-xs">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs font-medium">{formatDate(order.createdAt)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-slate-700 text-xs font-medium">{order._count.items} items</td>
                    <td className="text-slate-900 font-bold text-xs">{formatINR(Number(order.totalAmount))}</td>
                    <td>
                      <Link href={`/account/orders/${order.id}`} className="text-orange-600 hover:underline text-xs font-bold">
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
