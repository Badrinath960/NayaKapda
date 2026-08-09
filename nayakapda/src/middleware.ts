import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'nayakapda-production-nextauth-secret-key-2026';

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    secret: AUTH_SECRET,
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname.startsWith('/account')) return !!token;
        if (pathname.startsWith('/checkout')) return !!token;
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*'],
};
