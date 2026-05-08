import { db } from '@/db';
import { content } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE = 'https://api.themoviedb.org/3';

// Sequential endpoint list — movie ve tv ayrı
const MOVIE_ENDPOINTS = [
  '/movie/popular',
  '/movie/top_rated',
  '/movie/now_playing',
  '/movie/upcoming',
  '/trending/movie/week',
];

const TV_ENDPOINTS = [
  '/tv/popular',
  '/tv/top_rated',
  '/tv/on_the_air',
  '/trending/tv/week',
];

async function fetchPages(endpoint: string, maxPages: number): Promise<any[]> {
  const results: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const res = await fetch(
        `${BASE}${endpoint}?api_key=${TMDB_KEY}&page=${page}&language=tr-TR`,
      );
      if (!res.ok) break;
      const data = (await res.json()) as { results: any[]; total_pages: number };
      results.push(...data.results);
      if (page >= data.total_pages) break;
      await new Promise((r) => setTimeout(r, 260));
    } catch {
      break;
    }
  }
  return results;
}

function toMovieRow(m: any) {
  return {
    tmdbId: m.id as number,
    type: 'movie' as const,
    title: (m.title ?? m.original_title ?? '') as string,
    overview: (m.overview ?? null) as string | null,
    posterUrl: m.poster_path
      ? (`https://image.tmdb.org/t/p/w500${m.poster_path}` as string)
      : null,
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
    posterUrl: t.poster_path
      ? (`https://image.tmdb.org/t/p/w500${t.poster_path}` as string)
      : null,
    releaseYear: t.first_air_date ? parseInt(t.first_air_date.split('-')[0]) : null,
    tmdbRating: t.vote_average != null ? String(t.vote_average) : null,
    genreIds: (t.genre_ids ?? []) as number[],
  };
}

export interface SyncResult {
  newMovies: number;
  newTV: number;
  updatedRatings: number;
}

// Geçen haftadan bu yana çıkan yeni film/dizileri çeker ve DB'ye ekler
export async function syncNewReleases(): Promise<{ newMovies: number; newTV: number }> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString().split('T')[0]; // YYYY-MM-DD

  async function discoverNew(type: 'movie' | 'tv'): Promise<any[]> {
    const results: any[] = [];
    const dateField = type === 'movie' ? 'release_date' : 'first_air_date';
    for (let page = 1; page <= 10; page++) {
      try {
        const params = new URLSearchParams({
          api_key: TMDB_KEY!,
          language: 'tr-TR',
          sort_by: 'release_date.desc',
          [`${dateField}.gte`]: sinceStr,
          'vote_count.gte': '3',
          include_adult: 'false',
          page: String(page),
        });
        const res = await fetch(`${BASE}/discover/${type}?${params}`);
        if (!res.ok) break;
        const data = (await res.json()) as { results: any[]; total_pages: number };
        results.push(...data.results);
        if (page >= data.total_pages) break;
        await new Promise((r) => setTimeout(r, 260));
      } catch { break; }
    }
    return results;
  }

  const [movies, tvShows] = await Promise.all([
    discoverNew('movie'),
    discoverNew('tv'),
  ]);

  const existingIds = new Set(
    (await db.select({ tmdbId: content.tmdbId }).from(content)).map((r) => r.tmdbId),
  );

  const newMovies = movies.filter((m) => !existingIds.has(m.id)).map(toMovieRow);
  const newTV = tvShows.filter((t) => !existingIds.has(t.id)).map(toTVRow);

  const BATCH = 50;
  for (let i = 0; i < newMovies.length; i += BATCH)
    await db.insert(content).values(newMovies.slice(i, i + BATCH)).onConflictDoNothing();
  for (let i = 0; i < newTV.length; i += BATCH)
    await db.insert(content).values(newTV.slice(i, i + BATCH)).onConflictDoNothing();

  console.log(`[weekly] +${newMovies.length} yeni film, +${newTV.length} yeni dizi eklendi (${sinceStr} sonrası)`);
  return { newMovies: newMovies.length, newTV: newTV.length };
}

