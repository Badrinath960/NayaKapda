import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 sm:mt-24 border-t border-slate-200 bg-white">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand Col */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black gradient-text">NayaKapda</span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              India&apos;s trusted B2B bulk apparel platform for printing businesses & resellers.
            </p>
            <div className="pt-2 text-xs text-slate-500 font-medium space-y-1">
              <p>📍 Mumbai, Maharashtra, India</p>
              <p>✉️ <a href="mailto:support@nayakapda.com" className="hover:text-orange-600">support@nayakapda.com</a></p>
              <p>📞 <a href="tel:+919999999901" className="hover:text-orange-600">+91 9999 999 901</a></p>
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
          <p className="text-xs text-slate-500 font-medium">© {new Date().getFullYear()} NayaKapda Bulk Apparel. All rights reserved.</p>
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
