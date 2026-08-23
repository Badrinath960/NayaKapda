'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/products', label: 'Products', icon: '👕' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/discounts', label: 'Discounts', icon: '🎫' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/content', label: 'Content', icon: '📝' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<{
    email: string;
    role: string;
    name?: string;
  } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(pathname !== '/admin/login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setCheckingAuth(false);
      return;
    }

    let isMounted = true;

    async function verifyAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        if (!res.ok) {
          if (isMounted) {
            router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
          }
          return;
        }

        const data = await res.json();
        if (data.authenticated && isMounted) {
          setAdminUser(data.admin);
          setCheckingAuth(false);
        } else if (isMounted) {
          router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch {
        if (isMounted) {
          router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/login', { method: 'DELETE' });
    } catch {}
    router.push('/admin/login');
    router.refresh();
  };

  // If on admin login page, render children directly without admin layout sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading skeleton while verifying admin session
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Verifying Admin Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* ─── Mobile Sticky Top Header (md:hidden) ─── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 -ml-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/logo.png" alt="NayaKapda.com" className="h-8 w-auto object-contain" />
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {adminUser && (
            <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              {(adminUser.name || adminUser.email)[0].toUpperCase()}
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* ─── Mobile Slide-out Drawer Menu (md:hidden) ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo.png" alt="NayaKapda.com" className="h-10 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Admin Profile Info */}
            {adminUser && (
              <div className="p-3 mx-3 mt-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {adminUser.name || 'Administrator'}
                  </span>
                  <span className="badge-orange text-[9px] font-extrabold uppercase px-1.5 py-0.2">
                    {adminUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">{adminUser.email}</p>
              </div>
            )}

            {/* Nav Items */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer / Sign Out */}
            <div className="p-3 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Desktop Sticky Sidebar (hidden md:flex) ─── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-200 bg-white flex-col shadow-xs min-h-screen sticky top-0 h-screen">
        {/* Brand header */}
        <div className="p-5 border-b border-slate-200">
          <Link href="/admin" className="block">
            <img src="/logo.png" alt="NayaKapda.com" className="h-12 w-auto object-contain mb-1" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Admin Portal</span>
              {adminUser?.role && (
                <span className="badge-orange text-[9px] font-extrabold uppercase px-1.5 py-0.5">
                  {adminUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout button */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          {adminUser && (
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-900 truncate">
                {adminUser.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{adminUser.email}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area (Fluid & Responsive) ─── */}
      <main className="flex-1 overflow-x-hidden min-w-0 bg-slate-50">{children}</main>
    </div>
  );
}
