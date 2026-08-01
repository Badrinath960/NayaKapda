import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatINR, formatDate } from '@/lib/utils';
import type { OrderStatus } from '@prisma/client';

export const metadata = { title: 'Order History — NayaKapda' };

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

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?redirect=/account/orders');

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Order History</h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center bg-white border-slate-200 shadow-sm max-w-md mx-auto">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="text-slate-900 font-bold text-base mb-1">No orders yet</h3>
          <p className="text-slate-500 text-xs mb-6">Start shopping to see your orders here.</p>
          <Link href="/products" className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="table-container bg-white border-slate-200 shadow-sm">
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
                      <span className="font-mono text-orange-600 font-bold text-xs">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs font-medium">{formatDate(order.createdAt)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-slate-700 text-xs font-medium">{itemCount} pcs</td>
                    <td className="text-slate-900 font-bold text-xs">{formatINR(Number(order.totalAmount))}</td>
                    <td>
                      {order.trackingNumber ? (
                        <span className="font-mono text-xs text-sky-700 font-bold">
                          {order.trackingNumber}
                          {order.courierName && (
                            <span className="text-slate-500 block text-[10px] font-medium">
                              {order.courierName}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="btn-secondary py-1 px-3 text-xs font-bold"
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
