# MovieTrack

A Turkish film and TV tracker: log what you watch, rate it from 1 to 10, keep a watchlist and share a stats card. Recommendations come from vector search: every title in a TMDB catalogue mirrored into Postgres is embedded with Gemini, what you have watched becomes a taste vector weighted by your ratings, and pgvector ranks the rest by cosine distance.

Live: https://movietrack-ai.vercel.app

## Layout

```
apps/web   React 19, Vite, React Router, TanStack Query, Zustand, Tailwind CSS
apps/api   Hono, Drizzle ORM, PostgreSQL (Neon) with pgvector, Better Auth, Gemini
scripts/   build-vercel.mjs: one Vercel deployment with the static site and the API function
```

The API is one Hono app (`apps/api/src/app.ts`) with two entry points: `src/index.ts` runs it as a Node server with node-cron for local development, and `src/vercel.ts` is the Vercel function. Scheduled work lives in `src/jobs.ts`; on Vercel it runs through Vercel Cron at `/api/cron/daily` and `/api/cron/embeddings`, which require `Authorization: Bearer $CRON_SECRET`.

## Running locally

```bash
pnpm install
# apps/api/.env: DATABASE_URL, TMDB_API_KEY, GEMINI_API_KEY, BETTER_AUTH_SECRET, BETTER_AUTH_URL
pnpm dev:api   # http://localhost:3001 (set DISABLE_CRON=1 to skip the scheduled jobs)
pnpm dev:web   # http://localhost:5173, proxies /api to the API
```

## Deploying

```bash
pnpm deploy:vercel
```

This builds `.vercel/output` (the Vite build, the API bundled into one file with esbuild, routes and cron jobs) and deploys it with `vercel deploy --prebuilt --prod`. Environment variables are set on the Vercel project: `DATABASE_URL`, `TMDB_API_KEY`, `GEMINI_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL` and `CRON_SECRET`.
