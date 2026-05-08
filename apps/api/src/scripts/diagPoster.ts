import 'dotenv/config';
import { db } from '@/db';
import { content } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const stats = await db.execute(sql`
    SELECT
      COUNT(*) as total,
      COUNT(poster_url) as has_poster,
      COUNT(*) - COUNT(poster_url) as null_poster,
      COUNT(CASE WHEN poster_url = '' THEN 1 END) as empty_poster
    FROM content
  `);
  console.log('DB poster durumu:', JSON.stringify(stats.rows ?? stats, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
