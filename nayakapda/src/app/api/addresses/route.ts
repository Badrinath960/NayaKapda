import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCustomerAuth } from '@/lib/middleware';
import { z } from 'zod';

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  line1: z.string().min(1, 'Address line is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India'),
});

// GET /api/addresses — list saved addresses
export const GET = withCustomerAuth(async (request: NextRequest, context: any, session) => {
  const addresses = await prisma.address.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, data: addresses });
});

// POST /api/addresses — create address
export const POST = withCustomerAuth(async (request: NextRequest, context: any, session) => {
  const body = await request.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });
  }
  const address = await prisma.address.create({
    data: { ...parsed.data, userId: session.userId },
  });
  return NextResponse.json({ success: true, data: address }, { status: 201 });
});
