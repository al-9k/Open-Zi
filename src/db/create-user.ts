import 'dotenv/config';
import { db } from '../index.js';
import { users } from './schema.js';

await db.insert(users)
  .values({ id: 'default-user', username: 'Default' })
  .onConflictDoNothing();

console.log('✅ default-user ready.');
process.exit(0);
