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
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-xs">
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 min-w-0">{children}</main>
    </div>
  );
}
