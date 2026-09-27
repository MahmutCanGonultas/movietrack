import { syncTMDB, syncNewReleases } from '@/lib/tmdbSync';
import { generateMissingEmbeddings } from '@/lib/generateEmbeddings';

/**
 * The scheduled work, in one place, so the Node server's cron and Vercel Cron
 * run exactly the same code.
 *
 * - daily:      refresh trending/popular lists from TMDB, and on Mondays also
 *               import the past week's releases
 * - embeddings: embed titles that have no vector yet, in a batch small enough
 *               to finish inside a serverless time limit
 */
export const JOBS = ['daily', 'embeddings'] as const;
export type JobName = (typeof JOBS)[number];

/* Titles per embeddings run: about a second each (650 ms apart), so ~40 fit in
   60 s. The deadline stops a slow run early so it never hits maxDuration. */
const EMBED_LIMIT = Number(process.env.EMBED_BATCH ?? 40);
const EMBED_BUDGET_MS = 45_000;

const isMondayInIstanbul = () =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Europe/Istanbul' }).format(new Date()) === 'Mon';

export async function runJob(job: JobName) {
  if (job === 'daily') {
    const sync = await syncTMDB({ pages: 5, log: true });
    const releases = isMondayInIstanbul() ? await syncNewReleases() : null;
    return { sync, releases };
  }
  const embedded = await generateMissingEmbeddings(EMBED_LIMIT, Date.now() + EMBED_BUDGET_MS);
  return { embedded };
}

/** Accepts `Bearer <CRON_SECRET>`. With no secret configured, nothing is allowed. */
export function isAuthorizedJob(header: string | undefined) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && header === `Bearer ${secret}`;
}
