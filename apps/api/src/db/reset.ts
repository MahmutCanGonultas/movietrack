import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function reset() {
  console.log('Tüm tablolar siliniyor...');
  await sql`DROP TABLE IF EXISTS user_content CASCADE`;
  await sql`DROP TABLE IF EXISTS accounts CASCADE`;
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS verifications CASCADE`;
  await sql`DROP TABLE IF EXISTS content CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  await sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`;
  console.log('Silindi. Şimdi pnpm db:migrate çalıştırabilirsin.');
}

reset().catch(console.error);
