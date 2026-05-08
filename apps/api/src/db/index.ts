import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import 'dotenv/config';

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', prepare: false });
export const db = drizzle(client, { schema, logger: true });
