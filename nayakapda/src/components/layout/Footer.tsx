import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 sm:mt-24 border-t border-slate-200 bg-white">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Col — 5 columns on large screens for proper spacing */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex items-center justify-center shadow-xs">
                <img
                  src="/logo.png"
                  alt="NayaKapda.com"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="text-xl font-black text-slate-900 leading-none">
                NayaKapda<span className="text-orange-600">.com</span>
              </span>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-sm">
              India&apos;s trusted B2B bulk apparel platform for printing businesses, resellers & trade buyers.
            </p>

            <div className="pt-1 text-xs text-slate-600 font-medium space-y-2 max-w-sm">
              <p className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0 mt-0.5">📍</span>
                <span>Shop No-09, Wing-E, PM Avas Yojna, Near Ratri Bazar, New Sama Road, Vadodara, Gujarat - 390008</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-slate-400">✉️</span>
                <a href="mailto:support@nayakapda.com" className="hover:text-orange-600 transition-colors">support@nayakapda.com</a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-slate-400">💬</span>
                <span>WhatsApp: <a href="https://wa.me/918735045268" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline">+91 87350 45268</a></span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-slate-400">📞</span>
                <span>Alt: <a href="tel:+917698752012" className="text-slate-800 font-bold hover:underline">+91 76987 52012</a></span>
              </p>
            </div>
          </div>

          {/* Products Col — 2 columns */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Products</h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><Link href="/products" className="hover:text-orange-600 transition-colors block py-0.5">All Products</Link></li>
              <li><Link href="/pricing" className="hover:text-orange-600 transition-colors block py-0.5">Volume Pricing</Link></li>
              <li><Link href="/stock" className="hover:text-orange-600 transition-colors block py-0.5">Live Stock</Link></li>
              <li><Link href="/product-videos" className="hover:text-orange-600 transition-colors block py-0.5">Product Demos</Link></li>
            </ul>
          </div>

          {/* Support Col — 3 columns */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Support & Logistics</h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><Link href="/faq" className="hover:text-orange-600 transition-colors block py-0.5">Frequently Asked Questions</Link></li>
              <li><Link href="/contact" className="hover:text-orange-600 transition-colors block py-0.5">Contact Support</Link></li>
              <li><Link href="/shipping-calculator" className="hover:text-orange-600 transition-colors block py-0.5">Shipping Calculator</Link></li>
              <li><Link href="/policy/shipping" className="hover:text-orange-600 transition-colors block py-0.5">Shipping Policy</Link></li>
              <li><Link href="/policy/returns" className="hover:text-orange-600 transition-colors block py-0.5">Returns & Refunds</Link></li>
            </ul>
          </div>

          {/* Legal Col — 2 columns */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal & Policy</h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li><Link href="/policy/privacy" className="hover:text-orange-600 transition-colors block py-0.5">Privacy Policy</Link></li>
              <li><Link href="/policy/terms" className="hover:text-orange-600 transition-colors block py-0.5">Terms of Service</Link></li>
              <li><Link href="/policy/disclaimer" className="hover:text-orange-600 transition-colors block py-0.5">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            © {new Date().getFullYear()} NayaKapda.com Bulk Apparel. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>Made in India 🇮🇳</span>
            <span className="text-slate-300">•</span>
            <span>GST Registered Business</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
