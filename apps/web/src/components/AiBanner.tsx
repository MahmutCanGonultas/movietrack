import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { PosterImage } from '@/components/PosterImage';

interface Recommendation {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  tmdbRating: string | null;
  type: 'movie' | 'tv';
  score: number;
}

interface AiResponse {
  recommendations: Recommendation[];
  message: string;
}

export function AiBanner() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading } = useQuery<AiResponse>({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/ai/recommendations', { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/ai/recommendations?refresh=true', { credentials: 'include' });
      if (res.ok) {
        const fresh = await res.json();
        queryClient.setQueryData(['ai-recommendations', user?.id], fresh);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  const hasRecs = data && data.recommendations.length > 0;
  const loading = isLoading || isRefreshing;

  if (!user) return <GuestBanner />;

  return (
    <div className="ai-hero rounded-2xl overflow-hidden mb-2 relative">
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.2) 0%, transparent 60%)' }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(245,200,66,0.08) 0%, transparent 60%)' }} />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-black tracking-widest uppercase text-xs"
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.45)', color: '#8b5cf6' }}
            >
              <div className="ai-ring" />
              <span className="w-2 h-2 rounded-full glow-pulse shrink-0" style={{ background: '#8b5cf6' }} />
              AI
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider leading-none">Sana Özel Öneriler</h2>
              {hasRecs && !loading && (
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'rgba(139,92,246,0.7)' }}>
                  {data.recommendations.length} kişiselleştirilmiş öneri
                </p>
              )}
            </div>
          </div>
          {hasRecs && !loading && (
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#fff';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#71717a';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
              Yenile
            </button>
          )}
        </div>

        {loading ? (
          <AiSkeleton />
        ) : !hasRecs ? (
          <EmptyState message={data?.message} />
        ) : (
          <HeroRecs recs={data.recommendations} message={data.message} />
        )}
      </div>
    </div>
  );
}

function HeroRecs({ recs, message }: { recs: Recommendation[]; message: string }) {
  const [featured, ...rest] = recs;

  return (
    <div className="flex gap-4">
      {/* Featured recommendation — big */}
      <Link
        to={`/movie/${featured.id}`}
        draggable={false}
        className="shrink-0 relative overflow-hidden rounded-2xl transition-all duration-300 group"
        style={{
          width: '130px',
          border: '1px solid rgba(124,58,237,0.35)',
          boxShadow: '0 0 32px rgba(124,58,237,0.2), 0 8px 32px rgba(0,0,0,0.6)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.04) translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 48px rgba(124,58,237,0.35), 0 12px 48px rgba(0,0,0,0.8)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.65)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(124,58,237,0.2), 0 8px 32px rgba(0,0,0,0.6)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.35)';
        }}
      >
        <PosterImage src={featured.posterUrl} alt={featured.title} className="w-full aspect-2/3 object-cover" />

        {/* Score badge */}
        <div
          className="absolute top-2 right-2 font-black text-white rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            fontSize: '10px',
            padding: '3px 7px',
            boxShadow: '0 2px 12px rgba(124,58,237,0.55)',
          }}
        >
          {Math.round(featured.score * 100)}%
        </div>

        {/* "TOP PICK" label */}
        <div
          className="absolute top-2 left-2 font-black uppercase text-white rounded-md"
          style={{
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            fontSize: '7px',
            padding: '2px 5px',
            letterSpacing: '0.1em',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          ★ Öneri
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 px-2 pt-8 pb-2"
          style={{ background: 'linear-gradient(0deg, #000 0%, transparent 100%)' }}
        >
          <p className="text-white font-bold truncate leading-tight" style={{ fontSize: '10px' }}>{featured.title}</p>
          <p className="text-zinc-500 mt-0.5 tabular-nums" style={{ fontSize: '9px' }}>{featured.releaseYear}</p>
        </div>
      </Link>

      {/* Right side: message + rest */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <p className="text-zinc-400 text-xs leading-relaxed max-w-lg">{message}</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {rest.map((rec) => (
            <Link
              key={rec.id}
              to={`/movie/${rec.id}`}
              draggable={false}
              className="shrink-0 poster-card block"
              style={{ width: '80px' }}
            >
              <PosterImage src={rec.posterUrl} alt={rec.title} className="w-full aspect-2/3 object-cover" draggable={false} />

              <div
                className="absolute top-1 right-1 font-black text-white rounded"
                style={{
                  background: 'rgba(124,58,237,0.85)',
                  fontSize: '7px',
                  padding: '1px 4px',
                }}
              >
                {Math.round(rec.score * 100)}%
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 px-1.5 pt-6 pb-1.5"
                style={{ background: 'linear-gradient(0deg, #000 0%, transparent 100%)' }}
              >
                <p className="text-zinc-200 truncate font-semibold leading-tight" style={{ fontSize: '8px' }}>{rec.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(139,92,246,0.2)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M18 2v4m2-2h-4"/>
        </svg>
      </div>
      <div>
        <p className="text-zinc-300 text-sm font-semibold">Öneri hazırlanıyor</p>
        <p className="text-zinc-600 text-xs mt-0.5">{message ?? 'Birkaç film izle ve puan ver — AI zevkini öğrensin.'}</p>
      </div>
    </div>
  );
}

function GuestBanner() {
  return (
    <div className="ai-hero rounded-2xl overflow-hidden mb-2 relative">
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.18) 0%, transparent 60%)' }} />
      <div className="relative p-5 sm:p-6 flex items-center gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(167,139,250,0.15))', border: '1px solid rgba(124,58,237,0.35)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative px-2.5 py-0.5 rounded-lg text-xs font-black tracking-widest uppercase" style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.38)', color: '#8b5cf6' }}>
              <div className="ai-ring" />
              AI
            </div>
            <h2 className="text-sm font-black text-white">Kişisel Öneriler</h2>
          </div>
          <p className="text-zinc-500 text-sm">Giriş yap, film izle. AI zevkini analiz edip sana özel içerikler önersin.</p>
        </div>
        <Link to="/register" className="btn-glow shrink-0 text-sm font-bold px-5 py-2.5 rounded-xl text-white">
          Başla →
        </Link>
      </div>
    </div>
  );
}

function AiSkeleton() {
  return (
    <div className="flex gap-4">
      <div className="skeleton shrink-0 rounded-2xl" style={{ width: '130px', aspectRatio: '2/3' }} />
      <div className="flex-1 flex flex-col gap-3 pt-1">
        <div className="space-y-2">
          <div className="skeleton h-3 rounded-lg w-full max-w-xs" />
          <div className="skeleton h-3 rounded-lg w-3/4 max-w-xs" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton shrink-0 rounded-xl" style={{ width: '80px', aspectRatio: '2/3' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
