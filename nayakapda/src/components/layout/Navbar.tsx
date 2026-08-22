'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const { data: session } = useSession();
  const { itemCount } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const userName = session?.user?.name || (session?.user as any)?.phone || 'My Account';
  const userInitials = userName[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <nav className="page-container flex items-center justify-between h-20 sm:h-22">
        
        {/* Left Section: Mobile Hamburger + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Button — Strictly on the LEFT (< 768px) */}
          <button
            className="mobile-hamburger-btn md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setUserMenuOpen(false);
            }}
            aria-label="Toggle Navigation Menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo — Image logo only */}
          <Link href="/" className="flex items-center group py-1" onClick={() => setMenuOpen(false)}>
            <img
              src="/logo.png"
              alt="NayaKapda.com — B2B Wholesale Apparel"
              className="h-12 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Center Section: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/products" className="btn-ghost text-xs lg:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            Products
          </Link>
          <Link href="/pricing" className="btn-ghost text-xs lg:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            Bulk Pricing
          </Link>
          <Link href="/faq" className="btn-ghost text-xs lg:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            FAQ
          </Link>
          <Link href="/contact" className="btn-ghost text-xs lg:text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors px-3.5 py-2">
            Contact
          </Link>
        </div>

        {/* Right Section: Cart + Account Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative btn-ghost p-2 text-slate-700 hover:text-orange-600 transition-colors rounded-xl"
            aria-label="Cart"
            onClick={() => {
              setMenuOpen(false);
              setUserMenuOpen(false);
            }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h11M10 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] bg-orange-600 text-white rounded-full flex items-center justify-center font-bold shadow-xs">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Account / Profile Dropdown */}
          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 btn-ghost py-1.5 px-2 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setMenuOpen(false);
                }}
                aria-label="User Account Menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 text-xs font-bold shadow-xs">
                  {userInitials}
                </div>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[120px] truncate">
                  {userName}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu (Accessible on both Mobile & Desktop via Click/Tap) */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in-up">
                  {/* User Profile Header Card */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                    {(session.user as any)?.phone && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        +91 {(session.user as any).phone}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/account"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-semibold transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="text-base">👤</span>
                      <span>My Account</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-semibold transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="text-base">📦</span>
                      <span>Order History</span>
                    </Link>
                    <Link
                      href="/account/credit-line"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-semibold transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="text-base">💳</span>
                      <span>Credit Line</span>
                    </Link>
                    <Link
                      href="/account/referral"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-700 font-semibold transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="text-base">🎁</span>
                      <span>Referral Program</span>
                    </Link>
                  </div>

                  <hr className="border-slate-100 my-1" />

                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors"
                    >
                      <span className="text-base">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="btn-primary py-2 px-3 sm:px-4 text-xs font-bold shadow-xs"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Menu (< 768px) */}
      {menuOpen && (
        <div className="mobile-hamburger-btn-menu md:hidden border-t border-slate-200 py-3 px-4 bg-white/98 backdrop-blur-md shadow-lg animate-fade-in-down space-y-3">
          {/* User Section if Logged In */}
          {session ? (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 text-sm font-bold shadow-xs">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                  {(session.user as any)?.phone && (
                    <p className="text-[11px] text-slate-500 font-medium">+91 {(session.user as any).phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200 text-xs font-semibold">
                <Link
                  href="/account"
                  className="px-2.5 py-1.5 bg-white rounded-lg text-slate-700 hover:text-orange-600 border border-slate-200 text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  My Account
                </Link>
                <Link
                  href="/account/orders"
                  className="px-2.5 py-1.5 bg-white rounded-lg text-slate-700 hover:text-orange-600 border border-slate-200 text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  href="/account/credit-line"
                  className="px-2.5 py-1.5 bg-white rounded-lg text-slate-700 hover:text-orange-600 border border-slate-200 text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Credit
                </Link>
                <Link
                  href="/account/referral"
                  className="px-2.5 py-1.5 bg-white rounded-lg text-slate-700 hover:text-orange-600 border border-slate-200 text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Referral
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pb-2 border-b border-slate-100">
              <Link
                href="/login"
                className="btn-primary flex-1 text-center py-2.5 text-xs font-bold shadow-xs"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-secondary flex-1 text-center py-2.5 text-xs font-bold shadow-xs"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              href="/products"
              className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              🏷️ All Products
            </Link>
            <Link
              href="/pricing"
              className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              📊 Bulk Pricing
            </Link>
            <Link
              href="/stock"
              className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              📦 Live Stock
            </Link>
            <Link
              href="/product-videos"
              className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              🎥 Product Demos
            </Link>
            <Link
              href="/shipping-calculator"
              className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              🚚 Shipping Calculator
            </Link>
            <Link
              href="/faq"
              className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              ❓ FAQ
            </Link>
            <Link
              href="/contact"
              className="block py-2.5 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              📞 Contact & WhatsApp
            </Link>
          </div>

          {session && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="w-full text-left py-2 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
