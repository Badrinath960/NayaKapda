import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';

async function getDashboardData() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalOrders, pendingOrders, totalRevenue, newCustomers, recentOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({ where: { status: { in: ['PLACED', 'CONFIRMED'] } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, phone: true } } },
    }),
  ]);

  return {
    totalOrders,
    pendingOrders,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    newCustomers,
    recentOrders,
  };
}

const statusColors: Record<string, string> = {
  PLACED: 'badge-orange',
  CONFIRMED: 'badge-blue',
  DISPATCHED: 'badge-blue',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
};

export default async function AdminDashboard() {
  const { totalOrders, pendingOrders, totalRevenue, newCustomers, recentOrders } = await getDashboardData();

  const stats = [
    { label: 'Revenue (30d)', value: formatINR(totalRevenue), icon: '💰', color: 'text-emerald-600' },
    { label: 'Orders (30d)', value: totalOrders, icon: '📦', color: 'text-sky-600' },
    { label: 'Pending', value: pendingOrders, icon: '⏳', color: 'text-amber-600' },
    { label: 'New Customers', value: newCustomers, icon: '👤', color: 'text-orange-600' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Last 30 days performance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4 sm:p-5 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <span className="text-xl sm:text-2xl">{stat.icon}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                {stat.label}
              </span>
            </div>
            <div className={`text-lg sm:text-2xl font-black ${stat.color} truncate`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card bg-white border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-orange-600 font-bold hover:underline">
            View all →
          </Link>
        </div>
        <div className="table-container rounded-none border-0 shadow-none overflow-x-auto">
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-xs font-medium">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-bold text-orange-600 hover:underline"
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <div className="text-xs font-bold text-slate-900">{order.user.name ?? '—'}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{order.user.phone}</div>
                    </td>
                    <td>
                      <span className={statusColors[order.status] ?? 'badge-gray'}>{order.status}</span>
                    </td>
                    <td>
                      <span className="badge-gray text-xs">{order.paymentMode}</span>
                    </td>
                    <td className="font-bold text-slate-900 text-xs">{formatINR(Number(order.totalAmount))}</td>
                    <td className="text-slate-500 text-xs font-medium">
                      {order.createdAt.toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
