import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'About NayaKapda — Bulk Apparel for Printers & Resellers',
  description: 'Learn about NayaKapda — India\'s trusted bulk T-shirt and apparel platform for screen printers, DTF printers, and resellers.',
};

const stats = [
  { value: '500+', label: 'Products Sold / Month' },
  { value: '100+', label: 'Happy Customers' },
  { value: '5+', label: 'Years in Business' },
  { value: '29', label: 'States Served' },
];

const values = [
  {
    icon: '🎯',
    title: 'Quality First',
    desc: 'We source only premium GSM fabrics that hold prints perfectly and wash well, so your customers keep coming back.',
  },
  {
    icon: '💰',
    title: 'Bulk Pricing',
    desc: 'Our tiered pricing rewards volume. The more you order, the more you save — designed specifically for trade buyers.',
  },
  {
    icon: '⚡',
    title: 'Fast Dispatch',
    desc: 'Same-day dispatch for orders confirmed before 2 PM. Because your print shop can\'t afford delays.',
  },
  {
    icon: '🤝',
    title: 'Trade Focused',
    desc: 'We are not a B2C brand. We exist solely to serve printers, embroiderers, and resellers across India.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <div className="bg-white border-b border-slate-200 py-16 text-center">
          <div className="page-container">
            <span className="badge-orange text-xs font-bold px-3 py-1 mb-4 inline-block">
              Est. 2019 · Made in India 🇮🇳
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3 leading-tight">
              About <span className="gradient-text">NayaKapda</span>
            </h1>
            <p className="text-slate-600 text-base max-w-xl mx-auto leading-relaxed font-medium">
              India&apos;s dedicated bulk apparel platform built for screen printers, DTF printers, embroiderers, and resellers who need consistent quality at trade prices.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="border-b border-slate-200 bg-slate-50 py-10">
          <div className="page-container">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {stats.map((stat) => (
                <div key={stat.label} className="card p-4 bg-white border-slate-200 shadow-xs">
                  <p className="text-3xl font-black text-orange-600 mb-1">{stat.value}</p>
                  <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="section bg-white border-b border-slate-200">
          <div className="page-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">
                  Our Story
                </h2>
                <div className="space-y-4 text-slate-600 text-xs leading-relaxed font-medium">
                  <p>
                    NayaKapda was born out of frustration. Our founders ran a screen printing shop and kept running into the same problem: sourcing quality blank T-shirts in bulk, at consistent quality, at fair prices — was a nightmare.
                  </p>
                  <p>
                    In 2019, we decided to solve this ourselves. We built direct relationships with fabric mills in Tiruppur and Surat, and created NayaKapda — a platform designed exclusively for trade buyers who need reliability above everything else.
                  </p>
                  <p>
                    Today, we supply blank apparel to over 100 printers and resellers across India, dispatching thousands of pieces every month with same-day processing and pan-India delivery.
                  </p>
                </div>
              </div>

              {/* Visual */}
              <div className="card p-8 text-center bg-orange-50/60 border-orange-200 shadow-sm space-y-4">
                <div className="text-5xl">👕</div>
                <div className="space-y-2">
                  {[
                    '100% ring-spun cotton options',
                    'GSM range: 180 to 320',
                    'Sizes XS to 5XL available',
                    'Minimum 10 pieces per SKU',
                    'Pantone-matched colors',
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold shadow-xs"
                    >
                      <span className="text-orange-600 font-bold">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="section bg-slate-50">
          <div className="page-container">
            <h2 className="text-2xl font-black text-slate-900 text-center mb-10">
              Why Choose NayaKapda
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {values.map((val) => (
                <div key={val.title} className="card p-6 bg-white border-slate-200 shadow-sm space-y-2">
                  <div className="text-3xl mb-1">{val.icon}</div>
                  <h3 className="font-bold text-slate-900 text-sm">{val.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="section bg-white border-t border-slate-200">
          <div className="page-container text-center">
            <div className="card p-10 max-w-2xl mx-auto bg-gradient-to-r from-orange-50 via-white to-orange-50 border-orange-200 shadow-sm space-y-4">
              <p className="text-[10px] font-bold text-orange-900 uppercase tracking-wider">
                Our Mission
              </p>
              <blockquote className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed italic">
                &quot;To make premium blank apparel accessible to every printer and reseller in India — without minimum order anxiety, without quality surprises.&quot;
              </blockquote>
              <div className="flex gap-3 justify-center pt-2">
                <a href="/products" className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md">
                  Browse Products
                </a>
                <a href="/contact" className="btn-secondary py-2.5 px-6 text-xs font-bold">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
