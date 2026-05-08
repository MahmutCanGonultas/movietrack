import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { PosterImage } from '@/components/PosterImage';
import { ProfileShareCard } from '@/components/ProfileShareCard';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { AvatarSelector } from '@/components/AvatarSelector';

interface UserContentRow {
  id: string;
  contentId: string;
  status: 'watched' | 'watchlist';
  rating: number | null;
  createdAt: string;
  content: {
    title: string;
    posterUrl: string | null;
    releaseYear: number | null;
    tmdbRating: string | null;
    type: 'movie' | 'tv';
    genreIds?: number[];
    runtime: number | null;
  };
}

type TabKey = 'movie' | 'tv' | 'watchlist' | 'liked';

const TABS: { key: TabKey; label: string; icon: string; color: string }[] = [
  { key: 'movie',     label: 'Filmler',       icon: '▶', color: '#4ade80' },
  { key: 'tv',        label: 'Diziler',        icon: '⊞', color: '#22d3ee' },
  { key: 'watchlist', label: 'İzleyeceklerim', icon: '+', color: '#8b5cf6' },
  { key: 'liked',     label: 'Beğendiklerim',  icon: '★', color: '#facc15' },
];

const GENRE_NAMES: Record<number, string> = {
  28: 'Aksiyon', 12: 'Macera', 16: 'Animasyon', 35: 'Komedi', 80: 'Suç',
  18: 'Drama', 14: 'Fantastik', 27: 'Korku', 9648: 'Gizem', 10749: 'Romantik',
  878: 'Bilim Kurgu', 53: 'Gerilim', 10759: 'Aksiyon & Macera',
};

