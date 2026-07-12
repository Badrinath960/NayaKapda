import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="page-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-black gradient-text">NayaKapda</span>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              India&apos;s trusted B2B bulk apparel platform for printing businesses.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Products</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/products?category=tshirts" className="hover:text-white transition-colors">T-Shirts</Link></li>
              <li><Link href="/products?category=hoodies" className="hover:text-white transition-colors">Hoodies</Link></li>
              <li><Link href="/products?category=polo-shirts" className="hover:text-white transition-colors">Polo Shirts</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Volume Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/policy/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="/policy/returns" className="hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/policy/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/policy/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/policy/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} NayaKapda. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Made in India 🇮🇳</span>
            <span>•</span>
            <span>GST Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
