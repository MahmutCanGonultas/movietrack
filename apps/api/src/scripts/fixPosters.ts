import 'dotenv/config';
import { db } from '@/db';
import { content } from '@/db/schema';
import { isNull, eq, and } from 'drizzle-orm';

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE = 'https://api.themoviedb.org/3';

async function fetchPoster(tmdbId: number, type: 'movie' | 'tv'): Promise<string | null> {
  const endpoint = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  try {
    const res = await fetch(`${BASE}${endpoint}?api_key=${TMDB_KEY}&language=tr-TR`);
    if (!res.ok) return null;
    const data = await res.json() as { poster_path?: string };
    return data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;
  } catch {
    return null;
  }
}

async function main() {
  const items = await db
    .select({ id: content.id, tmdbId: content.tmdbId, type: content.type, title: content.title })
    .from(content)
    .where(isNull(content.posterUrl));

  console.log(`${items.length} item poster'siz — TMDB'den çekilecek...`);

  let fixed = 0;
  let notFound = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const posterUrl = await fetchPoster(item.tmdbId, item.type as 'movie' | 'tv');

    if (posterUrl) {
      await db.update(content).set({ posterUrl }).where(eq(content.id, item.id));
      fixed++;
    } else {
      notFound++;
    }

    process.stdout.write(`\r${i + 1}/${items.length} — ✓${fixed} düzeltildi, ✗${notFound} yok — ${item.title.slice(0, 35)}`);
    await new Promise((r) => setTimeout(r, 260)); // TMDB rate limit güvenli
  }

  console.log(`\n\nBitti! ${fixed} poster eklendi, ${notFound} TMDB'de de yok.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
