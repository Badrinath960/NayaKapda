import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { verifyVerifiedLoginToken } from '@/lib/device';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
        verifiedToken: { label: 'Verified Token', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { phone, password, verifiedToken } = parsed.data;

        // If authenticated via 2FA OTP verified token
        if (verifiedToken) {
          const verification = verifyVerifiedLoginToken(verifiedToken);
          if (!verification.valid || !verification.payload) return null;
          if (verification.payload.phone !== phone) return null;

          const user = await prisma.user.findUnique({
            where: { id: verification.payload.userId },
          });

          if (!user || !user.active) return null;
          if (user.role !== 'CUSTOMER') return null;

          return {
            id: user.id,
            phone: user.phone,
            email: user.email ?? undefined,
            name: user.name ?? undefined,
            role: user.role,
          };
        }

        // Standard password authentication (for trusted devices)
        const user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user || !user.active) return null;
        if (user.role !== 'CUSTOMER') return null; // Admins use separate JWT

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          phone: user.phone,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).phone = token.phone;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'nayakapda-production-nextauth-secret-key-2026',
};
