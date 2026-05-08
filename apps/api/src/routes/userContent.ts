import { Hono } from 'hono';
import { db } from '@/db';
import { userContent, content } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const userContentRouter = new Hono();

// Gelen isteğin session'ını doğrulayan yardımcı
async function getSession(req: Request) {
  return auth.api.getSession({ headers: req.headers });
}

const addSchema = z.object({
  contentId: z.string().uuid(),
  status: z.enum(['watched', 'watchlist']),
  rating: z.number().int().min(1).max(10).optional(),
});

// GET /api/user-content — film detaylarıyla birlikte döner
userContentRouter.get('/', async (c) => {
  const session = await getSession(c.req.raw);
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const rows = await db
    .select({
      id: userContent.id,
      contentId: userContent.contentId,
      status: userContent.status,
      rating: userContent.rating,
      createdAt: userContent.createdAt,
      content: {
        title: content.title,
        posterUrl: content.posterUrl,
        releaseYear: content.releaseYear,
        tmdbRating: content.tmdbRating,
        type: content.type,
        runtime: content.runtime,
        genreIds: content.genreIds,
      },
    })
    .from(userContent)
    .innerJoin(content, eq(userContent.contentId, content.id))
    .where(eq(userContent.userId, session.user.id));

  return c.json(rows);
});

// POST /api/user-content — izlendi veya watchlist'e ekle
userContentRouter.post('/', async (c) => {
  const session = await getSession(c.req.raw);
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const body = await c.req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const { contentId, status, rating } = parsed.data;

  // Zaten eklenmiş mi? → güncelle
  const [existing] = await db
    .select()
    .from(userContent)
    .where(
      and(
        eq(userContent.userId, session.user.id),
        eq(userContent.contentId, contentId),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(userContent)
      .set({ status, rating: rating ?? existing.rating })
      .where(eq(userContent.id, existing.id))
      .returning();
    return c.json(updated);
  }

  // Yeni kayıt
  const [created] = await db
    .insert(userContent)
    .values({ userId: session.user.id, contentId, status, rating })
    .returning();

  return c.json(created, 201);
});

// DELETE /api/user-content/:contentId — listeden çıkar
userContentRouter.delete('/:contentId', async (c) => {
  const session = await getSession(c.req.raw);
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const contentId = c.req.param('contentId');

  await db
    .delete(userContent)
    .where(
      and(
        eq(userContent.userId, session.user.id),
        eq(userContent.contentId, contentId),
      ),
    );

  return c.json({ ok: true });
});
