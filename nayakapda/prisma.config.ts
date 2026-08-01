import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local for local development.
// In Vercel/CI, env vars are injected directly by the platform.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local for local dev, or to your Vercel environment variables for production.'
  );
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'node prisma/run-seed.js',
  },
  datasource: {
    // Prisma 7 only supports `url` and `shadowDatabaseUrl` in defineConfig.
    // Use the Neon pooled URL here for runtime queries.
    // For migrations (prisma migrate deploy), Prisma CLI uses this same URL.
    url: process.env.DATABASE_URL,
  },
});
