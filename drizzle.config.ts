import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const localFallbackUrl = 'postgres://postgres:password@localhost:5432/local_db'; // fallback

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || localFallbackUrl,
  },
});
