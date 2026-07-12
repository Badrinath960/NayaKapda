'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';
import { useState } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <nav className="page-container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black gradient-text">NayaKapda</span>
          <span className="hidden sm:block text-xs text-gray-500 font-medium mt-1">Bulk Apparel</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/products" className="btn-ghost text-sm">Products</Link>
          <Link href="/pricing" className="btn-ghost text-sm">Bulk Pricing</Link>
          <Link href="/faq" className="btn-ghost text-sm">FAQ</Link>
          <Link href="/contact" className="btn-ghost text-sm">Contact</Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative btn-ghost">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h11M10 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {session ? (
            <div className="relative group">
              <button className="flex items-center gap-2 btn-ghost">
                <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-bold">
                  {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="hidden sm:block text-sm">{session.user?.name ?? 'Account'}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 card py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-xl z-50">
                <Link href="/account" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">My Account</Link>
                <Link href="/account/orders" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">Orders</Link>
                <Link href="/account/credit" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">Credit Line</Link>
                <Link href="/account/referral" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">Referral</Link>
                <hr className="border-gray-700 my-1" />
                <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800">Sign Out</button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-primary py-2 px-4 text-sm">Sign In</Link>
          )}

          {/* Mobile Menu */}
          <button className="md:hidden btn-ghost" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 py-3 px-4 space-y-1 bg-gray-950/95 backdrop-blur-lg">
          <Link href="/products" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link href="/pricing" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Bulk Pricing</Link>
          <Link href="/faq" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>FAQ</Link>
          <Link href="/contact" className="block py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Contact</Link>
        </div>
      )}
    </header>
  );
}
