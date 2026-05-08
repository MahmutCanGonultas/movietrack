import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { PosterImage } from '@/components/PosterImage';

interface ContentItem {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  tmdbRating: string | null;
  type: 'movie' | 'tv';
}

interface ContentPage {
  data: ContentItem[];
  page: number;
  hasNextPage: boolean;
}

interface ContentGridProps {
  search?: string;
  type?: 'movie' | 'tv';
  genreId?: number;
  yearFrom?: number;
}

export function ContentGrid({ search = '', type, genreId, yearFrom }: ContentGridProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['content', { search, type, genreId, yearFrom }],
      queryFn: async ({ pageParam = 1 }) => {
        const params = new URLSearchParams({
          page: String(pageParam),
          limit: '24',
          ...(search && { search }),
          ...(type && { type }),
          ...(genreId !== undefined && { genreId: String(genreId) }),
          ...(yearFrom !== undefined && { yearFrom: String(yearFrom) }),
        });
        const res = await fetch(`/api/content?${params}`);
        return res.json() as Promise<ContentPage>;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <ContentSkeleton />;
  if (isError) return <p className="text-red-400 text-sm">İçerik yüklenemedi.</p>;

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl opacity-10">🔍</div>
        <p className="text-zinc-600 text-sm text-center">
          {search ? <>"<span className="text-zinc-400">{search}</span>" için sonuç bulunamadı.</> : 'İçerik bulunamadı.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* pt-3 + negative mt gives scaled cards room to expand upward without clipping */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-3 -mt-3">
        {items.map((item, i) => (
          <ContentCard key={item.id} item={item} index={i} />
        ))}
      </div>

      <div ref={bottomRef} className="h-8 mt-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="flex gap-2 items-center text-zinc-700 text-xs">
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#8b5cf6', animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#8b5cf6', animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#8b5cf6', animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, index }: { item: ContentItem; index: number }) {
  return (
    <Link
      to={`/movie/${item.id}`}
      className="poster-card block fade-in-up"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: 'both' }}
    >
      <PosterImage src={item.posterUrl} alt={item.title} className="w-full aspect-2/3 object-cover" />

      {/* Type badge */}
      <div
        className="absolute top-1.5 left-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide"
        style={{
          background: item.type === 'tv' ? 'rgba(34,211,238,0.85)' : 'rgba(139,92,246,0.85)',
          backdropFilter: 'blur(6px)',
          color: '#fff',
          letterSpacing: '0.06em',
        }}
      >
        {item.type === 'tv' ? 'Dizi' : 'Film'}
      </div>

      {/* Rating badge */}
      {item.tmdbRating && (
        <div
          className="absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md tabular-nums"
          style={{
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            color: '#f5c842',
            border: '1px solid rgba(245,200,66,0.18)',
          }}
        >
          ★ {Number(item.tmdbRating).toFixed(1)}
        </div>
      )}

      {/* Bottom title overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 px-2 pt-10 pb-2"
        style={{ background: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0.85) 55%, transparent 100%)' }}
      >
        <p className="text-xs text-zinc-100 truncate font-semibold leading-tight">{item.title}</p>
        <p className="text-[10px] text-zinc-600 mt-0.5 font-medium tabular-nums">{item.releaseYear ?? '—'}</p>
      </div>
    </Link>
  );
}

function ContentSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: '14px' }} />
      ))}
    </div>
  );
}
