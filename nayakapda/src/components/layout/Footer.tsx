import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 sm:mt-24 border-t border-slate-200 bg-white">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand Col */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="NayaKapda.com" className="h-8 w-auto object-contain" />
              <span className="text-xl font-black text-slate-900">NayaKapda<span className="text-orange-600">.com</span></span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              India&apos;s trusted B2B bulk apparel platform for printing businesses & resellers.
            </p>
            <div className="pt-2 text-xs text-slate-500 font-medium space-y-1.5">
              <p>📍 Shop No-09, Wing-E, PM Avas Yojna, Near Ratri Bazar, New Sama Road, Vadodara, Gujarat - 390008</p>
              <p>✉️ <a href="mailto:support@nayakapda.com" className="hover:text-orange-600">support@nayakapda.com</a></p>
              <p>📞 <a href="tel:+918735045268" className="hover:text-orange-600">+91 87350 45268</a> / <a href="tel:+919825682631" className="hover:text-orange-600">+91 98256 82631</a></p>
            </div>
          </div>

          {/* Products Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Products</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li><Link href="/products" className="hover:text-orange-600 transition-colors">All Products</Link></li>
              <li><Link href="/pricing" className="hover:text-orange-600 transition-colors">Volume Pricing</Link></li>
              <li><Link href="/stock" className="hover:text-orange-600 transition-colors">Live Stock Availability</Link></li>
              <li><Link href="/product-videos" className="hover:text-orange-600 transition-colors">Product Demos & Videos</Link></li>
            </ul>
          </div>

          {/* Support Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Support & Logistics</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li><Link href="/faq" className="hover:text-orange-600 transition-colors">Frequently Asked Questions</Link></li>
              <li><Link href="/contact" className="hover:text-orange-600 transition-colors">Contact Support</Link></li>
              <li><Link href="/shipping-calculator" className="hover:text-orange-600 transition-colors">Shipping Calculator</Link></li>
              <li><Link href="/policy/shipping" className="hover:text-orange-600 transition-colors">Shipping Policy</Link></li>
              <li><Link href="/policy/returns" className="hover:text-orange-600 transition-colors">Returns & Refunds</Link></li>
            </ul>
          </div>

          {/* Legal Col */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Legal & Policy</h4>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li><Link href="/policy/privacy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/policy/terms" className="hover:text-orange-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/policy/disclaimer" className="hover:text-orange-600 transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">© {new Date().getFullYear()} NayaKapda.com Bulk Apparel. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span>Made in India 🇮🇳</span>
            <span>•</span>
            <span>GST Registered Business</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
