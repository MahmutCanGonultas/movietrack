import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchMovies(endpoint: string) {
  const results = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(
      `${BASE_URL}${endpoint}?api_key=${TMDB_KEY}&page=${page}&language=tr-TR`,
    );
    const data = (await res.json()) as any;
    results.push(...data.results);
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}

async function seed() {
  console.log('Seed başlıyor...');

  const [popularMovies, topMovies, popularTV, topTV] = await Promise.all([
    fetchMovies('/movie/popular'),
    fetchMovies('/movie/top_rated'),
    fetchMovies('/tv/popular'),
    fetchMovies('/tv/top_rated'),
  ]);

  const allMovies = [
    ...new Map(
      popularMovies.concat(topMovies).map((m: any) => [m.id, m]),
    ).values(),
  ];

  const allTV = [
    ...new Map(popularTV.concat(topTV).map((m: any) => [m.id, m])).values(),
  ];

  console.log(`${allMovies.length} film, ${allTV.length} dizi bulundu`);

  for (const movie of allMovies) {
    await db
      .insert(schema.content)
      .values({
        tmdbId: movie.id,
        type: 'movie',
        title: movie.title,
        overview: movie.overview,
        posterUrl: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        releaseYear: movie.release_date
          ? parseInt(movie.release_date.split('-')[0])
          : null,
        tmdbRating: movie.vote_average?.toString(),
        genreIds: movie.genre_ids ?? [],
      })
      .onConflictDoNothing();
  }

  for (const tv of allTV) {
    await db
      .insert(schema.content)
      .values({
        tmdbId: tv.id,
        type: 'tv',
        title: tv.name,
        overview: tv.overview,
        posterUrl: tv.poster_path
          ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
          : null,
        releaseYear: tv.first_air_date
          ? parseInt(tv.first_air_date.split('-')[0])
          : null,
        tmdbRating: tv.vote_average?.toString(),
        genreIds: tv.genre_ids ?? [],
      })
      .onConflictDoNothing();
  }

  console.log('Seed tamamlandı!');
}

seed().catch(console.error);
