import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DB_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:badri@123@localhost:5432/nayakapda_tshirt';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'node prisma/run-seed.js',
  },
  datasource: {
    url: DB_URL,
  },
});
