import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/lib/middleware';
import { z } from 'zod';
import { AuditAction } from '@prisma/client';
import { recordAuditLog } from '@/lib/audit';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().cuid().optional(),
  description: z.string().optional(),
  gsm: z.number().int().positive().nullable().optional(),
  fabricComposition: z.string().optional(),
  basePrice: z.number().positive().optional(),
  active: z.boolean().optional(),
  pricingTiers: z
    .array(
      z.object({
        minQty: z.number().int().positive(),
        maxQty: z.number().int().positive().nullable(),
        pricePerPiece: z.number().positive(),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.string().min(1),
        color: z.string().min(1),
        sku: z.string().min(1),
        stockQty: z.number().int().nonnegative(),
        active: z.boolean().default(true),
      })
    )
    .optional(),
  // IDs of variants to permanently delete
  deletedVariantIds: z.array(z.string()).optional(),
});

// GET /api/admin/products/[id] — get product detail including variants and tiers
export const GET = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
      pricingTiers: { orderBy: { minQty: 'asc' } },
      photos: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!product) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      ...product,
      basePrice: Number(product.basePrice),
      pricingTiers: product.pricingTiers.map((t) => ({
        ...t,
        pricePerPiece: Number(t.pricePerPiece),
      })),
    },
  });
});

// PATCH /api/admin/products/[id] — update product, variants, and pricing tiers
export const PATCH = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, admin) => {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { pricingTiers: true, variants: true },
  });
  if (!existing) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

  const { pricingTiers, variants, ...productFields } = parsed.data;

  // Run in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update basic product info
    const updatedProduct = await tx.product.update({
      where: { id },
      data: {
        ...productFields,
        ...(productFields.basePrice !== undefined && { basePrice: productFields.basePrice }),
      },
    });

    // 2. Update Pricing Tiers if provided
    if (pricingTiers !== undefined) {
      // Delete old pricing tiers
      await tx.pricingTier.deleteMany({ where: { productId: id } });
      // Create new tiers
      await tx.pricingTier.createMany({
        data: pricingTiers.map((tier) => ({
          productId: id,
          minQty: tier.minQty,
          maxQty: tier.maxQty,
          pricePerPiece: tier.pricePerPiece,
        })),
      });

      // Audit log pricing tier change
      await recordAuditLog({
        adminId: admin.adminId,
        action: AuditAction.UPDATE,
        entity: 'PricingTier',
        entityId: id,
        before: { tiers: existing.pricingTiers.map((t) => ({ minQty: t.minQty, maxQty: t.maxQty, price: Number(t.pricePerPiece) })) },
        after: { tiers: pricingTiers },
      });
    }

    // 3. Delete variants marked for removal
    if (parsed.data.deletedVariantIds && parsed.data.deletedVariantIds.length > 0) {
      await tx.productVariant.deleteMany({
        where: {
          id: { in: parsed.data.deletedVariantIds },
          productId: id, // safety: only delete variants belonging to this product
        },
      });
    }

    // 4. Update Variants if provided
    if (variants !== undefined) {
      // Simple sync: update existing or create new ones
      for (const variant of variants) {
        if (variant.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              stockQty: variant.stockQty,
              active: variant.active,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              stockQty: variant.stockQty,
              active: variant.active,
            },
          });
        }
      }
    }

    return updatedProduct;
  });

  return NextResponse.json({ success: true, data: updated });
});

// DELETE /api/admin/products/[id] — delete product
export const DELETE = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, admin) => {
  const { id } = await context.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

  await recordAuditLog({
    adminId: admin.adminId,
    action: AuditAction.DELETE,
    entity: 'Product',
    entityId: id,
    before: { name: existing.name },
  });

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
