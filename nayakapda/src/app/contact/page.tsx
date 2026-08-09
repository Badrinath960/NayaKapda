import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Contact Us — NayaKapda.com',
  description: 'Get in touch with NayaKapda.com (Proprietor: Mr. Karan Rajput). WhatsApp, phone, or email — we\'re here to help with your bulk apparel orders.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <div className="bg-white border-b border-slate-200 py-12 text-center">
          <div className="page-container">
            <h1 className="text-4xl font-black text-slate-900 mb-2">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-slate-600 text-base max-w-md mx-auto font-medium">
              Have questions about bulk orders, pricing, or shipping? We&apos;re happy to help.
            </p>
          </div>
        </div>

        <div className="page-container py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* WhatsApp - Primary CTA */}
            <div className="card p-8 text-center bg-emerald-50/60 border-emerald-200 shadow-sm space-y-4">
              <div className="text-5xl">💬</div>
              <h2 className="text-2xl font-black text-slate-900">
                Chat on WhatsApp
              </h2>
              <p className="text-slate-600 text-xs max-w-md mx-auto font-medium">
                The fastest way to reach us. Get answers about products, pricing, and custom orders instantly.
              </p>
              <a
                href="https://wa.me/918735045268"
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-sm font-bold px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 shadow-md"
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Chat on WhatsApp — +91 87350 45268
              </a>
            </div>

            {/* Contact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-xl">
                  📞
                </div>
                <p className="font-bold text-slate-900 text-sm">Phone Numbers</p>
                <div className="space-y-1 text-xs">
                  <p className="text-slate-600 font-medium">WhatsApp: <a href="https://wa.me/918735045268" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">+91 87350 45268</a></p>
                  <p className="text-slate-600 font-medium">Alt: <a href="tel:+917698752012" className="text-slate-900 font-bold hover:underline">+91 76987 52012</a></p>
                </div>
              </div>

              {/* Email */}
              <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-xl">
                  ✉️
                </div>
                <p className="font-bold text-slate-900 text-sm">Email</p>
                <a
                  href="mailto:support@nayakapda.com"
                  className="text-sky-700 font-bold hover:underline text-xs block"
                >
                  support@nayakapda.com
                </a>
              </div>

              {/* Business Hours */}
              <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl">
                  👤
                </div>
                <p className="font-bold text-slate-900 text-sm">Proprietor</p>
                <p className="text-slate-700 text-xs font-semibold">Mr. Karan Rajput</p>
                <p className="text-slate-500 text-[11px] font-medium">NayaKapda - The Tshirt Printing Store</p>
              </div>

              {/* Address */}
              <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-xl">
                  📍
                </div>
                <p className="font-bold text-slate-900 text-sm">Location / Store Address</p>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">
                  Shop No-09, Wing-E, PM Avas Yojna, Near Ratri Bazar, New Sama Road, Vadodara, Gujarat - 390008, India
                </p>
              </div>
            </div>

            {/* FAQ CTA */}
            <div className="card p-6 bg-white border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-bold text-slate-900 text-sm">Have general questions?</p>
                <p className="text-slate-500 text-xs font-medium mt-0.5">Check our FAQ for quick answers.</p>
              </div>
              <a href="/faq" className="btn-secondary py-2 px-4 text-xs font-bold">
                Browse FAQ →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
