import { Hono } from 'hono';
import { db } from '@/db';
import { content, userContent } from '@/db/schema';
import { auth } from '@/lib/auth';
import { generateText } from '@/lib/gemini';
import { sql, eq, and, notInArray, isNotNull, count } from 'drizzle-orm';

export const aiRouter = new Hono();

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 1000 * 60 * 30;

aiRouter.get('/recommendations', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Giriş yapılmamış' }, 401);

  const userId = session.user.id;
  const refresh = c.req.query('refresh') === 'true';

  if (!refresh) {
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return c.json(cached.data);
    }
  }

  // Count ALL watched items first (before embedding filter)
  const [{ total }] = await db
    .select({ total: count() })
    .from(userContent)
    .where(and(eq(userContent.userId, userId), eq(userContent.status, 'watched')));

  if (total === 0) {
    return c.json({ recommendations: [], message: 'Öneri için en az 1 film izle!' });
  }

  // Watched items that actually have embeddings, ordered newest first for recency weighting
  const watched = await db
    .select({
      contentId: userContent.contentId,
      title: content.title,
      type: content.type,
      rating: userContent.rating,
      embedding: content.embedding,
    })
    .from(userContent)
    .innerJoin(content, eq(userContent.contentId, content.id))
    .where(
      and(
        eq(userContent.userId, userId),
        eq(userContent.status, 'watched'),
        isNotNull(content.embedding),
      ),
    )
    .orderBy(sql`${userContent.createdAt} desc`);

  if (watched.length === 0) {
    return c.json({
      recommendations: [],
      message: 'İzlediğin içerikler analiz ediliyor, yakında öneriler hazır olacak...',
    });
  }

  // Recency + rating weighted taste vector
  // Recency: newest = 1.0, older decay by 0.25 per rank
  // Rating: 7+ = 1.5x boost, 5-6 = 0.8x, <5 = 0.4x (didn't like it), unrated = 1.0x
  const dims = 3072;
  const taste = new Array(dims).fill(0) as number[];
  let totalWeight = 0;

  for (let i = 0; i < watched.length; i++) {
    const recencyWeight = Math.exp(-i * 0.25);
    const r = watched[i].rating;
    const ratingMultiplier = r == null ? 1.0 : r >= 7 ? 1.5 : r >= 5 ? 0.8 : 0.4;
    const weight = recencyWeight * ratingMultiplier;
    totalWeight += weight;
    for (let d = 0; d < dims; d++) {
      taste[d] += (watched[i].embedding![d] ?? 0) * weight;
    }
  }
  for (let d = 0; d < dims; d++) {
    taste[d] /= totalWeight;
  }

  const vectorLiteral = `[${taste.join(',')}]`;
  const watchedIds = watched.map((w) => w.contentId);

  const recommendations = await db
    .select({
      id: content.id,
      title: content.title,
      overview: content.overview,
      posterUrl: content.posterUrl,
      releaseYear: content.releaseYear,
      tmdbRating: content.tmdbRating,
      type: content.type,
      score: sql<number>`round((1 - (${content.embedding} <=> ${sql.raw(`'${vectorLiteral}'::vector`)}))::numeric, 3)`,
    })
    .from(content)
    .where(
      and(
        notInArray(content.id, watchedIds),
        isNotNull(content.embedding),
      ),
    )
    .orderBy(sql`${content.embedding} <=> ${sql.raw(`'${vectorLiteral}'::vector`)}`)
    .limit(10);

  // Build richer context for Gemini
  const movieCount = watched.filter((w) => w.type === 'movie').length;
  const tvCount = watched.filter((w) => w.type === 'tv').length;
  const typeInfo =
    movieCount > 0 && tvCount > 0
      ? `${movieCount} film ve ${tvCount} dizi`
      : movieCount > 0
        ? `${movieCount} film`
        : `${tvCount} dizi`;

  const likedTitles = watched
    .filter((w) => w.rating != null && w.rating >= 7)
    .slice(0, 5)
    .map((w) => `${w.title} (${w.rating}/10)`)
    .join(', ');

  const recentTitles = watched
    .filter((w) => w.rating == null || w.rating < 7)
    .slice(0, 4)
    .map((w) => w.title)
    .join(', ');

  const recContext = recommendations
    .slice(0, 5)
    .map((r) => `${r.title} (%${Math.round(r.score * 100)} benzerlik)`)
    .join(', ');

  let message = 'Zevkine uygun içerikler bulundu.';
  try {
    const likedPart = likedTitles
      ? `Yüksek puan verdiği (beğendiği) içerikler: ${likedTitles}. `
      : '';
    const recentPart = recentTitles ? `Diğer izledikleri: ${recentTitles}. ` : '';

    message = await generateText(
      `Sen bir film öneri asistanısın. Kullanıcı toplamda ${typeInfo} izledi. ` +
        likedPart +
        recentPart +
        `Beğendiği içerikler ağırlıklı olarak önerileri etkiledi. ` +
        `Vektör benzerliğine göre önerilen içerikler: ${recContext}. ` +
        `Kullanıcının zevk profilini (özellikle beğendiği türleri) analiz et. ` +
        `1-2 cümlelik, samimi ve kişiselleştirilmiş Türkçe bir mesaj yaz. ` +
        `Neden bu içerikler önerildi, ne ortak var — bunu kısaca belirt. ` +
        `Sadece mesaj metnini döndür, başka hiçbir şey ekleme.`,
    );
    message = message.trim();
  } catch {
    // Keep default message on Gemini failure
  }

  const result = { recommendations: recommendations.slice(0, 8), message };
  cache.set(userId, { data: result, expiresAt: Date.now() + CACHE_TTL });

  return c.json(result);
});
