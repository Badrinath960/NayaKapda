import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'My Account — NayaKapda',
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?redirect=/account');
  }

  const navLinks = [
    {
      href: '/account',
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: '/account/orders',
      label: 'Order History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      href: '/account/credit-line',
      label: 'Credit Line',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      href: '/account/referral',
      label: 'Referral Program',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const userName = (session.user as any)?.name ?? 'Account';
  const userPhone = (session.user as any)?.phone ?? '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex-grow page-container py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar */}
          <aside className="card p-5 w-full md:w-60 flex-shrink-0 bg-white border-slate-200 shadow-sm sticky top-24">
            {/* User info */}
            <div className="mb-5 pb-5 border-b border-slate-200">
              <div className="w-12 h-12 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-lg font-black text-orange-600 mb-3">
                {userName[0]?.toUpperCase() ?? 'U'}
              </div>
              <p className="font-bold text-slate-900 text-sm">{userName}</p>
              {userPhone && (
                <p className="text-slate-500 text-xs mt-0.5 font-medium">{userPhone}</p>
              )}
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 font-semibold text-xs transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Quick links */}
            <div className="mt-5 pt-5 border-t border-slate-200">
              <Link
                href="/products"
                className="btn-primary w-full text-center block text-xs py-2.5 font-bold shadow-sm"
              >
                Browse Products
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 w-full">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
