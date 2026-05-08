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
  overview: string | null;
}

interface Props {
  title: string;
  genreId?: number;
  type?: 'movie' | 'tv';
  limit?: number;
  newest?: boolean;
}

export function CategoryRow({ title, genreId, type, limit = 14, newest = false }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data, isLoading } = useQuery<{ data: ContentItem[] }>({
    queryKey: ['category', genreId, type, newest],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (genreId) params.set('genreId', String(genreId));
      if (type) params.set('type', type);
      if (newest) params.set('sort', 'newest');
      else if (genreId) params.set('sort', 'random');
      const res = await fetch(`/api/content?${params}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  function updateArrows() {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  function scroll(dir: 'left' | 'right') {
    rowRef.current?.scrollBy({ left: dir === 'right' ? 560 : -560, behavior: 'smooth' });
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!rowRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
    rowRef.current.style.cursor = 'grabbing';
    rowRef.current.style.userSelect = 'none';
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    rowRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5;
  }

  function onMouseUp() {
    if (!rowRef.current) return;
    isDragging.current = false;
    rowRef.current.style.cursor = 'grab';
    rowRef.current.style.userSelect = '';
  }

  if (isLoading) return <RowSkeleton title={title} />;
  if (!data?.data.length) return null;

  const [featured, ...rest] = data.data;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title text-sm font-black text-white">{title}</h2>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(139,92,246,0.7)' }}
        >
          {data.data.length}
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm font-bold"
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
          className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2"
          style={{ cursor: 'grab', flex: 1, paddingTop: '12px', marginTop: '-12px' }}
        >
          {/* Featured card — wider with synopsis */}
          <FeaturedCard item={featured} />

          {/* Regular cards */}
          {rest.map((item) => (
            <MiniCard key={item.id} item={item} />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm font-bold"
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

function FeaturedCard({ item }: { item: ContentItem }) {
  const [hovered, setHovered] = useState(false);
  const rating = item.tmdbRating ? Number(item.tmdbRating).toFixed(1) : null;

  return (
    <Link
      to={`/movie/${item.id}`}
      draggable={false}
      className="shrink-0 relative overflow-hidden rounded-2xl transition-all duration-300 block"
      style={{
        width: '240px',
        height: '176px',
        border: hovered ? '1px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: hovered
          ? '0 0 0 1px rgba(139,92,246,0.2), 0 0 36px rgba(139,92,246,0.22), 0 12px 40px rgba(0,0,0,0.8)'
          : '0 4px 24px rgba(0,0,0,0.6)',
        transform: hovered ? 'scale(1.04) translateY(-4px)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background poster blurred */}
      {item.posterUrl && (
        <img
          src={item.posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(18px) brightness(0.28) saturate(1.4)', transform: 'scale(1.1)' }}
          draggable={false}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Content */}
      <div className="relative flex gap-3 h-full p-3">
        {/* Poster */}
        <div className="shrink-0 rounded-xl overflow-hidden shadow-2xl" style={{ width: '72px', height: '108px', border: '1px solid rgba(255,255,255,0.15)' }}>
          <PosterImage src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-end min-w-0 flex-1 pb-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: '#8b5cf6', color: '#fff' }}
            >
              {item.type === 'movie' ? 'Film' : 'Dizi'}
            </span>
            {rating && (
              <span className="text-[10px] font-bold" style={{ color: '#f5c842' }}>★ {rating}</span>
            )}
          </div>
          <p className="text-white font-black text-sm leading-tight mb-1.5" style={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {item.title}
          </p>
          {item.overview && (
            <p className="text-zinc-400 leading-tight" style={{
              fontSize: '10px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {item.overview}
            </p>
          )}
          {item.releaseYear && (
            <p className="text-zinc-600 text-[10px] mt-1.5 font-medium">{item.releaseYear}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function MiniCard({ item }: { item: ContentItem }) {
  return (
    <Link
      to={`/movie/${item.id}`}
      draggable={false}
      className="poster-card shrink-0 block"
      style={{ width: '120px' }}
    >
      <PosterImage src={item.posterUrl} alt={item.title} className="w-full aspect-2/3 object-cover" />
      <div
        className="absolute bottom-0 left-0 right-0 px-2 pt-10 pb-2"
        style={{ background: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.82) 55%, transparent 100%)' }}
      >
        <p className="text-xs text-zinc-100 truncate font-semibold leading-tight">{item.title}</p>
        {item.tmdbRating && (
          <p className="text-[10px] mt-0.5 font-bold tabular-nums" style={{ color: '#f5c842' }}>★ {Number(item.tmdbRating).toFixed(1)}</p>
        )}
      </div>
    </Link>
  );
}

function RowSkeleton({ title }: { title: string }) {
  return (
    <section>
      <p className="section-title text-sm font-black text-white mb-4">{title}</p>
      <div className="flex gap-2.5">
        <div className="shrink-0 skeleton" style={{ width: '240px', height: '176px', borderRadius: '16px' }} />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="shrink-0 skeleton" style={{ width: '120px', aspectRatio: '2/3' }} />
        ))}
      </div>
    </section>
  );
}
