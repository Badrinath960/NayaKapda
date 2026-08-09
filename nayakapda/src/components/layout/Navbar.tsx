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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <nav className="page-container flex items-center justify-between h-16 sm:h-18">
        
        {/* Left Section: Mobile Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button — STRICTLY HIDDEN ON DESKTOP */}
          <button
            className="mobile-hamburger-btn md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo — ONLY Image logo, NO text logo */}
          <Link href="/" className="flex items-center group py-1">
            <img
              src="/logo.png"
              alt="NayaKapda.com — B2B Wholesale Apparel"
              className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Center Section: Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link href="/products" className="btn-ghost text-xs sm:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            Products
          </Link>
          <Link href="/pricing" className="btn-ghost text-xs sm:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            Bulk Pricing
          </Link>
          <Link href="/faq" className="btn-ghost text-xs sm:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            FAQ
          </Link>
          <Link href="/contact" className="btn-ghost text-xs sm:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            Contact
          </Link>
        </div>

        {/* Right Section: Cart + Account Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Icon */}
          <Link href="/cart" className="relative btn-ghost p-2 text-slate-700 hover:text-orange-600 transition-colors" aria-label="Cart">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h11M10 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shadow-xs">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Account / Sign In */}
          {session ? (
            <div className="relative group">
              <button className="flex items-center gap-2 btn-ghost py-1.5 px-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 text-xs font-bold">
                  {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-800">{session.user?.name ?? 'Account'}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 card py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 shadow-lg border-slate-200 z-50">
                <Link href="/account" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold">My Account</Link>
                <Link href="/account/orders" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold">Order History</Link>
                <Link href="/account/credit-line" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold">Credit Line</Link>
                <Link href="/account/referral" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold">Referral Program</Link>
                <hr className="border-slate-100 my-1" />
                <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold">Sign Out</button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-primary py-2 px-4 text-xs font-bold shadow-xs">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="mobile-hamburger-btn-menu md:hidden border-t border-slate-200 py-3 px-4 space-y-1 bg-white/98 shadow-md">
          <Link href="/products" className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-lg" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link href="/pricing" className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-lg" onClick={() => setMenuOpen(false)}>Bulk Pricing</Link>
          <Link href="/faq" className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-lg" onClick={() => setMenuOpen(false)}>FAQ</Link>
          <Link href="/contact" className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-lg" onClick={() => setMenuOpen(false)}>Contact</Link>
        </div>
      )}
    </header>
  );
}
