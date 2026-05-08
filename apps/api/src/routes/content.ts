import { Hono } from 'hono';
import { db } from '@/db';
import { content } from '@/db/schema';
import { eq, and, ilike, sql, isNotNull, ne } from 'drizzle-orm';

export const contentRouter = new Hono();

// TMDB türleri — frontend kategoriler için
export const GENRES: Record<number, string> = {
  28: 'Aksiyon', 12: 'Macera', 16: 'Animasyon', 35: 'Komedi',
  80: 'Suç', 18: 'Drama', 14: 'Fantastik', 27: 'Korku',
  9648: 'Gizem', 10749: 'Romantik', 878: 'Bilim Kurgu', 53: 'Gerilim',
  10759: 'Aksiyon & Macera', 10765: 'Sci-Fi & Fantezi',
};

// GET /api/genres — frontend'in listelemesi için
contentRouter.get('/genres', (_c, next) => next()); // placeholder — aşağıda tanımlı

// GET /api/content?page=1&limit=20&type=movie&search=...&genreId=28
contentRouter.get('/', async (c) => {
  const page    = Number(c.req.query('page')  ?? '1');
  const limit   = Number(c.req.query('limit') ?? '20');
  const type     = c.req.query('type');
  const search   = c.req.query('search');
  const genreId  = c.req.query('genreId');
  const sort     = c.req.query('sort');
  const yearFrom = c.req.query('yearFrom');
  const excludeGenre = c.req.query('excludeGenre');

  const offset = (page - 1) * limit;
  const conditions = [];

  if (type === 'movie' || type === 'tv') {
    conditions.push(eq(content.type, type));
  }
  if (search) {
    conditions.push(ilike(content.title, `%${search}%`));
  }
  if (genreId) {
    conditions.push(
      sql`${content.genreIds} @> ${JSON.stringify([Number(genreId)])}::jsonb`,
    );
  }
  if (yearFrom) {
    conditions.push(sql`${content.releaseYear} >= ${Number(yearFrom)}`);
  }
  if (excludeGenre) {
    conditions.push(
      sql`NOT (${content.genreIds} @> ${JSON.stringify([Number(excludeGenre)])}::jsonb)`,
    );
  }
  if (sort === 'newest') {
    // Son 2 yıl içinde çıkan, popüler içerikler (büyük platform eserleri)
    const currentYear = new Date().getFullYear();
    conditions.push(sql`${content.releaseYear} >= ${currentYear - 1}`);
    conditions.push(
      sql`${content.tmdbRating} IS NOT NULL AND CAST(${content.tmdbRating} AS NUMERIC) >= 6.5`,
    );
  }

  const orderBy =
    sort === 'newest'
      ? sql`CAST(${content.tmdbRating} AS NUMERIC) DESC NULLS LAST`
      : sort === 'random'
        ? sql`RANDOM()`
        : genreId
          ? sql`CASE WHEN ${content.genreIds}->0 = to_jsonb(${Number(genreId)}::int) THEN 0 ELSE 1 END, ${content.createdAt}`
          : content.createdAt;

  const rows = await db
    .select()
    .from(content)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);

  return c.json({ data: rows, page, limit, hasNextPage: rows.length === limit });
});

// GET /api/content/:id/similar — pgvector cosine similarity ile benzer içerikler
contentRouter.get('/:id/similar', async (c) => {
  const id = c.req.param('id');
  const [row] = await db.select({ embedding: content.embedding }).from(content).where(eq(content.id, id));
  if (!row?.embedding) return c.json([]);
  const vectorLiteral = `[${row.embedding.join(',')}]`;
  const similar = await db
    .select({
      id: content.id,
      title: content.title,
      posterUrl: content.posterUrl,
      releaseYear: content.releaseYear,
      tmdbRating: content.tmdbRating,
      type: content.type,
    })
    .from(content)
    .where(and(isNotNull(content.embedding), ne(content.id, id)))
    .orderBy(sql`${content.embedding} <=> ${sql.raw(`'${vectorLiteral}'::vector`)}`)
    .limit(6);
  return c.json(similar);
});

// GET /api/content/:id — DB + TMDB detaylarını birleştirir
contentRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db.select().from(content).where(eq(content.id, id));
  if (!row) return c.json({ error: 'Bulunamadı' }, 404);

  // TMDB'den ek detay çek (credits: cast + crew)
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const endpoint = row.type === 'movie'
      ? `/movie/${row.tmdbId}`
      : `/tv/${row.tmdbId}`;

    const [detailRes, creditsRes, videosRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${TMDB_KEY}&language=tr-TR`),
      fetch(`https://api.themoviedb.org/3${endpoint}/credits?api_key=${TMDB_KEY}&language=tr-TR`),
      fetch(`https://api.themoviedb.org/3${endpoint}/videos?api_key=${TMDB_KEY}&language=en-US`),
    ]);

    const detail = await detailRes.json() as any;
    const credits = await creditsRes.json() as any;
    const videos = await videosRes.json() as any;

    const directors = (credits.crew ?? [])
      .filter((p: any) => p.job === 'Director' || p.known_for_department === 'Directing')
      .slice(0, 3)
      .map((p: any) => p.name);

    const cast = (credits.cast ?? [])
      .slice(0, 8)
      .map((p: any) => ({ name: p.name, character: p.character, photo: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null }));

    const genres = (detail.genres ?? []).map((g: any) => g.name);
    const runtime = detail.runtime ?? detail.episode_run_time?.[0] ?? null;
    const backdrop = detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null;

    // Önce Türkçe trailer, yoksa İngilizce
    const trailerKey = (videos.results ?? []).find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    )?.key ?? null;

    // Runtime bilgisi varsa DB'ye kaydet (bir kez yeter)
    if (runtime && !row.runtime) {
      await db.update(content).set({ runtime }).where(eq(content.id, id)).catch(() => {});
    }

    return c.json({ ...row, directors, cast, genres, runtime, backdropUrl: backdrop, trailerKey });
  } catch {
    // TMDB erişimi yoksa sadece DB verisini dön
    return c.json(row);
  }
});
