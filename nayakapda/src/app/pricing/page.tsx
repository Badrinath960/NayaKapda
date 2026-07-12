import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Volume Pricing — Bulk Apparel Pricing', description: 'See our transparent tiered pricing for all product categories.' };

export default async function PricingPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: { select: { name: true, slug: true, qtyMultiple: true } },
      pricingTiers: { orderBy: { minQty: 'asc' } },
    },
    orderBy: { category: { sortOrder: 'asc' } },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="page-container py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">Volume Pricing</h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Simple slab-based pricing. The more you order, the less you pay per piece. No negotiations, no hidden charges.
            </p>
          </div>

          <div className="space-y-8">
            {products.map((product) => (
              <div key={product.id} className="card overflow-hidden">
                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{product.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{product.category.name} • Min. {product.category.qtyMultiple} pcs</p>
                  </div>
                  <a href={`/products/${product.slug}`} className="btn-secondary py-2 px-4 text-sm">Order Now →</a>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {product.pricingTiers.map((tier, i) => (
                      <div key={tier.id} className={`rounded-xl p-4 text-center border ${i === 0 ? 'border-gray-700 bg-gray-800/50' : 'border-orange-500/20 bg-orange-500/5'}`}>
                        <p className="text-xs text-gray-500 mb-1">
                          {tier.minQty}–{tier.maxQty ?? '∞'} pcs
                        </p>
                        <p className={`text-xl font-black ${i === 0 ? 'text-white' : 'gradient-text'}`}>
                          {formatINR(Number(tier.pricePerPiece))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">per piece</p>
                        {i > 0 && (
                          <p className="text-xs text-green-400 mt-1 font-medium">
                            Save {Math.round((1 - Number(tier.pricePerPiece) / Number(product.pricingTiers[0].pricePerPiece)) * 100)}%
                          </p>
                        )}
                      </div>
                    ))}
                    {product.pricingTiers.length === 0 && (
                      <div className="rounded-xl p-4 text-center border border-gray-700 bg-gray-800/50">
                        <p className="text-xl font-black">{formatINR(Number(product.basePrice))}</p>
                        <p className="text-xs text-gray-500 mt-1">per piece</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 glass-orange p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Need a Custom Quote?</h2>
            <p className="text-gray-400 mb-6">For orders above 1,000 pieces or special requirements, contact us directly.</p>
            <a href="https://wa.me/919999999901" target="_blank" rel="noopener noreferrer" className="btn-primary">
              💬 Request Custom Quote
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
