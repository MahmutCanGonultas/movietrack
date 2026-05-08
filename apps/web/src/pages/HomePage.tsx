import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { AiBanner } from '@/components/AiBanner';
import { CategoryRow } from '@/components/CategoryRow';
import { TrendingSidebar } from '@/components/TrendingSidebar';
import { ContentGrid } from '@/components/ContentGrid';
import { SpotlightSection } from '@/components/SpotlightSection';

const MAIN_CATEGORIES = [
  { title: 'Trend',        genreId: undefined, type: undefined        },
  { title: 'Aksiyon',      genreId: 28,        type: 'movie' as const },
  { title: 'Gerilim',      genreId: 53,        type: 'movie' as const },
  { title: 'Korku',        genreId: 27,        type: 'movie' as const },
  { title: 'Bilim Kurgu',  genreId: 878,       type: 'movie' as const },
  { title: 'Komedi',       genreId: 35,        type: undefined        },
  { title: 'Drama',        genreId: 18,        type: undefined        },
  { title: 'Macera',       genreId: 12,        type: undefined        },
  { title: 'Fantastik',    genreId: 14,        type: undefined        },
  { title: 'Diziler',      genreId: undefined, type: 'tv' as const    },
];

const ANIMATION_CATEGORIES = [
  { title: 'Animasyon Filmleri', genreId: 16, type: 'movie' as const },
  { title: 'Animasyon Dizileri', genreId: 16, type: 'tv' as const    },
];

type MainTab = 'all' | 'movie' | 'tv' | 'animation';

const MAIN_TABS: { label: string; value: MainTab; icon: string }[] = [
  { label: 'Tümü',      value: 'all',       icon: '◈' },
  { label: 'Filmler',   value: 'movie',     icon: '▶' },
  { label: 'Diziler',   value: 'tv',        icon: '⊞' },
  { label: 'Animasyon', value: 'animation', icon: '✦' },
];

const GENRE_FILTERS: { label: string; id: number }[] = [
  { label: 'Aksiyon',     id: 28   },
  { label: 'Korku',       id: 27   },
  { label: 'Komedi',      id: 35   },
  { label: 'Drama',       id: 18   },
  { label: 'Gerilim',     id: 53   },
  { label: 'Bilim Kurgu', id: 878  },
  { label: 'Romantik',    id: 10749},
  { label: 'Suç',         id: 80   },
  { label: 'Fantastik',   id: 14   },
  { label: 'Macera',      id: 12   },
];

const YEAR_FILTERS: { label: string; value: number | undefined }[] = [
  { label: 'Tüm Yıllar', value: undefined },
  { label: '2024+',      value: 2024      },
  { label: '2022+',      value: 2022      },
  { label: '2020+',      value: 2020      },
  { label: '2015+',      value: 2015      },
  { label: '2010+',      value: 2010      },
  { label: '2000+',      value: 2000      },
];

