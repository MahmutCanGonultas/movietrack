import { Hono } from 'hono';
import { db } from '@/db';
import { comments, commentReactions, users } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, inArray, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

export const commentsRouter = new Hono();

// GET /api/comments/:contentId — yorumlar + reaksiyon sayıları + kullanıcının kendi reaksiyonları
commentsRouter.get('/:contentId', async (c) => {
  const { contentId } = c.req.param();
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const userId = session?.user.id ?? null;

  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.name,
      userImage: users.image,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.contentId, contentId))
    .orderBy(desc(comments.createdAt));

  if (!rows.length) return c.json([]);

  const commentIds = rows.map((r) => r.id);

  // Reaksiyon sayıları (heart + like ayrı ayrı)
  const reactionCounts = await db
    .select({
      commentId: commentReactions.commentId,
      type: commentReactions.type,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(commentReactions)
    .where(inArray(commentReactions.commentId, commentIds))
    .groupBy(commentReactions.commentId, commentReactions.type);

  // Kullanıcının kendi reaksiyonları
  const myReactions: { commentId: string; type: string }[] = userId
    ? await db
        .select({ commentId: commentReactions.commentId, type: commentReactions.type })
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.userId, userId),
            inArray(commentReactions.commentId, commentIds),
          ),
        )
    : [];

  const result = rows.map((row) => {
    const hearts = reactionCounts.find((r) => r.commentId === row.id && r.type === 'heart')?.count ?? 0;
    const likes  = reactionCounts.find((r) => r.commentId === row.id && r.type === 'like')?.count ?? 0;
    const userReactions = myReactions.filter((r) => r.commentId === row.id).map((r) => r.type);
    return { ...row, hearts, likes, userReactions };
  });

  // En çok reaksiyon alan öne gelir
  result.sort((a, b) => (b.hearts + b.likes) - (a.hearts + a.likes) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return c.json(result);
});

const bodySchema = z.object({ body: z.string().min(1).max(500) });

// POST /api/comments/:contentId — yeni yorum ekle
commentsRouter.post('/:contentId', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const { contentId } = c.req.param();
  const parsed = bodySchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: 'Geçersiz yorum' }, 400);

  const [row] = await db
    .insert(comments)
    .values({ userId: session.user.id, contentId, body: parsed.data.body.trim() })
    .returning({ id: comments.id, body: comments.body, createdAt: comments.createdAt, userId: comments.userId });

  return c.json(
    { ...row, userName: session.user.name, userImage: session.user.image ?? null, hearts: 0, likes: 0, userReactions: [] },
    201,
  );
});

// POST /api/comments/:commentId/react — reaksiyon ekle/kaldır (toggle)
commentsRouter.post('/:commentId/react', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const { commentId } = c.req.param();
  const { type } = await c.req.json() as { type: 'heart' | 'like' };
  if (type !== 'heart' && type !== 'like') return c.json({ error: 'Geçersiz reaksiyon' }, 400);

  const existing = await db
    .select({ id: commentReactions.id })
    .from(commentReactions)
    .where(
      and(
        eq(commentReactions.userId, session.user.id),
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.type, type),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(commentReactions).where(eq(commentReactions.id, existing[0].id));
    return c.json({ action: 'removed' });
  }

  await db.insert(commentReactions).values({ userId: session.user.id, commentId, type });
  return c.json({ action: 'added' });
});

// DELETE /api/comments/:commentId — kendi yorumunu sil
commentsRouter.delete('/:commentId', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const { commentId } = c.req.param();
  const [deleted] = await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, session.user.id)))
    .returning({ id: comments.id });

  if (!deleted) return c.json({ error: 'Bulunamadı veya yetkisiz' }, 404);
  return c.json({ ok: true });
});
