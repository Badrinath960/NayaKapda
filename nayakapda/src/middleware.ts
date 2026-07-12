import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
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
