import { serve } from '@hono/node-server';
import cron from 'node-cron';
import { app } from '@/app';
import { runJob } from '@/jobs';

/**
 * Long-running Node server: local development, or any host that keeps a
 * process alive. On Vercel the same app runs from src/vercel.ts and the jobs
 * are triggered by Vercel Cron instead of node-cron.
 */
const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server http://localhost:${port} adresinde çalışıyor!`);
});

if (process.env.DISABLE_CRON !== '1') {
  // Her gün 03:00'te trending/popular güncelle; pazartesileri yeni çıkanları da ekle
  cron.schedule('0 3 * * *', async () => {
    console.log('[cron] Günlük TMDB sync başlıyor...');
    try {
      await runJob('daily');
    } catch (e) {
      console.error('[cron] Sync hatası:', e);
    }
  }, { timezone: 'Europe/Istanbul' });

  // Her gün 05:00'te embedding'i olmayan içerikleri işle
  cron.schedule('0 5 * * *', async () => {
    console.log('[cron] Embedding üretimi başlıyor...');
    try {
      await runJob('embeddings');
    } catch (e) {
      console.error('[cron] Embedding hatası:', e);
    }
  }, { timezone: 'Europe/Istanbul' });
}
