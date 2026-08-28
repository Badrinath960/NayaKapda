import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
    productPhoto: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: vi.fn((options, callback) => {
        return {
          write: vi.fn(),
          end: vi.fn(),
          on: vi.fn(),
          once: vi.fn(),
          emit: vi.fn(),
        };
      }),
    },
  },
}));

vi.mock('@/lib/adminAuth', () => ({
  verifyAdminJwt: vi.fn(async () => {
    return {
      valid: true,
      payload: {
        adminId: 'admin_123',
        email: 'admin@nayakapda.com',
        role: 'SUPER_ADMIN',
      },
    };
  }),
}));

import { GET as getPhotos, POST as uploadPhoto } from '@/app/api/admin/products/[id]/photos/route';
import { prisma } from '@/lib/prisma';

describe('Next.js 15 Async Params & Product Photo Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps async context.params correctly when listing photos', async () => {
    const mockPhotos = [
      { id: 'photo_1', url: 'https://example.com/p1.jpg', altText: 'Front', sortOrder: 0, productId: 'prod_123', publicId: 'p1', createdAt: '2026-08-28T09:00:00.000Z' },
    ];
    (prisma.productPhoto.findMany as any).mockResolvedValue(mockPhotos);

    const request = new NextRequest('http://localhost:3000/api/admin/products/prod_123/photos', {
      headers: { cookie: 'admin-session=valid-token' },
    });

    const context = {
      params: Promise.resolve({ id: 'prod_123' }),
    };

    const response = await getPhotos(request, context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockPhotos);
    expect(prisma.productPhoto.findMany).toHaveBeenCalledWith({
      where: { productId: 'prod_123' },
      orderBy: { sortOrder: 'asc' },
    });
  });

  it('rejects photo upload with 404 when product is not found', async () => {
    (prisma.product.findUnique as any).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/products/prod_999/photos', {
      method: 'POST',
      headers: { cookie: 'admin-session=valid-token' },
    });

    const context = {
      params: Promise.resolve({ id: 'prod_999' }),
    };

    const response = await uploadPhoto(request, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Product not found');
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'prod_999' },
    });
  });
});
