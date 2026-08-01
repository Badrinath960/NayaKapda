import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL!;
  // Enable SSL only for cloud-hosted databases (Neon, Supabase, RDS, etc.)
  // Local PostgreSQL does not support SSL and will fail if ssl is forced on
  const isCloudDb = dbUrl.includes('neon.tech') ||
                    dbUrl.includes('amazonaws.com') ||
                    dbUrl.includes('supabase.co') ||
                    dbUrl.includes('sslmode=require');

  const pool = new Pool({
    connectionString: dbUrl,
    // max:1 prevents connection exhaustion on Vercel serverless
    max: 1,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
