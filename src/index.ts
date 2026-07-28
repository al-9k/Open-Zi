import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

const localFallbackUrl = 'postgres://postgres:password@localhost:5432/local_db'; // fallback

export const db = drizzle(process.env.DATABASE_URL || localFallbackUrl);
