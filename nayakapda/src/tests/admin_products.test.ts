import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/prisma', () => {
  const mockTx = {
    product: {
      update: vi.fn(),
    },
    pricingTier: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    stockAlertSubscription: {
      deleteMany: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    productVariant: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  return {
    prisma: {
      product: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      pricingTier: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
      },
      $transaction: vi.fn(async (cb) => cb(mockTx)),
      _mockTx: mockTx,
    },
  };
});

// Mock admin auth token verification
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

import { PATCH as updateProduct, GET as getProduct, DELETE as deleteProduct } from '@/app/api/admin/products/[id]/route';
import { POST as createProduct, GET as listProducts } from '@/app/api/admin/products/route';
import { prisma } from '@/lib/prisma';

describe('Admin Product Management API & Backend Logic', () => {
  const mockTx = (prisma as any)._mockTx;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /api/admin/products/[id]', () => {
    it('successfully updates product details without error on deletedVariantIds', async () => {
      const existingProduct = {
        id: 'prod_123',
        name: 'AcidWash Oversized 240gsm',
        categoryId: 'cat_acid',
        basePrice: 450,
        pricingTiers: [{ minQty: 10, maxQty: null, pricePerPiece: 380 }],
        variants: [{ id: 'var_1', sku: 'ACID-BLK-M', size: 'M', color: 'Black', stockQty: 50, active: true }],
      };

      (prisma.product.findUnique as any).mockResolvedValue(existingProduct);
      mockTx.product.update.mockResolvedValue({
        ...existingProduct,
        name: 'AcidWash Oversized 240gsm - Updated',
        basePrice: 480,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/products/prod_123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: 'admin-session=valid-token',
        },
        body: JSON.stringify({
          name: 'AcidWash Oversized 240gsm - Updated',
          basePrice: 480,
          gsm: 240,
          deletedVariantIds: ['var_old_deleted'],
          pricingTiers: [{ minQty: 10, maxQty: null, pricePerPiece: 400 }],
          variants: [
            { id: 'var_1', sku: 'ACID-BLK-M', size: 'M', color: 'Black', stockQty: 100, active: true },
            { sku: 'ACID-WHT-L', size: 'L', color: 'White', stockQty: 80, active: true },
          ],
        }),
      });

      const context = {
        params: Promise.resolve({ id: 'prod_123' }),
      };

      const response = await updateProduct(request, context);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // Verify deletedVariantIds was NOT passed to tx.product.update
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: 'prod_123' },
        data: expect.not.objectContaining({ deletedVariantIds: expect.anything() }),
      });

      // Verify pricing tier update and audit logging
      expect(mockTx.pricingTier.deleteMany).toHaveBeenCalledWith({ where: { productId: 'prod_123' } });
      expect(mockTx.pricingTier.createMany).toHaveBeenCalledWith({
        data: [{ productId: 'prod_123', minQty: 10, maxQty: null, pricePerPiece: 400 }],
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('returns 404 if product does not exist', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/products/prod_nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', cookie: 'admin-session=valid-token' },
        body: JSON.stringify({ name: 'New Name' }),
      });

      const response = await updateProduct(request, { params: Promise.resolve({ id: 'prod_nonexistent' }) });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.success).toBe(false);
    });
  });

  describe('POST /api/admin/products', () => {
    it('creates a new product with slug generation', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);
      (prisma.product.create as any).mockResolvedValue({
        id: 'prod_new',
        name: 'New Oversized Tee',
        slug: 'new-oversized-tee',
        categoryId: 'cat_1',
        basePrice: 350,
      });

      const request = new NextRequest('http://localhost:3000/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: 'admin-session=valid-token' },
        body: JSON.stringify({
          name: 'New Oversized Tee',
          categoryId: 'cat_1',
          basePrice: 350,
          gsm: 220,
        }),
      });

      const response = await createProduct(request, {} as any);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'New Oversized Tee',
          categoryId: 'cat_1',
          basePrice: 350,
          gsm: 220,
          slug: 'new-oversized-tee',
        },
      });
    });
  });
});
