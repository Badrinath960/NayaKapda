import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';

// GET /api/admin/categories — list all categories for admin product dropdowns
export const GET = withAdminAuth(async (request: NextRequest) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ success: true, data: categories });
});
