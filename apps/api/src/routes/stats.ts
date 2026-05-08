import { Hono } from 'hono';
import { db } from '@/db';
import { userContent, content } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const statsRouter = new Hono();

// GET /api/stats/trending?limit=12&status=watched
// Tüm kullanıcıların izleme/watchlist verisine göre en popüler içerikler
statsRouter.get('/trending', async (c) => {
  const limit  = Number(c.req.query('limit')  ?? '12');
  const status = c.req.query('status') === 'watchlist' ? 'watchlist' : 'watched';

  const rows = await db
    .select({
      contentId:  userContent.contentId,
      watchCount: sql<number>`COUNT(*)`.as('watch_count'),
      title:      content.title,
      posterUrl:  content.posterUrl,
      releaseYear:content.releaseYear,
      tmdbRating: content.tmdbRating,
      type:       content.type,
    })
    .from(userContent)
    .innerJoin(content, eq(userContent.contentId, content.id))
    .where(eq(userContent.status, status))
    .groupBy(
      userContent.contentId,
      content.title,
      content.posterUrl,
      content.releaseYear,
      content.tmdbRating,
      content.type,
    )
    .orderBy(desc(sql`watch_count`))
    .limit(limit);

  return c.json(rows);
});
