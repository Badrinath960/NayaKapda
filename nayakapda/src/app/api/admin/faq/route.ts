import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { z } from 'zod';

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

// GET /api/admin/faq — list all FAQs for admin
export const GET = withAdminAuth(async (request: NextRequest) => {
  const faqs = await prisma.fAQEntry.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ success: true, data: faqs });
});

// POST /api/admin/faq — create FAQ
export const POST = withAdminAuth(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });
  }

  const faq = await prisma.fAQEntry.create({
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: faq }, { status: 201 });
});
