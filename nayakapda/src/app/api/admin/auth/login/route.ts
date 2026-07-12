import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { adminLoginSchema, validateRequest } from '@/lib/validation';
import { withErrorHandler } from '@/lib/middleware';

// POST /api/admin/auth/login
// Requirements: 2.1, 2.2
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateRequest(adminLoginSchema, body);

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 });
  }

  const { email, password } = validation.data;

  const user = await prisma.user.findFirst({
    where: {
      email,
      role: { in: ['STAFF', 'SUPER_ADMIN'] },
      active: true,
    },
  });

  if (!user) {
    // Don't reveal whether email exists or role issue — generic error
    return NextResponse.json(
      { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      { status: 401 }
    );
  }

  const payload = {
    adminId: user.id,
    email: user.email!,
    role: user.role as 'STAFF' | 'SUPER_ADMIN',
  };

  const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET!, { expiresIn: '8h' });

  const response = NextResponse.json({
    data: {
      adminId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    message: 'Login successful',
  });

  response.cookies.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60, // 8 hours
    path: '/',
  });

  return response;
});

// POST /api/admin/auth/logout
export const DELETE = withErrorHandler(async () => {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.delete('admin-session');
  return response;
});
