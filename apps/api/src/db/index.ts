import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import 'dotenv/config';

/* A serverless instance handles one request at a time: one connection each,
   through Neon's pooler. A long-running server can keep a few open. */
const client = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  prepare: false,
  max: process.env.VERCEL ? 1 : 10,
});

/* Query logging only on request (DB_LOG=1); in production it drowned the logs. */
export const db = drizzle(client, { schema, logger: process.env.DB_LOG === '1' });
