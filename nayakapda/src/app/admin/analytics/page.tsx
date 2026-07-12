import { prisma } from '@/lib/prisma';
import { formatINR, formatDate } from '@/lib/utils';
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Last 30 days overview</p>
      </div>

      {/* KPI Totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Total Revenue (30d)</p>
          <p className="text-3xl font-black gradient-text">{formatINR(totalRevenue)}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 mb-1">Total Orders (30d)</p>
          <p className="text-3xl font-black text-blue-400">{totalOrders}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-800 font-semibold">Top Products by Revenue</div>
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-gray-500">No data</td></tr>
              ) : topProducts.map((p, i) => (
                <tr key={p.productName}>
                  <td className="text-gray-500 font-mono">{i + 1}</td>
                  <td className="font-medium">{p.productName}</td>
                  <td>{Number(p.units).toLocaleString()}</td>
                  <td className="font-bold gradient-text">{formatINR(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Daily Revenue Trend</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr><th>Date</th><th>Units Sold</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {salesTrend.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-6 text-gray-500">No sales in this period</td></tr>
              ) : salesTrend.map((row) => (
                <tr key={String(row.date)}>
                  <td className="text-gray-400 text-sm">{new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td>{Number(row.units).toLocaleString()}</td>
                  <td className="font-medium">{formatINR(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Report */}
      {discountReport.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-800 font-semibold">Discount Code Performance</div>
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr><th>Code</th><th>Uses</th><th>Total Discount Given</th><th>Revenue Generated</th></tr>
              </thead>
              <tbody>
                {discountReport.map((d) => (
                  <tr key={d.code}>
                    <td><span className="font-mono text-orange-400">{d.code}</span></td>
                    <td>{Number(d.uses)}</td>
                    <td className="text-red-400">{formatINR(d.totalDiscount)}</td>
                    <td className="font-bold gradient-text">{formatINR(d.revenue)}</td>
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
