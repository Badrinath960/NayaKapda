import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verifyAdminJwt } from '@/lib/adminAuth';

const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'nayakapda-production-nextauth-secret-key-2026';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─────────────────────────────────────────
  // 1. ADMIN ROUTE PROTECTION
  // ─────────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminToken = req.cookies.get('admin-session')?.value;
    const authResult = await verifyAdminJwt(adminToken);

    // If accessing the admin login page
    if (pathname === '/admin/login') {
      if (authResult.valid) {
        // Already logged in as admin -> redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }

    // All other /admin/* routes require a valid admin JWT
    if (!authResult.valid) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ─────────────────────────────────────────
  // 2. CUSTOMER ROUTE PROTECTION (/account/*, /checkout/*)
  // ─────────────────────────────────────────
  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    const token = await getToken({ req, secret: AUTH_SECRET });

    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/checkout/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
