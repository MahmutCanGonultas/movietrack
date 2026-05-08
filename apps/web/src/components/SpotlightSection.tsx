import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useRef, useState } from 'react';
import { PosterImage } from '@/components/PosterImage';

interface ContentItem {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  tmdbRating: string | null;
  type: 'movie' | 'tv';
}

export function SpotlightSection() {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data, isLoading } = useQuery<{ data: ContentItem[] }>({
    queryKey: ['spotlight'],
    queryFn: async () => {
      const res = await fetch('/api/spotlight');
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  function updateArrows() {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  function scroll(dir: 'left' | 'right') {
    rowRef.current?.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' });
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!rowRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeftRef.current = rowRef.current.scrollLeft;
    rowRef.current.style.cursor = 'grabbing';
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    rowRef.current.scrollLeft = scrollLeftRef.current - (x - startX.current) * 1.5;
  }

  function onMouseUp() {
    isDragging.current = false;
    if (rowRef.current) rowRef.current.style.cursor = 'grab';
  }

  if (isLoading) return <SpotlightSkeleton />;
  const items = data?.data ?? [];
  if (!items.length) return null;

  return (
    <section className="mb-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title text-sm font-black text-white">Haftalık Trend</h2>
        <span className="text-[10px] text-zinc-700 font-medium uppercase tracking-widest">Bu Hafta</span>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-sm"
          style={{
            background: canScrollLeft ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
            border: canScrollLeft ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
            color: canScrollLeft ? '#8b5cf6' : '#27272a',
          }}
        >
          ‹
        </button>

        <div
          ref={rowRef}
          onScroll={updateArrows}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2"
          style={{ cursor: 'grab', flex: 1, paddingTop: '18px', marginTop: '-18px' }}
        >
          {items.map((item, i) => (
            <RankCard key={item.id} item={item} rank={i + 1} featured={i === 0} index={i} />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-sm"
          style={{
            background: canScrollRight ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
            border: canScrollRight ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
            color: canScrollRight ? '#8b5cf6' : '#27272a',
          }}
        >
          ›
        </button>
      </div>
    </section>
  );
}

function RankCard({ item, rank, featured, index }: { item: ContentItem; rank: number; featured: boolean; index: number }) {
  const rating = item.tmdbRating ? Number(item.tmdbRating).toFixed(1) : null;

  return (
    <div
      className="shrink-0 flex items-end fade-in-up"
      style={{
        paddingLeft: rank > 1 ? '8px' : 0,
        animationDelay: `${index * 55}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Rank number */}
      <div
        className="shrink-0 select-none font-black leading-none"
        style={{
          fontSize: featured ? '96px' : '80px',
          color: 'transparent',
          WebkitTextStroke: featured
            ? '2.5px rgba(139,92,246,0.65)'
            : rank === 2
            ? '2px rgba(139,92,246,0.28)'
            : rank === 3
            ? '2px rgba(245,200,66,0.28)'
            : '2px rgba(255,255,255,0.09)',
          lineHeight: 0.85,
          marginRight: '-12px',
          zIndex: 1,
          paddingBottom: '8px',
          filter:
            featured
              ? 'drop-shadow(0 0 14px rgba(139,92,246,0.5))'
              : rank === 2
              ? 'drop-shadow(0 0 8px rgba(139,92,246,0.2))'
              : 'none',
        }}
      >
        {rank}
      </div>

      {/* Poster */}
      <Link
        to={`/movie/${item.id}`}
        draggable={false}
        className="poster-card shrink-0 block"
        style={{ width: featured ? '178px' : '148px', aspectRatio: '2/3', zIndex: 2 }}
      >
        <PosterImage src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" loading="eager" draggable={false} />

        {/* Type badge */}
        <div
          className="absolute top-1.5 left-1.5 font-black uppercase text-white"
          style={{
            background: item.type === 'tv' ? 'rgba(34,211,238,0.85)' : 'rgba(139,92,246,0.85)',
            backdropFilter: 'blur(4px)',
            fontSize: '7px',
            padding: '2px 5px',
            borderRadius: '4px',
            letterSpacing: '0.06em',
          }}
        >
          {item.type === 'tv' ? 'Dizi' : 'Film'}
        </div>

        {/* Rank medal for top 3 */}
        {rank <= 3 && (
          <div
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-black"
            style={{
              background:
                rank === 1
                  ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
                  : rank === 2
                  ? 'linear-gradient(135deg, #c0c0c0, #a8a8a8)'
                  : 'linear-gradient(135deg, #cd7f32, #b8651a)',
              fontSize: '8px',
              color: '#000',
              boxShadow: rank === 1 ? '0 2px 10px rgba(139,92,246,0.6)' : '0 2px 6px rgba(0,0,0,0.5)',
            }}
          >
            {rank === 1 ? '★' : rank}
          </div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)', padding: '28px 8px 8px' }}
        >
          {rating && (
            <p className="font-bold mb-1" style={{ color: '#f5c842', fontSize: '9px' }}>★ {rating}</p>
          )}
          <p
            className="text-white font-bold leading-tight"
            style={{
              fontSize: featured ? '11px' : '10px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </p>
        </div>
      </Link>
    </div>
  );
}

function SpotlightSkeleton() {
  return (
    <section className="mb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-2.5 w-16 rounded" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="shrink-0 flex items-end" style={{ paddingLeft: i > 0 ? '8px' : 0 }}>
            <div
              className="shrink-0"
              style={{
                width: i === 0 ? '56px' : '46px',
                height: i === 0 ? '82px' : '68px',
                background: 'transparent',
              }}
            />
            <div
              className="skeleton shrink-0"
              style={{ width: i === 0 ? '178px' : '148px', aspectRatio: '2/3', borderRadius: '14px' }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
