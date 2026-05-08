import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;
// v2

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import cron from 'node-cron';
import { auth } from '@/lib/auth';
import { contentRouter } from '@/routes/content';
import { userContentRouter } from '@/routes/userContent';
import { statsRouter } from '@/routes/stats';
import { aiRouter } from '@/routes/ai';
import { spotlightRouter } from '@/routes/spotlight';
import { commentsRouter } from '@/routes/comments';
import { usersRouter } from '@/routes/users';
import { syncTMDB, syncNewReleases } from '@/lib/tmdbSync';
import { generateMissingEmbeddings } from '@/lib/generateEmbeddings';

const app = new Hono();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://movie-full-stack-project-three.vercel.app',
];

app.use(
  '*',
  cors({
    origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'API çalışıyor!', version: 3 });
});

// Better Auth — /api/auth/* altındaki tüm istekleri yönetir
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// Film ve dizi listeleme, arama
app.route('/api/content', contentRouter);

// Kullanıcının izleme listesi
app.route('/api/user-content', userContentRouter);

// Site geneli istatistikler
app.route('/api/stats', statsRouter);

// AI önerileri
app.route('/api/ai', aiRouter);

// TMDB haftalık trending spotlight
app.route('/api/spotlight', spotlightRouter);

// Film/dizi yorumları
app.route('/api/comments', commentsRouter);

// Public kullanıcı profilleri
app.route('/api/users', usersRouter);

// Manuel sync tetikleyici
app.post('/api/sync/run', async (c) => {
  const result = await syncTMDB({ pages: 5, log: true });
  return c.json({ ok: true, ...result });
});

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('Server http://localhost:3001 adresinde çalışıyor!');
});

// Her gün saat 03:00'te trending/popular güncelle
cron.schedule('0 3 * * *', async () => {
  console.log('[cron] Günlük TMDB sync başlıyor...');
  try {
    await syncTMDB({ pages: 5, log: true });
  } catch (e) {
    console.error('[cron] Sync hatası:', e);
  }
}, { timezone: 'Europe/Istanbul' });

// Her Pazartesi 04:00'te geçen haftanın yeni çıkan içeriklerini ekle
cron.schedule('0 4 * * 1', async () => {
  console.log('[cron] Haftalık yeni içerik sync başlıyor...');
  try {
    await syncNewReleases();
  } catch (e) {
    console.error('[cron] Haftalık sync hatası:', e);
  }
}, { timezone: 'Europe/Istanbul' });

// Her Pazartesi 05:00'te yeni eklenen içeriklerin embedding'ini üret
cron.schedule('0 5 * * 1', async () => {
  console.log('[cron] Haftalık embedding üretimi başlıyor...');
  try {
    await generateMissingEmbeddings();
  } catch (e) {
    console.error('[cron] Embedding hatası:', e);
  }
}, { timezone: 'Europe/Istanbul' });
