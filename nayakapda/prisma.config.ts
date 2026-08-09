import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local for local development.
// In Vercel/CI, env vars are injected directly by the platform.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nayakapda_tshirt';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'node prisma/run-seed.js',
  },
  datasource: {
    // Prisma 7 only supports `url` and `shadowDatabaseUrl` in defineConfig.
    // Use DATABASE_URL from env, or fallback for CI/build generation.
    url: dbUrl,
  },
});
