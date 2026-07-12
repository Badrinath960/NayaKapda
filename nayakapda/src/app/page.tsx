import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';

async function getHomeData() {
  const [categories, featuredProducts, banners, faqs] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.product.findMany({
      where: { active: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true, slug: true } },
        photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
        pricingTiers: { orderBy: { minQty: 'asc' }, take: 1 },
      },
    }),
    prisma.bannerMessage.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.fAQEntry.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, take: 6 }),
  ]);
  return { categories, featuredProducts, banners, faqs };
}

export default async function HomePage() {
  const { categories, featuredProducts, banners, faqs } = await getHomeData();

  return (
    <>
      <Navbar />

      {/* Marquee Banner */}
      {banners.length > 0 && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 overflow-hidden py-2">
          <div className="ticker-content gap-16">
            {[...banners, ...banners].map((b, i) => (
              <span key={i} className="text-sm text-orange-300 font-medium px-8">{b.text}</span>
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-gray-950 to-gray-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl" />

        <div className="page-container relative section text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-orange text-orange-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            Trusted by 500+ printing businesses across India
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
            Bulk Apparel for{' '}
            <span className="gradient-text">Printing Pros</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium 180–320 GSM T-shirts, Hoodies & Polos at wholesale prices.
            Mix sizes, pick colors, order at least <strong className="text-orange-400">10 pieces</strong> — and watch the price drop.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/products" className="btn-primary text-base px-8 py-4 shadow-lg shadow-orange-500/20">
              Browse Catalogue
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/pricing" className="btn-secondary text-base px-8 py-4">
              View Pricing Tiers
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: '180–320', label: 'GSM Range' },
              { value: '10+', label: 'Min. Order (pcs)' },
              { value: '5–7', label: 'Days Delivery' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl py-4 px-3 text-center">
                <div className="text-xl sm:text-2xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="section">
        <div className="page-container">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Shop by Category</h2>
          <p className="text-gray-500 mb-8">Each category has its own quantity multiple — prices drop as you order more.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group card-hover p-6 flex flex-col gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xl">
                  {cat.slug === 'tshirts' ? '👕' : cat.slug === 'hoodies' ? '🧥' : '👔'}
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-orange-400 transition-colors">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                  <p className="text-xs text-orange-400/70 mt-2 font-medium">Min. multiple: {cat.qtyMultiple} pcs</p>
                </div>
                <span className="text-orange-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Browse →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section bg-gray-900/30">
        <div className="page-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Featured Products</h2>
              <p className="text-gray-500 mt-1">Blank canvases ready for your brand.</p>
            </div>
            <Link href="/products" className="btn-ghost hidden sm:flex">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => {
              const priceFrom = product.pricingTiers[0]
                ? Number(product.pricingTiers[0].pricePerPiece)
                : Number(product.basePrice);

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group card-hover overflow-hidden flex flex-col"
                >
                  {/* Product Image / Placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                    {product.photos[0] ? (
                      <img src={product.photos[0].url} alt={product.photos[0].altText ?? product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="text-center">
                        <div className="text-5xl mb-2">👕</div>
                        <p className="text-xs text-gray-600">{product.name}</p>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="badge-orange text-xs">{product.category.name}</span>
                    </div>
                    {product.gsm && (
                      <div className="absolute top-3 left-3">
                        <span className="badge-gray text-xs">{product.gsm} GSM</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-semibold text-lg leading-tight group-hover:text-orange-400 transition-colors">{product.name}</h3>
                      {product.fabricComposition && (
                        <p className="text-xs text-gray-500 mt-1">{product.fabricComposition}</p>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-xl font-bold gradient-text">{formatINR(priceFrom)}<span className="text-sm text-gray-400 font-normal">/pc</span></p>
                      </div>
                      <span className="btn-secondary py-2 px-4 text-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                        Order Now
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link href="/products" className="btn-secondary">View All Products</Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">How Bulk Ordering Works</h2>
            <p className="text-gray-500">Simple, transparent, and built for printing businesses.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🔍', title: 'Browse & Pick', desc: 'Select your product, choose sizes and colors.' },
              { step: '02', icon: '📊', title: 'Fill the Matrix', desc: 'Enter quantity per size. Price updates automatically.' },
              { step: '03', icon: '💰', title: 'Unlock Tiers', desc: 'More pieces = lower price per unit. No negotiations.' },
              { step: '04', icon: '🚚', title: 'Fast Delivery', desc: 'Dispatched within 24–48 hours, pan-India delivery.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center glass rounded-2xl p-6">
                <span className="text-3xl mb-3">{item.icon}</span>
                <span className="text-xs font-bold text-orange-400 mb-2">{item.step}</span>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      {faqs.length > 0 && (
        <section className="section bg-gray-900/30">
          <div className="page-container max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.slice(0, 4).map((faq) => (
                <details key={faq.id} className="card group">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <span className="font-medium">{faq.question}</span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{faq.answer}</div>
                </details>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/faq" className="btn-ghost">View All FAQs →</Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="section">
        <div className="page-container">
          <div className="rounded-3xl glass-orange p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
            <h2 className="text-3xl sm:text-4xl font-black mb-4 relative z-10">
              Ready to Order in <span className="gradient-text">Bulk?</span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto relative z-10">
              Create a free account and start ordering. Volume discounts apply automatically from 10 pieces.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/register" className="btn-primary text-base px-8 py-4">
                Create Free Account
              </Link>
              <Link href="/products" className="btn-secondary text-base px-8 py-4">
                Browse Products First
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
