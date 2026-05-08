import 'dotenv/config';
import { db } from '@/db';
import { content } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.execute(sql`UPDATE content SET embedding = NULL`);
  console.log('Tüm embeddingler sıfırlandı. Şimdi ai:embeddings çalıştırabilirsin.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