export function ProfilePage() {
  const { user, authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('movie');
  const [showShareCard, setShowShareCard] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const { data: list = [], isLoading } = useQuery<UserContentRow[]>({
    queryKey: ['user-content'],
    queryFn: async () => {
      const res = await fetch('/api/user-content', { credentials: 'include' });
      return res.json();
    },
    enabled: !!user,
  });

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#8b5cf6' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  const watched       = list.filter((i) => i.status === 'watched');
  const watchedMovies = watched.filter((i) => i.content.type === 'movie');
  const watchedTV     = watched.filter((i) => i.content.type === 'tv');
  const watchlist     = list.filter((i) => i.status === 'watchlist');
  const liked         = watched.filter((i) => i.rating != null && i.rating >= 7);

  const ratedItems = watched.filter((i) => i.rating != null);
  const avgRating  = ratedItems.length
    ? (ratedItems.reduce((s, i) => s + (i.rating ?? 0), 0) / ratedItems.length).toFixed(1)
    : null;

  // Toplam izleme süresi — runtime varsa kullan, yoksa ortalama tahmin
  const totalMinutes = watched.reduce((sum, i) => {
    const rt = i.content.runtime ?? (i.content.type === 'movie' ? 105 : 45);
    return sum + rt;
  }, 0);
  const watchHours   = Math.floor(totalMinutes / 60);
  const watchMins    = totalMinutes % 60;
  const watchTimeLabel = watchHours > 0
    ? `${watchHours} sa${watchMins > 0 ? ` ${watchMins} dk` : ''}`
    : `${watchMins} dk`;

  const genreCount: Record<number, number> = {};
  watched.forEach((item) => {
    (item.content.genreIds ?? []).slice(0, 2).forEach((gid) => {
      genreCount[gid] = (genreCount[gid] ?? 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({ name: GENRE_NAMES[Number(id)] ?? 'Diğer', count }));
  const maxGenreCount = topGenres[0]?.count ?? 1;

  // Decade distribution
  const decadeCount: Record<number, number> = {};
  watched.forEach((item) => {
    const decade = item.content.releaseYear ? Math.floor(item.content.releaseYear / 10) * 10 : null;
    if (decade) decadeCount[decade] = (decadeCount[decade] ?? 0) + 1;
  });
  const topDecades = Object.entries(decadeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([decade, cnt]) => ({ label: `${decade}'ler`, count: Number(cnt) }));
  const maxDecadeCount = topDecades[0]?.count ?? 1;

  // Badges
  const BADGES = [
    { id: 'first',   label: 'İlk Adım',        desc: 'İlk içeriği izle',   icon: '▶', color: '#4ade80', earned: watched.length >= 1 },
    { id: 'film10',  label: 'Film Aşığı',       desc: '10 film izle',       icon: '★', color: '#f5c842', earned: watchedMovies.length >= 10 },
    { id: 'film50',  label: 'Sinefil',          desc: '50 film izle',       icon: '◆', color: '#a78bfa', earned: watchedMovies.length >= 50 },
    { id: 'tv5',     label: 'Dizi Maratoncusu', desc: '5 dizi izle',        icon: '⊞', color: '#22d3ee', earned: watchedTV.length >= 5 },
    { id: 'rate10',  label: 'Eleştirmen',       desc: '10 içerik puanla',   icon: '◎', color: '#fb7185', earned: ratedItems.length >= 10 },
    { id: 'genres5', label: 'Her Tattan',       desc: '5 farklı tür izle',  icon: '◉', color: '#f97316', earned: Object.keys(genreCount).length >= 5 },
    { id: 'hours50', label: 'Maraton Koşucusu', desc: '50 saat izle',       icon: '◷', color: '#facc15', earned: watchHours >= 50 },
    { id: 'big',     label: 'Bağımlı',          desc: '100 içerik izle',    icon: '✦', color: '#c084fc', earned: watched.length >= 100 },
  ];

  const tabItems: Record<TabKey, UserContentRow[]> = {
    tv: watchedTV, movie: watchedMovies, watchlist, liked,
  };
  const tabEmpty: Record<TabKey, string> = {
    tv:        'Henüz dizi izlemedin.',
    movie:     'Henüz film izlemedin.',
    watchlist: "Watchlist'in boş.",
    liked:     '7+ puan verdiğin içerik yok — bunlar AI önerilerini şekillendirir.',
  };
  const counts: Record<TabKey, number> = {
    tv: watchedTV.length, movie: watchedMovies.length, watchlist: watchlist.length, liked: liked.length,
  };
  const activeColor = TABS.find((t) => t.key === activeTab)?.color ?? '#8b5cf6';
  const items = tabItems[activeTab];

  const recentActivity = [...list]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const stats = [
    { label: 'Film',        value: watchedMovies.length,            color: '#4ade80', icon: '▶' },
    { label: 'Dizi',        value: watchedTV.length,                color: '#22d3ee', icon: '⊞' },
    { label: 'Liste',       value: watchlist.length,                color: '#8b5cf6', icon: '+' },
    { label: 'Beğeni',      value: liked.length,                    color: '#facc15', icon: '★' },
    ...(watched.length > 0  ? [{ label: 'Süre', value: watchTimeLabel, color: '#fb7185', icon: '⏱' }] : []),
    ...(avgRating           ? [{ label: 'Ort.', value: avgRating,      color: '#f97316', icon: '◎' }] : []),
  ];

  return (
    <>
    <div className="min-h-screen text-white" style={{ background: '#030306' }}>

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden" style={{ height: '200px' }}>
        {/* Background: blurred poster collage from recent watched */}
        {recentActivity.slice(0, 3).map((item, i) => item.content.posterUrl && (
          <img
            key={item.id}
            src={item.content.posterUrl}
            alt=""
            className="absolute object-cover"
            style={{
              width: '33.33%',
              height: '100%',
              left: `${i * 33.33}%`,
              filter: 'blur(24px) brightness(0.25) saturate(1.4)',
              transform: 'scale(1.1)',
              objectPosition: 'center top',
            }}
          />
        ))}
        {/* Fallback gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(167,139,250,0.1) 40%, rgba(30,20,60,0.6) 100%)',
          }}
        />
        {/* Bottom fade */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(3,3,6,0.7) 70%, #030306 100%)' }} />
        {/* Noise */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
        }} />
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16 relative" style={{ marginTop: '-80px' }}>

        {/* ── Avatar + identity ── */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <button
            className="relative group shrink-0"
            onClick={() => setShowAvatarSelector(true)}
            title="Avatar değiştir"
          >
            <AvatarDisplay name={user.name} image={user.image} size={88} />
            <div
              className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.55)', fontSize: 11, color: '#fff', fontWeight: 700 }}
            >
              Değiştir
            </div>
          </button>

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-gradient truncate">{user.name}</h1>
            <p className="text-zinc-500 text-sm truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Link
                to={`/u/${encodeURIComponent(user.name)}`}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a' }}
              >
                Public profil →
              </Link>
              <button
                onClick={() => setShowShareCard(true)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}
              >
                Kart Oluştur
              </button>
            </div>
          </div>

          {/* Stat pills row */}
          <div className="flex flex-wrap gap-2 pb-1 shrink-0">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-3 py-2.5 text-center min-w-13 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${s.color}40`;
                  (e.currentTarget as HTMLElement).style.background = `${s.color}10`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <p className="text-lg font-black leading-none tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="text-zinc-600 text-[10px] mt-0.5 uppercase tracking-wide font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex gap-5 items-start">

          {/* Left: tabs + grid */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">

            {/* Tab bar */}
            <div
              className="flex gap-1 p-1 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                    style={active
                      ? {
                          background: `${tab.color}18`,
                          border: `1px solid ${tab.color}45`,
                          color: tab.color,
                          boxShadow: `0 0 20px ${tab.color}18`,
                        }
                      : { background: 'transparent', border: '1px solid transparent', color: '#52525b' }
                    }
                  >
                    <span style={{ fontSize: '11px' }}>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {counts[tab.key] > 0 && (
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums"
                        style={active
                          ? { background: `${tab.color}28`, color: tab.color }
                          : { background: 'rgba(255,255,255,0.07)', color: '#52525b' }
                        }
                      >
                        {counts[tab.key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content grid */}
            {isLoading ? (
              <GridSkeleton />
            ) : items.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl"
                style={{ border: '1px dashed rgba(255,255,255,0.07)' }}
              >
                <span className="text-5xl opacity-10">{activeTab === 'liked' ? '★' : activeTab === 'watchlist' ? '+' : '▶'}</span>
                <p className="text-zinc-600 text-sm text-center max-w-xs">{tabEmpty[activeTab]}</p>
                <Link
                  to="/"
                  className="text-xs px-4 py-1.5 rounded-full font-semibold transition-all"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.28)', color: '#8b5cf6' }}
                >
                  İçerik keşfet →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
                {items.map((item, i) => (
                  <ProfileCard key={item.id} item={item} activeColor={activeColor} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="hidden lg:flex flex-col gap-4 w-60 shrink-0">

            {/* Share card quick link */}
            <button
              onClick={() => setShowShareCard(true)}
              className="w-full py-2.5 rounded-2xl text-xs font-black transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.08))',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#a78bfa',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.6)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; }}
            >
              ✦ Profil Kartı Oluştur
            </button>

            {/* Recent activity */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <h3 className="section-title text-xs font-black text-white mb-4">Son Aktivite</h3>
              {recentActivity.length === 0 ? (
                <p className="text-zinc-700 text-xs py-4 text-center">Henüz aktivite yok.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <Link
                      key={item.id}
                      to={`/movie/${item.contentId}`}
                      className="flex items-center gap-2.5 group rounded-xl p-1.5 -mx-1.5 transition-all"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                        {item.content.posterUrl
                          ? <img src={item.content.posterUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-300 truncate group-hover:text-white transition-colors">{item.content.title}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5 tabular-nums">{item.content.releaseYear}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={item.status === 'watched'
                              ? { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                              : { background: 'rgba(124,58,237,0.12)', color: '#8b5cf6', border: '1px solid rgba(124,58,237,0.2)' }
                            }
                          >
                            {item.status === 'watched' ? '✓ İzlendi' : '+ Listede'}
                          </span>
                          {item.rating != null && (
                            <span className="text-[9px] font-black tabular-nums" style={{ color: '#facc15' }}>★{item.rating}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Genre chart */}
            {topGenres.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <h3 className="section-title text-xs font-black text-white mb-4">Tür Dağılımı</h3>
                <div className="space-y-3">
                  {topGenres.map(({ name, count }, i) => {
                    const pct = Math.round((count / maxGenreCount) * 100);
                    const colors = ['#7c3aed', '#a78bfa', '#f5c842', '#4ade80', '#22d3ee', '#a78bfa'];
                    const c = colors[i] ?? '#7c3aed';
                    return (
                      <div key={name}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-zinc-300 font-semibold">{name}</span>
                          <span className="text-[10px] font-black tabular-nums" style={{ color: c }}>{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${c}, ${c}88)`,
                              boxShadow: `0 0 8px ${c}55`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary card */}
            {ratedItems.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h3 className="section-title text-xs font-black text-white mb-3">Puan Özeti</h3>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-black text-gradient">{avgRating}</span>
                  <span className="text-zinc-600 text-sm pb-1">/10 ortalama</span>
                </div>
                <div className="text-xs text-zinc-600">{ratedItems.length} içerik puanlandı</div>
                <div className="mt-3 flex gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map((star) => {
                    const c = ratedItems.filter(i => i.rating === star).length;
                    const h = c > 0 ? Math.max(4, Math.round((c / ratedItems.length) * 40)) : 2;
                    return (
                      <div key={star} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-sm"
                          style={{ height: `${h}px`, background: c > 0 ? '#f5c842' : 'rgba(255,255,255,0.06)' }}
                        />
                        <span className="text-[8px] text-zinc-700 tabular-nums">{star}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Decade distribution */}
            {topDecades.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h3 className="section-title text-xs font-black text-white mb-4">Yıllara Göre</h3>
                <div className="space-y-3">
                  {topDecades.map(({ label, count }, i) => {
                    const pct = Math.round((count / maxDecadeCount) * 100);
                    const colors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];
                    const c = colors[i] ?? '#f97316';
                    return (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-zinc-300 font-semibold">{label}</span>
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
            )}

            {/* Badges */}
            {BADGES.some((b) => b.earned) && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h3 className="section-title text-xs font-black text-white mb-3">Rozetler</h3>
                <div className="flex flex-wrap gap-1.5">
                  {BADGES.map((badge) => (
                    <div
                      key={badge.id}
                      title={badge.desc}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={badge.earned
                        ? { background: `${badge.color}18`, border: `1px solid ${badge.color}45`, color: badge.color }
                        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#3f3f46', filter: 'grayscale(1)' }
                      }
                    >
                      <span style={{ fontSize: '11px' }}>{badge.icon}</span>{' '}
                      {badge.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>

    {showShareCard && (
      <ProfileShareCard
        name={user.name}
        image={user.image}
        stats={{ movies: watchedMovies.length, shows: watchedTV.length, watchHours, avgRating }}
        topGenres={topGenres}
        badges={BADGES.filter((b) => b.earned).length}
        onClose={() => setShowShareCard(false)}
      />
    )}
    {showAvatarSelector && <AvatarSelector onClose={() => setShowAvatarSelector(false)} />}
  </>
  );
}

function ProfileCard({ item, activeColor, index }: { item: UserContentRow; activeColor: string; index: number }) {
  return (
    <Link
      to={`/movie/${item.contentId}`}
      className="poster-card block fade-in-up"
      style={{ animationDelay: `${Math.min(index * 25, 250)}ms`, animationFillMode: 'both' }}
    >
      <PosterImage
        src={item.content.posterUrl}
        alt={item.content.title}
        className="w-full aspect-2/3 object-cover"
      />

      {/* Rating star */}
      {item.rating != null && (
        <div
          className="absolute top-1.5 right-1.5 font-black text-white rounded-md tabular-nums"
          style={{ background: 'rgba(245,200,66,0.9)', color: '#000', fontSize: '8px', padding: '2px 5px' }}
        >
          ★{item.rating}
        </div>
      )}

      {/* Status dot */}
      <div
        className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full"
        style={{
          background: item.status === 'watched' ? '#4ade80' : activeColor,
          boxShadow: `0 0 6px ${item.status === 'watched' ? '#4ade80' : activeColor}`,
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 px-1.5 pt-6 pb-1.5"
        style={{ background: 'linear-gradient(0deg, #000 0%, transparent 100%)' }}
      >
        <p className="text-zinc-100 truncate font-semibold leading-tight" style={{ fontSize: '9px' }}>
          {item.content.title}
        </p>
      </div>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: '16px' }} />
      ))}
    </div>
  );
}