export function HomePage() {
  const [searchParams] = useSearchParams();
  const [mainTab, setMainTab] = useState<MainTab>('all');
  const [genreFilter, setGenreFilter] = useState<number | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const search = searchParams.get('search') ?? '';

  const isFiltering = genreFilter !== undefined || yearFilter !== undefined;

  // Search modu
  if (search) {
    return (
      <div className="min-h-screen">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex gap-8 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <h2 className="section-title text-sm font-black text-zinc-300">
                  Sonuçlar: <span style={{ color: '#8b5cf6' }}>{search}</span>
                </h2>
                <div className="flex gap-1.5 ml-auto">
                  {MAIN_TABS.filter(t => t.value !== 'animation').map((tab) => (
                    <button
                      key={tab.label}
                      onClick={() => setMainTab(tab.value)}
                      className="text-xs font-semibold px-4 py-1.5 rounded-full transition-all"
                      style={{
                        background: mainTab === tab.value ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                        color: mainTab === tab.value ? '#fff' : '#71717a',
                        border: mainTab === tab.value ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <ContentGrid
                search={search}
                type={mainTab === 'all' ? undefined : mainTab === 'animation' ? undefined : mainTab}
                genreId={mainTab === 'animation' ? 16 : undefined}
              />
            </div>
            <TrendingSidebar />
          </div>
        </div>
      </div>
    );
  }

  // Ana sayfa
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Ambient glow layers */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div style={{ position: 'absolute', top: '-20%', left: '-8%', width: '55%', height: '140%', background: 'radial-gradient(ellipse at 0% 50%, rgba(139,92,246,0.10) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '45%', height: '140%', background: 'radial-gradient(ellipse at 100% 50%, rgba(245,200,66,0.045) 0%, transparent 60%)' }} />
          {/* Center dark vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 100% at 50% 50%, transparent 30%, rgba(5,5,8,0.3) 100%)' }} />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-wrap items-center justify-between gap-6">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="h-px w-10" style={{ background: 'linear-gradient(90deg, #8b5cf6, transparent)' }} />
              <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: '#8b5cf6' }}>Movie Tracker</span>
              {/* Live badge */}
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                <span className="w-1 h-1 rounded-full glow-pulse" style={{ background: '#8b5cf6' }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#8b5cf6' }}>Live</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-[2.6rem] font-black tracking-tight text-white leading-none mb-2.5">
              Keşfet, İzle,{' '}
              <span className="text-gradient">Takip Et.</span>
            </h1>
            <p className="text-zinc-600 text-sm font-medium">AI destekli kişisel film ve dizi deneyimi.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="stat-pill">
              <span className="glow-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
              14K+ İçerik
            </div>
            <div className="stat-pill">
              <span style={{ color: '#f5c842', fontSize: '11px' }}>★</span>
              AI Öneriler
            </div>
            <div className="stat-pill">
              <span style={{ color: '#71717a', fontSize: '11px' }}>↻</span>
              Günlük Güncelleme
            </div>
          </div>
        </div>
      </div>

      {/* ── Ana sekmeler ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-2 flex-wrap">
          {MAIN_TABS.map((tab) => {
            const active = mainTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => { setMainTab(tab.value); setGenreFilter(undefined); setYearFilter(undefined); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                style={active
                  ? { background: tab.value === 'animation' ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.15)', border: `1px solid ${tab.value === 'animation' ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.4)'}`, color: tab.value === 'animation' ? '#a78bfa' : '#8b5cf6' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }
                }
              >
                <span style={{ fontSize: '10px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filtreler (tür + yıl) — animasyon dışında ── */}
      {mainTab !== 'animation' && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-3 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tür filtreleri */}
            <div className="flex gap-1.5 flex-wrap">
              {GENRE_FILTERS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenreFilter(genreFilter === g.id ? undefined : g.id)}
                  className="text-xs px-3 py-1 rounded-full font-medium transition-all"
                  style={genreFilter === g.id
                    ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.45)', color: '#9d6ff8' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Yıl filtresi */}
            <div className="ml-auto shrink-0">
              <select
                value={yearFilter ?? ''}
                onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: yearFilter ? '#9d6ff8' : '#52525b', cursor: 'pointer' }}
              >
                {YEAR_FILTERS.map((y) => (
                  <option key={y.label} value={y.value ?? ''} style={{ background: '#0a0a0a' }}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Spotlight ── */}
      {mainTab === 'all' && !isFiltering && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-6">
          <SpotlightSection />
        </div>
      )}

      {/* ── Divider ── */}
      {mainTab === 'all' && !isFiltering && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 my-6">
          <div className="divider-accent" />
        </div>
      )}

      {/* ── İçerik ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-12 pt-4">

        {/* Animasyon sekmesi */}
        {mainTab === 'animation' && (
          <div className="flex gap-6 xl:gap-8 items-start">
            <div className="flex-1 min-w-0 space-y-3">
              {ANIMATION_CATEGORIES.map((cat) => (
                <div key={cat.title} className="section-block" style={{ borderColor: 'rgba(139,92,246,0.12)' }}>
                  <CategoryRow title={cat.title} genreId={cat.genreId} type={cat.type} limit={12} />
                </div>
              ))}
            </div>
            <TrendingSidebar />
          </div>
        )}

        {/* Filtre aktifken grid göster */}
        {mainTab !== 'animation' && (isFiltering || mainTab !== 'all') && (
          <div className="flex gap-8 items-start">
            <div className="flex-1 min-w-0">
              {(genreFilter !== undefined || yearFilter !== undefined || mainTab !== 'all') && (
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs text-zinc-600">
                    {[
                      mainTab !== 'all' && (mainTab === 'movie' ? 'Filmler' : 'Diziler'),
                      genreFilter && GENRE_FILTERS.find(g => g.id === genreFilter)?.label,
                      yearFilter && `${yearFilter}+`,
                    ].filter(Boolean).join(' · ')}
                  </span>
                  {isFiltering && (
                    <button
                      onClick={() => { setGenreFilter(undefined); setYearFilter(undefined); }}
                      className="text-xs px-2 py-0.5 rounded-full transition-colors"
                      style={{ color: '#71717a', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Filtreleri temizle ✕
                    </button>
                  )}
                </div>
              )}
              <ContentGrid
                type={mainTab === 'all' ? undefined : mainTab as 'movie' | 'tv'}
                genreId={genreFilter}
                yearFrom={yearFilter}
              />
            </div>
            <TrendingSidebar />
          </div>
        )}

        {/* Ana görünüm: kategori satırları */}
        {mainTab === 'all' && !isFiltering && (
          <div className="flex gap-6 xl:gap-8 items-start">
            <div className="flex-1 min-w-0 space-y-3">
              <AiBanner />
              {MAIN_CATEGORIES.map((cat) => (
                <div key={cat.title} className="section-block">
                  <CategoryRow title={cat.title} genreId={cat.genreId} type={cat.type} limit={12} />
                </div>
              ))}
            </div>
            <TrendingSidebar />
          </div>
        )}

      </div>
    </div>
  );
}
