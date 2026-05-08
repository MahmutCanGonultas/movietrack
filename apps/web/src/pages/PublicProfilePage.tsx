import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { PosterImage } from '@/components/PosterImage';

interface PublicProfile {
  user: { name: string };
  stats: {
    movies: number;
    shows: number;
    total: number;
    watchHours: number;
    avgRating: string | null;
  };
  topGenres: { name: string; count: number }[];
  recentWatched: {
    contentId: string;
    title: string;
    posterUrl: string | null;
    rating: number | null;
    type: 'movie' | 'tv';
    releaseYear: number | null;
  }[];
}

export function PublicProfilePage() {
  const { name } = useParams<{ name: string }>();

  const { data, isLoading, error } = useQuery<PublicProfile>({
    queryKey: ['public-profile', name],
    queryFn: async () => {
      const res = await fetch(`/api/users/${encodeURIComponent(name!)}`);
      if (!res.ok) throw new Error('Kullanıcı bulunamadı');
      return res.json();
    },
    enabled: !!name,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#8b5cf6' }} />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-6xl opacity-10">◉</div>
      <p className="text-zinc-300 font-black text-xl">Kullanıcı bulunamadı</p>
      <p className="text-zinc-600 text-sm">Bu kullanıcı adıyla kayıtlı profil yok.</p>
      <Link
        to="/"
        className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#8b5cf6' }}
      >
        Ana sayfaya dön →
      </Link>
    </div>
  );

  const { user, stats, topGenres, recentWatched } = data;
  const initial = user.name[0]?.toUpperCase() ?? '?';
  const maxGenre = topGenres[0]?.count ?? 1;

  const statCards = [
    { label: 'Film',   value: stats.movies,     color: '#4ade80' },
    { label: 'Dizi',   value: stats.shows,      color: '#22d3ee' },
    { label: 'Saat',   value: stats.watchHours, color: '#fb7185' },
    ...(stats.avgRating ? [{ label: 'Puan', value: stats.avgRating, color: '#f97316' }] : []),
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: '#030306' }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: '200px' }}>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(30,20,60,0.8) 100%)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(3,3,6,0.7) 70%, #030306 100%)' }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 relative" style={{ marginTop: '-80px' }}>

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa, #f5c842)',
              color: '#000',
              boxShadow: '0 0 0 4px #030306, 0 0 0 5px rgba(124,58,237,0.4)',
            }}
          >
            {initial}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
            <p className="text-zinc-600 text-sm mt-0.5">{stats.total} içerik izledi</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 mb-8">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3 text-center min-w-16"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-xl font-black leading-none tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-zinc-600 text-[10px] mt-1 uppercase tracking-wide font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6 items-start">

          {/* Watched grid */}
          <div className="flex-1 min-w-0">
            <h3 className="section-title text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
              İzlenen İçerikler
            </h3>
            {recentWatched.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
                style={{ border: '1px dashed rgba(255,255,255,0.07)' }}
              >
                <span className="text-5xl opacity-10">▶</span>
                <p className="text-zinc-600 text-sm">Henüz izlenen içerik yok.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {recentWatched.map((item) => (
                  <Link key={item.contentId} to={`/movie/${item.contentId}`} className="poster-card block">
                    <PosterImage
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-full aspect-2/3 object-cover"
                    />
                    {item.rating != null && (
                      <div
                        className="absolute top-1 right-1 font-black rounded-md"
                        style={{ background: 'rgba(245,200,66,0.9)', color: '#000', fontSize: '7px', padding: '2px 4px' }}
                      >
                        ★{item.rating}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: genre chart */}
          {topGenres.length > 0 && (
            <div className="hidden lg:block w-52 shrink-0">
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h3 className="section-title text-xs font-black text-white mb-4">Tür Dağılımı</h3>
                <div className="space-y-3">
                  {topGenres.map(({ name: genre, count }, i) => {
                    const pct = Math.round((count / maxGenre) * 100);
                    const colors = ['#7c3aed', '#a78bfa', '#f5c842', '#4ade80', '#22d3ee'];
                    const c = colors[i] ?? '#7c3aed';
                    return (
                      <div key={genre}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-zinc-300 font-semibold">{genre}</span>
                          <span className="text-[10px] font-black tabular-nums" style={{ color: c }}>{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}, ${c}88)` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
