import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';

// GET /api/admin/customers?page=1&limit=20&search=
export const GET = withAdminAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const search = searchParams.get('search') ?? '';
  const skip = (page - 1) * limit;

  const where: any = {
    role: 'CUSTOMER',
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true } },
        creditLine: { select: { limitAmount: true, usedAmount: true } },
        orders: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmount: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const customers = users.map((user) => {
    const totalOrderValue = user.orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      totalOrderValue,
      creditLine: user.creditLine
        ? {
            limitAmount: Number(user.creditLine.limitAmount),
            usedAmount: Number(user.creditLine.usedAmount),
          }
        : null,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
});
