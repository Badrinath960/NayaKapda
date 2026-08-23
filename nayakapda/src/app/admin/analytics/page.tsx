import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics — NayaKapda Admin' };

async function getAnalyticsData(from: Date, to: Date) {
  const [salesTrend, topProducts, discountReport, totalRevenue, totalOrders] = await Promise.all([
    // Daily sales trend
    prisma.$queryRaw<Array<{ date: Date; revenue: number; units: number }>>`
      SELECT DATE_TRUNC('day', o."createdAt") as date,
        SUM(o."totalAmount")::float as revenue,
        SUM(oi.qty) as units
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o."createdAt" BETWEEN ${from} AND ${to}
        AND o.status != 'CANCELLED'
      GROUP BY DATE_TRUNC('day', o."createdAt")
      ORDER BY date ASC
    `,
    // Top 5 products by revenue
    prisma.$queryRaw<Array<{ productName: string; revenue: number; units: number }>>`
      SELECT p.name as "productName",
        SUM(oi."subtotal")::float as revenue,
        SUM(oi.qty) as units
      FROM "OrderItem" oi
      JOIN "ProductVariant" pv ON pv.id = oi."variantId"
      JOIN "Product" p ON p.id = pv."productId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o."createdAt" BETWEEN ${from} AND ${to}
        AND o.status != 'CANCELLED'
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 5
    `,
    // Discount code usage report
    prisma.$queryRaw<Array<{ code: string; uses: number; totalDiscount: number; revenue: number }>>`
      SELECT dc.code,
        COUNT(o.id) as uses,
        SUM(o."discountAmount")::float as "totalDiscount",
        SUM(o."totalAmount")::float as revenue
      FROM "Order" o
      JOIN "DiscountCode" dc ON dc.id = o."discountCodeId"
      WHERE o."createdAt" BETWEEN ${from} AND ${to}
        AND o.status != 'CANCELLED'
      GROUP BY dc.code
      ORDER BY revenue DESC
    `,
    // Totals
    prisma.order.aggregate({
      where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.count({ where: { createdAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } } }),
  ]);

  return { salesTrend, topProducts, discountReport, totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0), totalOrders };
}

export default async function AdminAnalyticsPage() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { salesTrend, topProducts, discountReport, totalRevenue, totalOrders } = await getAnalyticsData(from, to);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Last 30 days performance overview</p>
      </div>

      {/* KPI Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="card p-5 sm:p-6 bg-white border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Total Revenue (30d)</p>
          <p className="text-2xl sm:text-3xl font-black text-orange-600 truncate">{formatINR(totalRevenue)}</p>
        </div>
        <div className="card p-5 sm:p-6 bg-white border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Total Orders (30d)</p>
          <p className="text-2xl sm:text-3xl font-black text-sky-600 truncate">{totalOrders}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="card overflow-hidden bg-white border-slate-200 shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 font-bold text-slate-900 text-sm">
          Top Products by Revenue
        </div>
        <div className="table-container rounded-none border-0 shadow-none overflow-x-auto">
          <table className="table min-w-[500px]">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-500 text-xs font-medium">
                    No data available
                  </td>
                </tr>
              ) : (
                topProducts.map((p, i) => (
                  <tr key={p.productName}>
                    <td className="text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="font-bold text-slate-900 text-xs">{p.productName}</td>
                    <td className="text-slate-700 text-xs font-semibold">{Number(p.units).toLocaleString()}</td>
                    <td className="font-black text-orange-600 text-xs">{formatINR(p.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="card p-4 sm:p-6 bg-white border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Daily Revenue Trend</h3>
        <div className="table-container border-slate-200 shadow-none overflow-x-auto">
          <table className="table w-full min-w-[450px]">
            <thead>
              <tr>
                <th>Date</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {salesTrend.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-slate-500 text-xs font-medium">
                    No sales recorded in this period
                  </td>
                </tr>
              ) : (
                salesTrend.map((row) => (
                  <tr key={String(row.date)}>
                    <td className="text-slate-500 text-xs font-medium">
                      {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="text-slate-700 text-xs font-semibold">{Number(row.units).toLocaleString()}</td>
                    <td className="font-bold text-slate-900 text-xs">{formatINR(row.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Report */}
      {discountReport.length > 0 && (
        <div className="card overflow-hidden bg-white border-slate-200 shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 font-bold text-slate-900 text-sm">
            Discount Code Performance
          </div>
          <div className="table-container rounded-none border-0 shadow-none overflow-x-auto">
            <table className="table min-w-[500px]">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Uses</th>
                  <th>Total Discount Given</th>
                  <th>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {discountReport.map((d) => (
                  <tr key={d.code}>
                    <td>
                      <span className="font-mono font-bold text-orange-600 text-xs">{d.code}</span>
                    </td>
                    <td className="text-slate-700 text-xs font-semibold">{Number(d.uses)}</td>
                    <td className="text-rose-600 font-bold text-xs">{formatINR(d.totalDiscount)}</td>
                    <td className="font-black text-orange-600 text-xs">{formatINR(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
