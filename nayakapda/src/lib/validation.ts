import { z } from 'zod';

// ─────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Phone number must be 10 digits and start with 6, 7, 8, or 9');

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  referralCode: z.string().optional(),
});

// ─────────────────────────────────────────
// PRODUCT & CATALOG SCHEMAS
// ─────────────────────────────────────────

export const pricingTierQuerySchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  cumulativeQty: z.coerce.number().int().positive('Quantity must be a positive integer'),
});

export const productQuerySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─────────────────────────────────────────
// CART SCHEMAS
// ─────────────────────────────────────────

export const bulkAddSchema = z.object({
  rows: z
    .array(
      z.object({
        variantId: z.string().cuid('Invalid variant ID'),
        qty: z.number().int().positive('Quantity must be a positive integer'),
      })
    )
    .min(1, 'At least one row is required'),
});

export const cartItemUpdateSchema = z.object({
  qty: z.number().int().positive('Quantity must be a positive integer'),
});

// ─────────────────────────────────────────
// DISCOUNT SCHEMAS
// ─────────────────────────────────────────

export const discountValidateSchema = z.object({
  code: z.string().min(1, 'Discount code is required').max(50),
  cartTotal: z.number().positive('Cart total must be positive'),
  totalQty: z.number().int().positive('Total quantity must be positive'),
});

// ─────────────────────────────────────────
// SHIPPING SCHEMAS
// ─────────────────────────────────────────

export const shippingCalculateSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  totalPieces: z.number().int().min(1, 'Total pieces must be at least 1'),
});

// ─────────────────────────────────────────
// ADDRESS SCHEMAS
// ─────────────────────────────────────────

export const addressSchema = z
  .object({
    label: z.string().optional(),
    line1: z.string().min(5, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string(),
    country: z.string().default('India'),
  })
  .superRefine((data, ctx) => {
    if (data.country === 'India') {
      if (!/^\d{6}$/.test(data.pincode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indian pincode must be exactly 6 digits',
          path: ['pincode'],
        });
      }
    }
  });

// ─────────────────────────────────────────
// ORDER SCHEMAS
// ─────────────────────────────────────────

export const placeOrderSchema = z.object({
  addressId: z.string().cuid('Invalid address ID'),
  shippingMethodId: z.string().cuid('Invalid shipping method ID').optional(),
  paymentMode: z.enum(['PREPAID', 'COD', 'CREDIT']),
  discountCodeId: z.string().cuid('Invalid discount code ID').optional(),
  razorpayPaymentId: z.string().optional(),
});

// ─────────────────────────────────────────
// ADMIN SCHEMAS
// ─────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createProductSchema = z.object({
  categoryId: z.string().cuid('Invalid category ID'),
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  gsm: z.number().int().positive().optional(),
  fabricComposition: z.string().optional(),
  basePrice: z.number().positive('Base price must be positive'),
  active: z.boolean().default(true),
});

export const createVariantSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  sku: z.string().min(1, 'SKU is required'),
  stockQty: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const createPricingTierSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  minQty: z.number().int().positive('Minimum quantity must be positive'),
  maxQty: z.number().int().positive().optional().nullable(),
  pricePerPiece: z.number().positive('Price must be positive'),
});

export const createDiscountCodeSchema = z.object({
  code: z.string().min(2).max(50),
  type: z.enum(['PERCENT', 'FLAT']),
  value: z.number().positive(),
  minOrderQty: z.number().int().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  active: z.boolean().default(true),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  cancelReason: z.string().optional(),
});

export const updateCreditLineSchema = z.object({
  limitAmount: z.number().positive('Credit limit must be positive'),
});

export const createFAQSchema = z.object({
  question: z.string().min(5, 'Question is required'),
  answer: z.string().min(5, 'Answer is required'),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const createShippingMethodSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  etaText: z.string().min(2, 'ETA text is required'),
  cost: z.number().min(0, 'Cost must be non-negative'),
  regionLimited: z.boolean().default(false),
  regionPincodes: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// ─────────────────────────────────────────
// VALIDATION HELPER
// ─────────────────────────────────────────

/**
 * Validates request data against a Zod schema.
 * Returns parsed data on success, or throws/returns errors on failure.
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; errors: z.ZodError['flatten'] extends () => infer R ? R : never } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.flatten() };
}

/**
 * Phone validation function — pure, testable
 * Property 1: For any string not exactly 10 digits starting with 6-9, returns false
 */
export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
