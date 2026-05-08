import { db } from '@/db';
import { content } from '@/db/schema';
import { embedText } from '@/lib/gemini';
import { isNull, eq } from 'drizzle-orm';
import { GENRES } from '@/routes/content';

export async function generateMissingEmbeddings(limit?: number): Promise<number> {
  const baseQuery = db
    .select({ id: content.id, title: content.title, overview: content.overview, type: content.type, genreIds: content.genreIds })
    .from(content)
    .where(isNull(content.embedding))
    .$dynamic();

  const items = limit ? await baseQuery.limit(limit) : await baseQuery;
  if (!items.length) {
    console.log('[embed] Embedding üretilecek içerik yok.');
    return 0;
  }
  console.log(`[embed] ${items.length} içerik için embedding üretiliyor...`);

  let done = 0;
  for (const item of items) {
    const genreNames = ((item.genreIds as number[]) ?? [])
      .map((id) => GENRES[id])
      .filter(Boolean)
      .join(', ');

    const text = [
      item.title,
      item.type === 'movie' ? 'Film' : 'Dizi',
      genreNames ? `Türler: ${genreNames}.` : '',
      item.overview ?? '',
    ].filter(Boolean).join(' ').slice(0, 2000);

    let retries = 0;
    while (retries < 5) {
      try {
        const embedding = await embedText(text);
        await db.update(content).set({ embedding }).where(eq(content.id, item.id));
        done++;
        break;
      } catch (e: any) {
        const is429 = e.message?.includes('429') || e.message?.includes('quota');
        if (is429 && retries < 4) {
          retries++;
          await new Promise((r) => setTimeout(r, 65_000));
        } else {
          console.error(`[embed] Hata (${item.title}): ${e.message}`);
          break;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 650));
  }

  console.log(`[embed] ${done} embedding oluşturuldu.`);
  return done;
}
