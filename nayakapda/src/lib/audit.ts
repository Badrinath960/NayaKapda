import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

type AuditLogInput = {
  adminId: string;
  action: AuditAction;
  entity: string; // 'PricingTier' | 'DiscountCode' | 'CreditLine'
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

/**
 * Records an admin action in the AuditLog table.
 *
 * Property 11: For any admin action that modifies PricingTier, DiscountCode, or CreditLine,
 * the Audit_Logger SHALL produce exactly one audit record containing admin ID, action type,
 * timestamp, and before/after values.
 *
 * Requirements: 16.6, 18.3, 20.5, 23.7
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: (input.before ?? undefined) as any,
      after: (input.after ?? undefined) as any,
    },
  });
}

/**
 * Convenience wrapper for update operations.
 */
export async function auditUpdate(
  adminId: string,
  entity: string,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  await recordAuditLog({ adminId, action: AuditAction.UPDATE, entity, entityId, before, after });
}

/**
 * Convenience wrapper for create operations.
 */
export async function auditCreate(
  adminId: string,
  entity: string,
  entityId: string,
  after: Record<string, unknown>
): Promise<void> {
  await recordAuditLog({ adminId, action: AuditAction.CREATE, entity, entityId, after });
}

/**
 * Convenience wrapper for delete operations.
 */
export async function auditDelete(
  adminId: string,
  entity: string,
  entityId: string,
  before: Record<string, unknown>
): Promise<void> {
  await recordAuditLog({ adminId, action: AuditAction.DELETE, entity, entityId, before });
}
