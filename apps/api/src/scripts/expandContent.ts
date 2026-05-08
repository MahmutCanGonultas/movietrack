import 'dotenv/config';
import { db } from '@/db';
import { content } from '@/db/schema';

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE = 'https://api.themoviedb.org/3';
const BATCH = 100;

// TMDB discover — vote_count filtresi ile kaliteli içerik, puan filtresi yok
// sort_by=vote_count.desc → en çok oy alandan başla (en tanınmış içerikler)
async function discoverPages(type: 'movie' | 'tv', maxPages: number): Promise<any[]> {
  const results: any[] = [];
  const endpoint = `/discover/${type}`;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const params = new URLSearchParams({
        api_key: TMDB_KEY!,
        language: 'tr-TR',
        sort_by: 'vote_count.desc',
        'vote_count.gte': '100',    // gerçek ilgi görmüş içerikler
        include_adult: 'false',
        page: String(page),
      });
      const res = await fetch(`${BASE}${endpoint}?${params}`);
      if (!res.ok) { console.error(`  Sayfa ${page} başarısız: ${res.status}`); break; }
      const data = (await res.json()) as { results: any[]; total_pages: number };
      results.push(...data.results);

      if (page % 50 === 0) process.stdout.write(`\r  ${type} — ${page}/${Math.min(maxPages, data.total_pages)} sayfa (${results.length} sonuç)`);
      if (page >= data.total_pages) break;

      await new Promise((r) => setTimeout(r, 260));
    } catch (e: any) {
      console.error(`  Hata sayfa ${page}: ${e.message}`);
      break;
    }
  }
  console.log(`\r  ${type} — ${results.length} sonuç çekildi          `);
  return results;
}

function toMovieRow(m: any) {
  return {
    tmdbId: m.id as number,
    type: 'movie' as const,
    title: (m.title ?? m.original_title ?? '') as string,
    overview: (m.overview ?? null) as string | null,
    posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    releaseYear: m.release_date ? parseInt(m.release_date.split('-')[0]) : null,
    tmdbRating: m.vote_average != null ? String(m.vote_average) : null,
    genreIds: (m.genre_ids ?? []) as number[],
  };
}

function toTVRow(t: any) {
  return {
    tmdbId: t.id as number,
    type: 'tv' as const,
    title: (t.name ?? t.original_name ?? '') as string,
    overview: (t.overview ?? null) as string | null,
    posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
    releaseYear: t.first_air_date ? parseInt(t.first_air_date.split('-')[0]) : null,
    tmdbRating: t.vote_average != null ? String(t.vote_average) : null,
    genreIds: (t.genre_ids ?? []) as number[],
  };
}

async function main() {
  // TMDB discover en fazla 500 sayfa döndürür (500 × 20 = 10.000 per type)
  const MAX_PAGES = 500;

  console.log('TMDB Discover başlıyor — hedef ~20.000 içerik...');
  console.log('  Filtre: vote_count >= 100 | sıralama: en çok oy alandan\n');

  const [movies, tvShows] = await Promise.all([
    discoverPages('movie', MAX_PAGES),
    discoverPages('tv', MAX_PAGES),
  ]);

  console.log(`\nTMDB: ${movies.length} film + ${tvShows.length} dizi = ${movies.length + tvShows.length} toplam`);

  // Mevcut tmdbId'leri çek
  const existingMovies = await db.select({ tmdbId: content.tmdbId }).from(content);
  const existingSet = new Set(existingMovies.map((r) => r.tmdbId));

  const newMovies = movies.filter((m) => !existingSet.has(m.id)).map(toMovieRow);
  const newTV = tvShows.filter((t) => !existingSet.has(t.id)).map(toTVRow);

  console.log(`Yeni: ${newMovies.length} film + ${newTV.length} dizi eklenecek`);

  // Toplu insert
  let inserted = 0;
  for (let i = 0; i < newMovies.length; i += BATCH) {
    await db.insert(content).values(newMovies.slice(i, i + BATCH)).onConflictDoNothing();
    inserted += Math.min(BATCH, newMovies.length - i);
    process.stdout.write(`\r  Film ekleniyor: ${inserted}/${newMovies.length}`);
  }
  console.log();

  inserted = 0;
  for (let i = 0; i < newTV.length; i += BATCH) {
    await db.insert(content).values(newTV.slice(i, i + BATCH)).onConflictDoNothing();
    inserted += Math.min(BATCH, newTV.length - i);
    process.stdout.write(`\r  Dizi ekleniyor: ${inserted}/${newTV.length}`);
  }
  console.log();

  console.log(`\n✓ Tamamlandı! +${newMovies.length} film, +${newTV.length} dizi eklendi.`);
  console.log(`  Şimdi embedding üretebilirsin: pnpm --filter @movie-tracker/api ai:embeddings`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
