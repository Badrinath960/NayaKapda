import { SignJWT, jwtVerify } from 'jose';

export type AdminJWTPayload = {
  adminId: string;
  email: string;
  role: 'STAFF' | 'SUPER_ADMIN';
  name?: string;
};

export function getAdminSecret(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'nayakapda-admin-jwt-secret-key-2026-production-b2b';
  return new TextEncoder().encode(secret);
}

/**
 * Sign an admin JWT with an 8-hour expiry using Edge-compatible jose
 */
export async function signAdminJwt(payload: AdminJWTPayload): Promise<string> {
  const secret = getAdminSecret();
  return await new SignJWT({
    adminId: payload.adminId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

/**
 * Verify an admin JWT cookie value. Returns { valid, payload }
 */
export async function verifyAdminJwt(
  token: string | undefined | null
): Promise<{ valid: boolean; payload?: AdminJWTPayload }> {
  if (!token) return { valid: false };

  try {
    const secret = getAdminSecret();
    const { payload } = await jwtVerify(token, secret);
    return {
      valid: true,
      payload: {
        adminId: payload.adminId as string,
        email: payload.email as string,
        role: payload.role as 'STAFF' | 'SUPER_ADMIN',
        name: payload.name as string | undefined,
      },
    };
  } catch {
    return { valid: false };
  }
}
