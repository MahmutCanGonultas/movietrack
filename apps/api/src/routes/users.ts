import { Hono } from 'hono';
import { db } from '@/db';
import { users as usersTable, userContent, content } from '@/db/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export const usersRouter = new Hono();

const GENRE_NAMES: Record<number, string> = {
  28: 'Aksiyon', 12: 'Macera', 16: 'Animasyon', 35: 'Komedi', 80: 'Suç',
  18: 'Drama', 14: 'Fantastik', 27: 'Korku', 9648: 'Gizem', 10749: 'Romantik',
  878: 'Bilim Kurgu', 53: 'Gerilim', 10759: 'Aksiyon & Macera', 10765: 'Sci-Fi & Fantezi',
};

// POST /api/users/forgot-password — email varlığı kontrol et, varsa reset emaili gönder
usersRouter.post('/forgot-password', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { email, redirectTo } = body as { email?: string; redirectTo?: string };

  if (!email) return c.json({ error: 'Email gerekli' }, 400);

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    return c.json({ error: 'Bu email adresiyle kayıtlı hesap bulunamadı.' }, 404);
  }

  try {
    const apiBase = process.env.API_BASE_URL ?? 'https://movie-fullstackproject-production.up.railway.app';
    const resetReq = new Request(`${apiBase}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        redirectTo: redirectTo ?? 'https://movie-full-stack-project-three.vercel.app/reset-password',
      }),
    });
    await auth.handler(resetReq);
  } catch (e) {
    console.error('[forgot-password] auth handler hatası:', e);
    return c.json({ error: 'Email gönderilemedi, lütfen tekrar dene.' }, 500);
  }

  return c.json({ ok: true });
});

// PATCH /api/users/me/avatar — update logged-in user's avatar preset
usersRouter.patch('/me/avatar', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const avatarId = (body as any)?.avatarId;
  if (!avatarId || typeof avatarId !== 'string') return c.json({ error: 'avatarId gerekli' }, 400);

  // Validate: only allow preset IDs 1-8
  if (!['1','2','3','4','5','6','7','8'].includes(avatarId)) {
    return c.json({ error: 'Geçersiz avatar ID' }, 400);
  }

  await db.update(usersTable)
    .set({ image: `preset:${avatarId}` })
    .where(eq(usersTable.id, session.user.id));

  return c.json({ ok: true, image: `preset:${avatarId}` });
});

// GET /api/users/:name — public profile by name (case-insensitive)
usersRouter.get('/:name', async (c) => {
  const name = decodeURIComponent(c.req.param('name'));

  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(ilike(usersTable.name, name))
    .limit(1);

  if (!user) return c.json({ error: 'Kullanıcı bulunamadı' }, 404);

  const watched = await db
    .select({
      contentId: userContent.contentId,
      rating: userContent.rating,
      createdAt: userContent.createdAt,
      title: content.title,
      posterUrl: content.posterUrl,
      releaseYear: content.releaseYear,
      tmdbRating: content.tmdbRating,
      type: content.type,
      genreIds: content.genreIds,
      runtime: content.runtime,
    })
    .from(userContent)
    .innerJoin(content, eq(userContent.contentId, content.id))
    .where(and(eq(userContent.userId, user.id), eq(userContent.status, 'watched')))
    .orderBy(sql`${userContent.createdAt} DESC`);

  const movies = watched.filter((w) => w.type === 'movie');
  const shows = watched.filter((w) => w.type === 'tv');
  const ratedItems = watched.filter((w) => w.rating != null);
  const avgRating = ratedItems.length
    ? (ratedItems.reduce((s, i) => s + (i.rating ?? 0), 0) / ratedItems.length).toFixed(1)
    : null;

  const totalMinutes = watched.reduce((sum, i) => {
    const rt = i.runtime ?? (i.type === 'movie' ? 105 : 45);
    return sum + rt;
  }, 0);
  const watchHours = Math.floor(totalMinutes / 60);

  const genreCount: Record<number, number> = {};
  watched.forEach((item) => {
    (item.genreIds ?? []).slice(0, 2).forEach((gid) => {
      genreCount[gid] = (genreCount[gid] ?? 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, cnt]) => ({ name: GENRE_NAMES[Number(id)] ?? 'Diğer', count: Number(cnt) }));

  return c.json({
    user: { name: user.name },
    stats: {
      movies: movies.length,
      shows: shows.length,
      total: watched.length,
      watchHours,
      avgRating,
    },
    topGenres,
    recentWatched: watched.slice(0, 24).map((w) => ({
      contentId: w.contentId,
      title: w.title,
      posterUrl: w.posterUrl,
      rating: w.rating,
      type: w.type,
      releaseYear: w.releaseYear,
    })),
  });
});
