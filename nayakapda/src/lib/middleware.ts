import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyAdminJwt, AdminJWTPayload } from '@/lib/adminAuth';

export type { AdminJWTPayload };

type AdminRouteHandler = (
  request: NextRequest,
  context: { params: any },
  admin: AdminJWTPayload
) => Promise<NextResponse>;

type CustomerRouteHandler = (
  request: NextRequest,
  context: { params: any },
  session: { userId: string; phone: string; role: string }
) => Promise<NextResponse>;

// ─────────────────────────────────────────
// ERROR HANDLER HOC
// ─────────────────────────────────────────

/**
 * Wraps API route handlers to catch unhandled errors.
 * Prevents stack trace leakage by returning a safe HTTP 500.
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('[API Error]', error);
      return NextResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
        { status: 500 }
      );
    }
  }) as T;
}

// ─────────────────────────────────────────
// CUSTOMER AUTH GUARD
// ─────────────────────────────────────────

/**
 * Middleware HOC that requires a valid NextAuth session.
 * Returns 401 if unauthenticated.
 */
export function withCustomerAuth(handler: CustomerRouteHandler) {
  return withErrorHandler(async (request: NextRequest, context: { params: any }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return handler(request, context, {
      userId: (session.user as any).id,
      phone: (session.user as any).phone,
      role: (session.user as any).role,
    });
  });
}

// ─────────────────────────────────────────
// ADMIN AUTH GUARD
// ─────────────────────────────────────────



/**
 * Middleware HOC for admin routes.
 * Verifies admin JWT cookie.
 * - Returns 401 if cookie is missing or invalid.
 * - Returns 403 if role is insufficient.
 *
 * Property 10: For any SUPER_ADMIN-only route, STAFF role JWT always receives HTTP 403.
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export function withAdminAuth(handler: AdminRouteHandler, requiredRole?: 'SUPER_ADMIN') {
  return withErrorHandler(async (request: NextRequest, context: { params: any }) => {
    const token = request.cookies.get('admin-session')?.value;

    const authResult = await verifyAdminJwt(token);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Invalid or missing admin session' }, { status: 401 });
    }

    const payload = authResult.payload;

    if (requiredRole && payload.role !== requiredRole) {
      return NextResponse.json(
        { error: 'FORBIDDEN', requiredRole, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, context, payload);
  });
}

// ─────────────────────────────────────────
// RATE LIMITING (simple in-memory, production should use Redis)
// ─────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-backed implementation.
 *
 * Requirements: 23.2
 */
export function checkRateLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // Allowed
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count++;
  return true;
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
