import { Hono } from 'hono';
import { db } from '@/db';
import { content } from '@/db/schema';
import { inArray, and, sql } from 'drizzle-orm';

export const spotlightRouter = new Hono();

// GET /api/spotlight — TMDB haftalık trending'i DB ile eşleştirerek döner
spotlightRouter.get('/', async (c) => {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=tr-TR`),
      fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&language=tr-TR`),
    ]);

    const movies = (await movieRes.json()) as any;
    const tvShows = (await tvRes.json()) as any;

    const tmdbMovieIds: number[] = (movies.results ?? []).slice(0, 20).map((m: any) => m.id);
    const tmdbTvIds: number[] = (tvShows.results ?? []).slice(0, 20).map((t: any) => t.id);
    const allTmdbIds = [...tmdbMovieIds, ...tmdbTvIds];

    if (!allTmdbIds.length) throw new Error('no tmdb results');

    const dbItems = await db
      .select()
      .from(content)
      .where(inArray(content.tmdbId, allTmdbIds));

    // TMDB popülerlik sırasına göre sırala, ilk 10'u al
    const orderMap = new Map(allTmdbIds.map((id, i) => [id, i]));
    const sorted = dbItems
      .sort((a, b) => (orderMap.get(a.tmdbId!) ?? 99) - (orderMap.get(b.tmdbId!) ?? 99))
      .slice(0, 10);

    return c.json({ data: sorted });
  } catch {
    // TMDB erişimi yoksa DB'den yüksek puanlı yeni içerikler
    const currentYear = new Date().getFullYear();
    const fallback = await db
      .select()
      .from(content)
      .where(
        and(
          sql`${content.releaseYear} >= ${currentYear - 2}`,
          sql`${content.tmdbRating} IS NOT NULL AND CAST(${content.tmdbRating} AS NUMERIC) >= 7.0`,
        ),
      )
      .orderBy(sql`CAST(${content.tmdbRating} AS NUMERIC) DESC NULLS LAST`)
      .limit(10);
    return c.json({ data: fallback });
  }
});
