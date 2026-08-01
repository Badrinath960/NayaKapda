import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

async function getHomeData() {
  const [categories, banners, faqs] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { active: true },
          take: 1,
          select: { slug: true },
        },
      },
    }),
    prisma.bannerMessage.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.fAQEntry.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, take: 6 }),
  ]);
  return { categories, banners, faqs };
}

export default async function HomePage() {
  const { categories, banners, faqs } = await getHomeData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-grow">
        {/* Marquee Banner */}
        {banners.length > 0 && (
          <div className="bg-orange-50 border-b border-orange-200 overflow-hidden py-2.5">
            <div className="ticker-content gap-16">
              {[...banners, ...banners].map((b, i) => (
                <span key={i} className="text-xs text-orange-900 font-semibold px-8">{b.text}</span>
              ))}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-50/80 rounded-full blur-3xl" />

          <div className="page-container relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Trusted by 500+ printing businesses across India
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6 text-slate-900">
              Bulk Apparel for{' '}
              <span className="gradient-text">Printing Pros</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Premium 180–320 GSM T-shirts, Hoodies & Polos at wholesale prices.
              Mix sizes, pick colors, order at least <strong className="text-orange-600 font-semibold">10 pieces</strong> — and watch the price drop.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/products" className="btn-primary text-base px-8 py-3.5 shadow-md">
                Browse Catalogue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/pricing" className="btn-secondary text-base px-8 py-3.5">
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
                <div key={stat.label} className="card rounded-2xl py-4 px-3 text-center border-slate-200 bg-white/80 shadow-sm">
                  <div className="text-xl sm:text-2xl font-black text-orange-600">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Category Section */}
        <section className="section bg-slate-50 py-16">
          <div className="page-container">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">Shop by Category</h2>
            <p className="text-slate-600 text-sm mb-8 font-medium">Each category has its own quantity multiple — prices drop as you order more.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {categories.map((cat) => {
                const productSlug = cat.products[0]?.slug;
                const href = productSlug ? `/products/${productSlug}` : `/products?category=${cat.slug}`;
                return (
                  <Link
                    key={cat.id}
                    href={href}
                    className="group card-hover p-6 flex flex-col gap-3 cursor-pointer bg-white"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 text-xl">
                      👕
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition-colors">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.description}</p>
                      <p className="text-xs text-orange-600 mt-2 font-semibold">Min. multiple: {cat.qtyMultiple} pcs</p>
                    </div>
                    <span className="text-orange-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all mt-auto pt-2">
                      Order Matrix →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section bg-white border-y border-slate-200 py-16">
          <div className="page-container">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">How Bulk Ordering Works</h2>
              <p className="text-slate-600 text-sm font-medium">Order in multiples of 10 or 12. No long calls, no quotation waiting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Select Product & Category',
                  desc: 'Pick your category (210gsm, 240gsm, Kids, Polos, Hoodies) and inspect available GSM & color options.',
                },
                {
                  step: '02',
                  title: 'Fill Size x Quantity Matrix',
                  desc: 'Enter quantities across Black, White, Navy, Navy Blue, and all 16 colors across S to XXL in our live table.',
                },
                {
                  step: '03',
                  title: 'Checkout & Fast Dispatch',
                  desc: 'Pay online via Razorpay (UPI, Netbanking, Cards). Orders before 2 PM are dispatched same-day with tracking.',
                },
              ].map((item) => (
                <div key={item.step} className="card p-6 relative bg-white border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-orange-200 mb-3">{item.step}</div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="section bg-slate-50 py-16">
            <div className="page-container max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h2>
                <p className="text-slate-600 text-sm font-medium">Got questions? We&apos;ve got quick answers.</p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq) => (
                  <details key={faq.id} className="card group bg-white border-slate-200 shadow-sm">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none text-slate-900 font-bold text-sm">
                      <span className="pr-4">{faq.question}</span>
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-100 pt-3">{faq.answer}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
