import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useState } from 'react';
import { PosterImage } from '@/components/PosterImage';

interface TrendingItem {
  contentId: string;
  watchCount: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  tmdbRating: string | null;
  type: 'movie' | 'tv';
}

export function TrendingSidebar() {
  const [tab, setTab] = useState<'watched' | 'watchlist'>('watched');

  const { data = [], isLoading } = useQuery<TrendingItem[]>({
    queryKey: ['trending', tab],
    queryFn: async () => {
      const res = await fetch(`/api/stats/trending?limit=10&status=${tab}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <aside
      className="hidden lg:block w-60 shrink-0"
      style={{ position: 'sticky', top: '80px', height: 'fit-content' }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div
          className="px-4 pt-4 pb-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#8b5cf6' }} />
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#8b5cf6' }}>
            Sitede Trend
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1">
          {(['watched', 'watchlist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                tab === t
                  ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }
                  : { background: 'transparent', border: '1px solid transparent', color: '#3f3f46' }
              }
            >
              {t === 'watched' ? '▶ İzlendi' : '+ Liste'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="px-2 pb-3 space-y-0.5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                  <div className="skeleton w-4 h-3 rounded shrink-0" />
                  <div className="skeleton w-9 h-12 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-2.5 rounded w-full" />
                    <div className="skeleton h-2 rounded w-2/3" />
                  </div>
                </div>
              ))
            : data.length === 0
            ? (
              <p className="text-center text-zinc-700 text-xs py-6">Henüz veri yok</p>
            )
            : data.map((item, i) => (
                <Link
                  key={item.contentId}
                  to={`/movie/${item.contentId}`}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all group"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span
                    className="w-4 text-center text-xs font-black shrink-0 tabular-nums"
                    style={{ color: i === 0 ? '#8b5cf6' : i === 1 ? '#a78bfa' : i === 2 ? '#f5c842' : '#3f3f46' }}
                  >
                    {i + 1}
                  </span>

                  <PosterImage
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-9 h-12 rounded-lg object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-400 truncate group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] mt-0.5 font-medium tabular-nums" style={{ color: '#3f3f46' }}>
                      {item.watchCount}× {tab === 'watched' ? 'izlendi' : 'eklendi'}
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </aside>
  );
}
