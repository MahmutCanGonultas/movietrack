import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useRef, useState } from 'react';
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

interface Props {
  title: string;
  status?: 'watched' | 'watchlist';
}

export function TrendingRow({ title, status = 'watched' }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data, isLoading } = useQuery<TrendingItem[]>({
    queryKey: ['trending', status],
    queryFn: async () => {
      const res = await fetch(`/api/stats/trending?limit=16&status=${status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  function updateArrows() {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  function scroll(dir: 'left' | 'right') {
    rowRef.current?.scrollBy({ left: dir === 'right' ? 520 : -520, behavior: 'smooth' });
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!rowRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
    rowRef.current.style.cursor = 'grabbing';
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    rowRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5;
  }

  function onMouseUp() {
    isDragging.current = false;
    if (rowRef.current) rowRef.current.style.cursor = 'grab';
  }

  if (isLoading) return <RowSkeleton title={title} />;
  if (!data?.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="section-title text-sm font-black text-white">{title}</h2>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#8b5cf6' }}
        >
          <span className="glow-pulse w-1 h-1 rounded-full shrink-0" style={{ background: '#8b5cf6' }} />
          Siteden
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        <ScrollBtn dir="left" enabled={canScrollLeft} onClick={() => scroll('left')} />

        <div
          ref={rowRef}
          onScroll={updateArrows}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2"
          style={{ cursor: 'grab', flex: 1, paddingTop: '12px', marginTop: '-12px' }}
        >
          {data.map((item, i) => (
            <Link
              key={item.contentId}
              to={`/movie/${item.contentId}`}
              draggable={false}
              className="poster-card shrink-0 block fade-in-up"
              style={{ width: '150px', animationDelay: `${i * 45}ms`, animationFillMode: 'both' }}
            >
              <PosterImage src={item.posterUrl} alt={item.title} className="w-full aspect-2/3 object-cover" draggable={false} />

              {/* Rank badge */}
              <div
                className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                style={{
                  background: i === 0
                    ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
                    : i === 1
                    ? 'linear-gradient(135deg, #c0c0c0, #a0a0a0)'
                    : i === 2
                    ? 'linear-gradient(135deg, #cd7f32, #b8651a)'
                    : 'rgba(0,0,0,0.65)',
                  color: i < 3 ? '#000' : '#3f3f46',
                  boxShadow: i === 0
                    ? '0 2px 12px rgba(139,92,246,0.7)'
                    : i === 1
                    ? '0 2px 8px rgba(180,180,180,0.4)'
                    : i === 2
                    ? '0 2px 8px rgba(180,100,30,0.4)'
                    : 'none',
                  backdropFilter: 'blur(4px)',
                  fontSize: '10px',
                  animation: i === 0 ? 'glow-pulse 2.5s ease-in-out infinite' : 'none',
                }}
              >
                {i < 3 ? ['★', '2', '3'][i] : i + 1}
              </div>

              {/* Type badge */}
              <div
                className="absolute top-1.5 right-1.5 font-black uppercase"
                style={{
                  background: item.type === 'tv' ? 'rgba(34,211,238,0.85)' : 'rgba(139,92,246,0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#fff',
                  fontSize: '7px',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.06em',
                }}
              >
                {item.type === 'tv' ? 'Dizi' : 'Film'}
              </div>

              {/* Bottom overlay */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)', padding: '28px 8px 8px' }}
              >
                <p className="text-xs text-zinc-200 truncate font-semibold leading-tight">{item.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] tabular-nums font-medium" style={{ color: '#52525b' }}>
                    {item.watchCount}×
                  </span>
                  {item.tmdbRating && (
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: '#f5c842' }}>
                      ★{Number(item.tmdbRating).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <ScrollBtn dir="right" enabled={canScrollRight} onClick={() => scroll('right')} />
      </div>
    </section>
  );
}

function ScrollBtn({ dir, enabled, onClick }: { dir: 'left' | 'right'; enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-sm"
      style={{
        background: enabled ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
        border: enabled ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
        color: enabled ? '#8b5cf6' : '#27272a',
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}

function RowSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <p className="section-title text-sm font-black text-white">{title}</p>
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton shrink-0" style={{ width: '150px', aspectRatio: '2/3', borderRadius: '14px' }} />
        ))}
      </div>
    </section>
  );
}
