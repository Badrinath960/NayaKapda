import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
      label: 'Referral',
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
    <div style={{ minHeight: '100vh', background: '#030712' }}>
      <div className="page-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <aside
            className="glass"
            style={{
              width: 240,
              flexShrink: 0,
              padding: '1.5rem',
              position: 'sticky',
              top: '5rem',
            }}
          >
            {/* User info */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(249,115,22,0.15)',
                  border: '2px solid rgba(249,115,22,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#f97316',
                  marginBottom: '0.75rem',
                }}
              >
                {userName[0]?.toUpperCase() ?? 'U'}
              </div>
              <p style={{ fontWeight: 600, color: '#f9fafb', fontSize: '0.9rem', margin: 0 }}>{userName}</p>
              {userPhone && (
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{userPhone}</p>
              )}
            </div>

            {/* Nav links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.625rem',
                    color: '#d1d5db',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}
                  className="account-nav-link"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Quick links */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link
                href="/products"
                className="btn-primary"
                style={{ width: '100%', fontSize: '0.8rem', padding: '0.625rem 1rem' }}
              >
                Browse Products
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
        </div>
      </div>

      <style>{`
        .account-nav-link:hover {
          background: rgba(31,41,55,0.8);
          color: #f9fafb;
        }
      `}</style>
    </div>
  );
}
