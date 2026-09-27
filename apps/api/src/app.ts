import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) (globalThis as any).crypto = webcrypto;

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from '@/lib/auth';
import { contentRouter } from '@/routes/content';
import { userContentRouter } from '@/routes/userContent';
import { statsRouter } from '@/routes/stats';
import { aiRouter } from '@/routes/ai';
import { spotlightRouter } from '@/routes/spotlight';
import { commentsRouter } from '@/routes/comments';
import { usersRouter } from '@/routes/users';
import { isAuthorizedJob, runJob, JOBS, type JobName } from '@/jobs';

/**
 * The HTTP app on its own, with no server and no timers attached, so the same
 * routes run under Node (src/index.ts) and as a Vercel function (src/vercel.ts).
 */
export const app = new Hono();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://movie-full-stack-project-three.vercel.app',
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  '*',
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

const health = (c: any) => c.json({ status: 'ok', message: 'API çalışıyor!', version: 4 });
app.get('/health', health);
app.get('/api/health', health);

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

/*
 * Scheduled jobs over HTTP. Vercel Cron calls these with
 * `Authorization: Bearer $CRON_SECRET`; anything else gets a 401. The manual
 * sync trigger used to be open to anyone who found the URL.
 */
app.on(['GET', 'POST'], '/api/cron/:job', async (c) => {
  if (!isAuthorizedJob(c.req.header('authorization'))) return c.json({ error: 'unauthorized' }, 401);
  const job = c.req.param('job') as JobName;
  if (!JOBS.includes(job)) return c.json({ error: 'unknown job' }, 404);
  const result = await runJob(job);
  return c.json({ ok: true, job, result });
});

app.post('/api/sync/run', async (c) => {
  if (!isAuthorizedJob(c.req.header('authorization'))) return c.json({ error: 'unauthorized' }, 401);
  const result = await runJob('daily');
  return c.json({ ok: true, ...result });
});
