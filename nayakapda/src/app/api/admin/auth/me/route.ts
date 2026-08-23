import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/middleware';
import { verifyAdminJwt } from '@/lib/adminAuth';

// GET /api/admin/auth/me
export const GET = withErrorHandler(async (request: NextRequest) => {
  const token = request.cookies.get('admin-session')?.value;

  const auth = await verifyAdminJwt(token);
  if (!auth.valid || !auth.payload) {
    return NextResponse.json({ authenticated: false, error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      adminId: auth.payload.adminId,
      email: auth.payload.email,
      role: auth.payload.role,
      name: auth.payload.name,
    },
  });
});
