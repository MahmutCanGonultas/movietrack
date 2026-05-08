import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { CommentsSection } from '@/components/CommentsSection';
import { SimilarMovies } from '@/components/SimilarMovies';

interface CastMember {
  name: string;
  character: string;
  photo: string | null;
}

interface ContentDetail {
  id: string;
  title: string;
  overview: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  tmdbRating: string | null;
  type: 'movie' | 'tv';
  runtime: number | null;
  genres: string[];
  directors: string[];
  cast: CastMember[];
  trailerKey: string | null;
}

interface UserContentItem {
  id: string;
  contentId: string;
  status: 'watched' | 'watchlist';
  rating: number | null;
}

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [hoverStar, setHoverStar] = useState<number | null>(null);

  const { data: film, isLoading } = useQuery<ContentDetail>({
    queryKey: ['content', id],
    queryFn: async () => {
      const res = await fetch(`/api/content/${id}`);
      if (!res.ok) throw new Error('Film bulunamadı');
      return res.json();
    },
  });

  const { data: userContent } = useQuery<UserContentItem[]>({
    queryKey: ['user-content'],
    queryFn: async () => {
      const res = await fetch('/api/user-content', { credentials: 'include' });
      return res.json();
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async ({ status, rating }: { status: 'watched' | 'watchlist'; rating?: number }) => {
      const res = await fetch('/api/user-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentId: id, status, ...(rating !== undefined && { rating }) }),
      });
      if (!res.ok) throw new Error('Eklenemedi');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-content'] }),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/user-content/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-content'] }),
  });

  const ratingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await fetch('/api/user-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentId: id, status: 'watched', rating }),
      });
      if (!res.ok) throw new Error('Puan kaydedilemedi');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-content'] }),
  });

  if (isLoading) return <DetailSkeleton />;
  if (!film) return <p className="text-center text-zinc-500 mt-20">Film bulunamadı.</p>;

  const existingEntry = userContent?.find((uc) => uc.contentId === id);
  const isWatched   = existingEntry?.status === 'watched';
  const isWatchlist = existingEntry?.status === 'watchlist';
  const isPending   = addMutation.isPending || removeMutation.isPending || ratingMutation.isPending;
  const activeStar  = hoverStar ?? existingEntry?.rating ?? 0;

  return (
    <div className="min-h-screen text-white -mt-14" style={{ background: '#030306' }}>

      {/* ── Cinematic hero backdrop ── */}
      {film.backdropUrl ? (
        <div className="relative" style={{ height: '560px' }}>
          {/* Main backdrop */}
          <img
            src={film.backdropUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.48) saturate(1.15)' }}
          />

          {/* Color grading overlay — warm amber left-side light */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(100deg, rgba(139,92,246,0.12) 0%, transparent 45%)' }}
          />

          {/* Bottom fade-out */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(3,3,6,0.04) 0%, rgba(3,3,6,0.25) 48%, rgba(3,3,6,0.95) 82%, #030306 100%)' }}
          />

          {/* Right vignette */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(3,3,6,0.6) 0%, transparent 55%)' }}
          />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              top: '72px',
              background: 'rgba(3,3,6,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#a1a1aa',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#fff';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#a1a1aa';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Geri
          </button>

          {/* Genre pills + title */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-16">
            <div className="max-w-6xl mx-auto">
              {film.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {film.genres.slice(0, 5).map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: 'rgba(139,92,246,0.14)',
                        border: '1px solid rgba(139,92,246,0.32)',
                        color: '#ff8040',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <h1
                className="text-4xl sm:text-5xl font-black leading-tight tracking-tight"
                style={{ textShadow: '0 2px 32px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.5)' }}
              >
                {film.title}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center px-4 max-w-6xl mx-auto" style={{ height: '72px', paddingTop: '14px' }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Geri
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div
        className="max-w-6xl mx-auto px-4 sm:px-8 pb-28 relative"
        style={{ marginTop: film.backdropUrl ? '-44px' : '0', zIndex: 1 }}
      >
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">

          {/* Poster */}
          <div className="shrink-0" style={{ position: 'relative', zIndex: 2 }}>
            {film.posterUrl ? (
              <img
                src={film.posterUrl}
                alt={film.title}
                className="w-40 sm:w-52 rounded-2xl transition-all duration-300"
                style={{
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 0 60px rgba(0,0,0,0.85), 0 0 30px rgba(139,92,246,0.1), 0 30px 60px rgba(0,0,0,0.75)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(139,92,246,0.35), 0 0 60px rgba(0,0,0,0.85), 0 0 50px rgba(139,92,246,0.2), 0 30px 60px rgba(0,0,0,0.75)';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02) translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(255,255,255,0.07), 0 0 60px rgba(0,0,0,0.85), 0 0 30px rgba(139,92,246,0.1), 0 30px 60px rgba(0,0,0,0.75)';
                  (e.currentTarget as HTMLElement).style.transform = '';
                }}
              />
            ) : (
              <div
                className="w-40 sm:w-52 aspect-2/3 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="text-4xl opacity-15">▶</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0" style={{ paddingTop: film.backdropUrl ? '52px' : '0' }}>

            {!film.backdropUrl && (
              <>
                {film.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {film.genres.slice(0, 5).map((g) => (
                      <span
                        key={g}
                        className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.32)', color: '#ff8040' }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl font-black mb-4 leading-tight tracking-tight">{film.title}</h1>
              </>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {film.tmdbRating && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-sm"
                  style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.25)', color: '#f5c842' }}
                >
                  ★ {Number(film.tmdbRating).toFixed(1)}
                </div>
              )}
              {film.releaseYear && (
                <span className="text-sm font-semibold text-zinc-300 tabular-nums">{film.releaseYear}</span>
              )}
              {film.runtime && (
                <span className="text-sm text-zinc-500">
                  {film.type === 'movie' ? `${film.runtime} dk` : `~${film.runtime} dk/bölüm`}
                </span>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{
                  background: film.type === 'tv' ? 'rgba(34,211,238,0.1)' : 'rgba(139,92,246,0.1)',
                  border: film.type === 'tv' ? '1px solid rgba(34,211,238,0.25)' : '1px solid rgba(139,92,246,0.25)',
                  color: film.type === 'tv' ? '#22d3ee' : '#ff7733',
                }}
              >
                {film.type === 'movie' ? 'Film' : 'Dizi'}
              </span>
            </div>

            {/* Overview */}
            {film.overview && (
              <p className="text-zinc-300 leading-relaxed mb-5 text-sm sm:text-[15px] max-w-2xl" style={{ lineHeight: '1.75' }}>
                {film.overview}
              </p>
            )}

            {/* Director */}
            {film.directors?.length > 0 && (
              <div className="flex items-center gap-2.5 mb-6 flex-wrap">
                <span className="text-[11px] text-zinc-600 uppercase tracking-[0.15em] font-semibold">Yönetmen</span>
                <span className="w-px h-3 shrink-0" style={{ background: '#3f3f46' }} />
                <span className="text-sm text-zinc-200 font-semibold">{film.directors.join(', ')}</span>
              </div>
            )}

            {/* Action buttons */}
            {user ? (
              <div className="flex flex-wrap gap-3 mb-7">
                <button
                  onClick={() => isWatched ? removeMutation.mutate() : addMutation.mutate({ status: 'watched' })}
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
                  style={isWatched ? {
                    background: 'rgba(74,222,128,0.12)',
                    border: '1px solid rgba(74,222,128,0.38)',
                    color: '#4ade80',
                    boxShadow: '0 0 20px rgba(74,222,128,0.1)',
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#a1a1aa',
                  }}
                  onMouseEnter={(e) => {
                    if (!isWatched) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.08)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,222,128,0.3)';
                      (e.currentTarget as HTMLElement).style.color = '#4ade80';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isWatched) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                      (e.currentTarget as HTMLElement).style.color = '#a1a1aa';
                    }
                  }}
                >
                  {isWatched ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      İzlendi
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      İzledim
                    </>
                  )}
                </button>

                <button
                  onClick={() => isWatchlist ? removeMutation.mutate() : addMutation.mutate({ status: 'watchlist' })}
                  disabled={isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50"
                  style={isWatchlist ? {
                    background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    color: '#8b5cf6',
                    boxShadow: '0 0 20px rgba(139,92,246,0.1)',
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#a1a1aa',
                  }}
                  onMouseEnter={(e) => {
                    if (!isWatchlist) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)';
                      (e.currentTarget as HTMLElement).style.color = '#8b5cf6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isWatchlist) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                      (e.currentTarget as HTMLElement).style.color = '#a1a1aa';
                    }
                  }}
                >
                  {isWatchlist ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z"/></svg>
                      Listede
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                      Watchlist
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-zinc-600 text-sm mb-6">
                Listeye eklemek için{' '}
                <a href="/login" className="font-semibold hover:underline" style={{ color: '#8b5cf6' }}>giriş yapın</a>
              </p>
            )}

            {/* Star rating */}
            {isWatched && (
              <div>
                <p className="text-[11px] text-zinc-600 uppercase tracking-[0.15em] font-semibold mb-3">Puanın</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => {
                    const filled = activeStar >= star;
                    return (
                      <button
                        key={star}
                        onClick={() => ratingMutation.mutate(star)}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(null)}
                        disabled={ratingMutation.isPending}
                        className="transition-all duration-100 disabled:pointer-events-none"
                        style={{
                          fontSize: '22px',
                          color: filled ? '#f5c842' : '#27272a',
                          transform: filled ? 'scale(1.15)' : 'scale(1)',
                          filter: filled ? 'drop-shadow(0 0 6px rgba(245,200,66,0.6))' : 'none',
                          lineHeight: 1,
                        }}
                        title={`${star}/10`}
                      >
                        ★
                      </button>
                    );
                  })}
                  {existingEntry?.rating != null && (
                    <span className="text-sm font-black ml-3 tabular-nums" style={{ color: '#f5c842' }}>
                      {existingEntry.rating}<span className="font-medium text-zinc-600">/10</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 divider-accent" />

        {/* Trailer */}
        {film.trailerKey && (
          <div className="mb-14">
            <h3 className="section-title text-xs font-bold text-zinc-400 uppercase tracking-widest mb-5">Fragman</h3>
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                paddingBottom: '56.25%',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 24px rgba(139,92,246,0.04)',
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${film.trailerKey}?rel=0&modestbranding=1`}
                title={`${film.title} Fragman`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Cast */}
        {film.cast?.length > 0 && (
          <div>
            <h3 className="section-title text-xs font-bold text-zinc-400 uppercase tracking-widest mb-5">
              Oyuncu Kadrosu
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {film.cast.map((actor) => (
                <div
                  key={actor.name}
                  className="poster-card shrink-0"
                  style={{ width: '108px', cursor: 'default' }}
                >
                  {actor.photo ? (
                    <img
                      src={actor.photo}
                      alt={actor.name}
                      className="w-full object-cover object-top"
                      style={{ aspectRatio: '3/4' }}
                    />
                  ) : (
                    <div
                      className="w-full flex items-center justify-center"
                      style={{ aspectRatio: '3/4', background: 'rgba(255,255,255,0.03)' }}
                    >
                      <span className="text-3xl opacity-10">◉</span>
                    </div>
                  )}
                  <div className="px-2 py-2.5" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <p className="text-xs text-zinc-200 font-semibold leading-tight truncate">{actor.name}</p>
                    <p className="text-[10px] text-zinc-600 leading-tight truncate mt-0.5">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Benzer İçerikler ── */}
        <SimilarMovies contentId={film.id} />

        {/* ── Yorumlar ── */}
        <div
          className="mt-10 pt-10"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <CommentsSection contentId={film.id} />
        </div>

      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen -mt-14" style={{ background: '#030306' }}>
      <div className="skeleton" style={{ height: '560px', borderRadius: 0 }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16" style={{ marginTop: '-44px' }}>
        <div className="flex gap-8">
          <div className="skeleton shrink-0" style={{ width: '208px', aspectRatio: '2/3', borderRadius: '16px' }} />
          <div className="flex-1 space-y-4 pt-14">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-6 w-16 rounded-full" />)}
            </div>
            <div className="skeleton h-10 rounded-xl w-2/3" />
            <div className="skeleton h-4 rounded-lg w-1/3" />
            <div className="space-y-2.5 pt-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-3 rounded-lg" style={{ width: i === 4 ? '60%' : '100%' }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
