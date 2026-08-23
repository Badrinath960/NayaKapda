import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Volume Pricing — Bulk Apparel Pricing',
  description: 'See our transparent tiered pricing for all product categories.',
};

type Props = { searchParams: Promise<{ category?: string }> };

export default async function PricingPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const where: any = { active: true };
  if (category) where.category = { slug: category };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true, qtyMultiple: true } },
        pricingTiers: { orderBy: { minQty: 'asc' } },
      },
      orderBy: { category: { sortOrder: 'asc' } },
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container content-wrapper">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-3">Volume Pricing</h1>
            <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
              Simple slab-based pricing. The more you order, the less you pay per piece. No negotiations, no hidden charges.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="mb-10 flex overflow-x-auto whitespace-nowrap gap-2 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            <a
              href="/pricing"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border inline-block ${
                !category
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              All Categories
            </a>
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/pricing?category=${cat.slug}`}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border inline-block ${
                  category === cat.slug
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {cat.name}
              </a>
            ))}
          </div>

          {/* Pricing Cards List */}
          <div className="space-y-8">
            {products.map((product) => (
              <div key={product.id} className="card overflow-hidden bg-white border-slate-200 shadow-sm">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {product.category.name} • Min. {product.category.qtyMultiple} pcs
                    </p>
                  </div>
                  <a href={`/products/${product.slug}`} className="btn-primary py-2.5 px-5 text-xs font-bold self-start sm:self-auto shadow-md">
                    Configure & Order Matrix →
                  </a>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {product.pricingTiers.map((tier, i) => (
                      <div
                        key={tier.id}
                        className={`rounded-xl p-4 text-center border transition-all ${
                          i === 0
                            ? 'border-slate-200 bg-slate-50'
                            : 'border-orange-200 bg-orange-50/50'
                        }`}
                      >
                        <p className="text-xs text-slate-500 font-medium mb-1">
                          {tier.minQty}–{tier.maxQty ?? '∞'} pcs
                        </p>
                        <p className={`text-xl font-black ${i === 0 ? 'text-slate-900' : 'text-orange-600'}`}>
                          {formatINR(Number(tier.pricePerPiece))}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-1">per piece</p>
                        {i > 0 && product.pricingTiers[0] && (
                          <p className="text-xs text-emerald-600 mt-1 font-bold">
                            Save{' '}
                            {Math.round(
                              (1 -
                                Number(tier.pricePerPiece) /
                                  Number(product.pricingTiers[0].pricePerPiece)) *
                                100
                            )}
                            %
                          </p>
                        )}
                      </div>
                    ))}
                    {product.pricingTiers.length === 0 && (
                      <div className="rounded-xl p-4 text-center border border-slate-200 bg-slate-50">
                        <p className="text-xl font-black text-slate-900">{formatINR(Number(product.basePrice))}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">per piece</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-center py-20 card bg-white border-slate-200 p-8 max-w-md mx-auto">
                <div className="text-5xl mb-4">🏷️</div>
                <p className="text-lg font-bold text-slate-800">No pricing tiers found</p>
              </div>
            )}
          </div>

          <div className="mt-12 card p-8 text-center bg-gradient-to-r from-orange-50 via-white to-orange-50 border-orange-200 shadow-xs">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Need a Custom Quote?</h2>
            <p className="text-slate-600 text-xs font-medium mb-6">
              For orders above 1,000 pieces or special custom branding requirements, chat directly with us on WhatsApp.
            </p>
            <a
              href="https://wa.me/918735045268"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-3 px-6 text-xs font-bold shadow-xs inline-flex items-center gap-2"
            >
              <span>💬</span> Chat on WhatsApp (+91 87350 45268)
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
