'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/products', label: 'Products', icon: '👕' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/discounts', label: 'Discounts', icon: '🏷️' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/login', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <Link href="/" className="text-xl font-black gradient-text">NayaKapda</Link>
          <p className="text-xs text-gray-600 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  ? 'bg-orange-500/10 text-orange-400 font-medium border border-orange-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