export async function syncTMDB(
  opts: { pages?: number; log?: boolean } = {},
): Promise<SyncResult> {
  const { pages = 5, log = true } = opts;
  const print = log ? (s: string) => console.log(s) : (_s: string) => {};

  print(`[sync] ${MOVIE_ENDPOINTS.length + TV_ENDPOINTS.length} endpoint × ${pages} sayfa`);

  // Collect all TMDB items
  const movieMap = new Map<number, any>();
  for (const ep of MOVIE_ENDPOINTS) {
    print(`  → ${ep}`);
    const items = await fetchPages(ep, pages);
    for (const m of items) if (m?.id) movieMap.set(m.id, m);
  }

  const tvMap = new Map<number, any>();
  for (const ep of TV_ENDPOINTS) {
    print(`  → ${ep}`);
    const items = await fetchPages(ep, pages);
    for (const t of items) if (t?.id) tvMap.set(t.id, t);
  }

  print(`  TMDB: ${movieMap.size} film, ${tvMap.size} dizi`);

  // Fetch existing IDs from DB (single queries)
  const existingMovieRows = await db
    .select({ tmdbId: content.tmdbId, id: content.id, rating: content.tmdbRating, posterUrl: content.posterUrl })
    .from(content)
    .where(eq(content.type, 'movie'));

  const existingTVRows = await db
    .select({ tmdbId: content.tmdbId, id: content.id, rating: content.tmdbRating, posterUrl: content.posterUrl })
    .from(content)
    .where(eq(content.type, 'tv'));

  const existingMovieMap = new Map(existingMovieRows.map((r) => [r.tmdbId, r]));
  const existingTVMap = new Map(existingTVRows.map((r) => [r.tmdbId, r]));

  // Insert new movies in batches
  const newMovies = [...movieMap.values()].filter((m) => !existingMovieMap.has(m.id));
  const newTV = [...tvMap.values()].filter((t) => !existingTVMap.has(t.id));

  const BATCH = 50;
  for (let i = 0; i < newMovies.length; i += BATCH) {
    const batch = newMovies.slice(i, i + BATCH).map(toMovieRow);
    await db.insert(content).values(batch).onConflictDoNothing();
  }
  for (let i = 0; i < newTV.length; i += BATCH) {
    const batch = newTV.slice(i, i + BATCH).map(toTVRow);
    await db.insert(content).values(batch).onConflictDoNothing();
  }

  // Update ratings and fix missing poster URLs for existing items
  let updatedRatings = 0;
  for (const [tmdbId, existing] of existingMovieMap) {
    const fresh = movieMap.get(tmdbId);
    if (!fresh) continue;
    const updates: Record<string, any> = {};
    if (fresh.vote_average && existing.rating !== String(fresh.vote_average)) {
      updates.tmdbRating = String(fresh.vote_average);
      updatedRatings++;
    }
    if (!existing.posterUrl && fresh.poster_path) {
      updates.posterUrl = `https://image.tmdb.org/t/p/w500${fresh.poster_path}`;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(content).set(updates).where(and(eq(content.tmdbId, tmdbId), eq(content.type, 'movie')));
    }
  }
  for (const [tmdbId, existing] of existingTVMap) {
    const fresh = tvMap.get(tmdbId);
    if (!fresh) continue;
    const updates: Record<string, any> = {};
    if (fresh.vote_average && existing.rating !== String(fresh.vote_average)) {
      updates.tmdbRating = String(fresh.vote_average);
      updatedRatings++;
    }
    if (!existing.posterUrl && fresh.poster_path) {
      updates.posterUrl = `https://image.tmdb.org/t/p/w500${fresh.poster_path}`;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(content).set(updates).where(and(eq(content.tmdbId, tmdbId), eq(content.type, 'tv')));
    }
  }

  print(
    `[sync] Bitti — +${newMovies.length} film, +${newTV.length} dizi, ${updatedRatings} puan güncellendi`,
  );
  return { newMovies: newMovies.length, newTV: newTV.length, updatedRatings };
}
