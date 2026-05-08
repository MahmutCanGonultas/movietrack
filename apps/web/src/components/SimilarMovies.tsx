import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';

interface SimilarItem {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  tmdbRating: string | null;
  type: 'movie' | 'tv';
}

export function SimilarMovies({ contentId }: { contentId: string }) {
  const { data: similar = [] } = useQuery<SimilarItem[]>({
    queryKey: ['similar', contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/similar`);
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  if (similar.length === 0) return null;

  return (
    <div className="mt-10 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 className="section-title text-xs font-bold text-zinc-400 uppercase tracking-widest mb-5">
        Bunları da Beğenebilirsin
      </h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {similar.map((item) => (
          <Link
            key={item.id}
            to={`/movie/${item.id}`}
            className="shrink-0 poster-card"
            style={{ width: '120px' }}
          >
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt={item.title}
                className="w-full object-cover"
                style={{ aspectRatio: '2/3' }}
              />
            ) : (
              <div
                className="w-full flex items-center justify-center"
                style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-3xl opacity-10">▶</span>
              </div>
            )}
            <div
              className="absolute bottom-0 left-0 right-0 px-2 pt-8 pb-2"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)' }}
            >
              <p className="text-zinc-100 truncate font-semibold leading-tight" style={{ fontSize: '10px' }}>
                {item.title}
              </p>
              {item.tmdbRating && (
                <p className="font-black tabular-nums" style={{ fontSize: '9px', color: '#f5c842' }}>
                  ★ {Number(item.tmdbRating).toFixed(1)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
