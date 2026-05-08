import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function updateGenres() {
  console.log('Genre güncelleme başlıyor...');

  const allContent = await db.select({
    id: schema.content.id,
    tmdbId: schema.content.tmdbId,
    type: schema.content.type,
  }).from(schema.content);

  console.log(`${allContent.length} içerik güncellenecek...`);

  let done = 0;
  const batchSize = 10;

  for (let i = 0; i < allContent.length; i += batchSize) {
    const batch = allContent.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (item) => {
        const endpoint = item.type === 'movie'
          ? `/movie/${item.tmdbId}`
          : `/tv/${item.tmdbId}`;

        const res = await fetch(`${BASE_URL}${endpoint}?api_key=${TMDB_KEY}&language=tr-TR`);
        if (!res.ok) return;

        const data = await res.json() as any;
        const genreIds: number[] = (data.genres ?? []).map((g: any) => g.id);

        await db
          .update(schema.content)
          .set({ genreIds })
          .where(eq(schema.content.id, item.id));
      }),
    );

    done += batch.length;
    if (done % 100 === 0) console.log(`${done}/${allContent.length}...`);
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('Tamamlandı!');
}

updateGenres().catch(console.error);
