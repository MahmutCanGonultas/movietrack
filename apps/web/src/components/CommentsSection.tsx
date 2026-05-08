import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useAuthStore } from '@/store/authStore';

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userName: string;
  userImage: string | null;
  hearts: number;
  likes: number;
  userReactions: string[];
}

interface Props {
  contentId: string;
}

export function CommentsSection({ contentId }: Props) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', contentId],
    queryFn: async () => {
      const res = await fetch(`/api/comments/${contentId}`);
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    staleTime: 1000 * 60,
  });

  const addMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/comments/${contentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status}${text ? ': ' + text.slice(0, 120) : ''}`);
      }
      return res.json() as Promise<Comment>;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(['comments', contentId], (old = []) => [newComment, ...old]);
      setDraft('');
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ commentId, type }: { commentId: string; type: 'heart' | 'like' }) => {
      const res = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('failed');
      return res.json() as Promise<{ action: 'added' | 'removed' }>;
    },
    onMutate: async ({ commentId, type }) => {
      // Optimistic update
      queryClient.setQueryData<Comment[]>(['comments', contentId], (old = []) =>
        old.map((c) => {
          if (c.id !== commentId) return c;
          const hasReaction = c.userReactions.includes(type);
          return {
            ...c,
            hearts: type === 'heart' ? c.hearts + (hasReaction ? -1 : 1) : c.hearts,
            likes:  type === 'like'  ? c.likes  + (hasReaction ? -1 : 1) : c.likes,
            userReactions: hasReaction
              ? c.userReactions.filter((r) => r !== type)
              : [...c.userReactions, type],
          };
        }),
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', contentId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('failed');
    },
    onSuccess: (_, commentId) => {
      queryClient.setQueryData<Comment[]>(['comments', contentId], (old = []) =>
        old.filter((c) => c.id !== commentId),
      );
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || addMutation.isPending) return;
    addMutation.mutate(trimmed);
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="section-title text-sm font-black text-white">Yorumlar</h2>
        {comments.length > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(139,92,246,0.8)' }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Write area */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div
            className="rounded-2xl overflow-hidden transition-all"
            style={{
              border: draft ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div className="flex gap-3 p-4">
              <Avatar name={user.name} image={null} size={32} />
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                placeholder="Bu içerik hakkında ne düşünüyorsun?"
                rows={3}
                className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[11px]" style={{ color: draft.length > 450 ? '#f5c842' : '#3f3f46' }}>
                {draft.length}/500
              </span>
              <button
                type="submit"
                disabled={!draft.trim() || addMutation.isPending}
                className="btn-glow text-xs font-bold px-4 py-1.5 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addMutation.isPending ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </div>
          </div>
          {addMutation.isError && (
            <p className="text-xs mt-2 font-mono" style={{ color: '#f87171' }}>
              Hata: {(addMutation.error as Error)?.message ?? 'Bilinmeyen hata'}
            </p>
          )}
        </form>
      ) : (
        <div
          className="rounded-2xl p-5 mb-8 flex items-center justify-between gap-4"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)' }}
        >
          <p className="text-sm text-zinc-400">Yorum yapmak için giriş yapman gerekiyor.</p>
          <Link to="/login" className="btn-glow text-xs font-bold px-4 py-1.5 rounded-xl text-white shrink-0">
            Giriş Yap
          </Link>
        </div>
      )}

      {/* Comment list */}
      {isLoading ? (
        <CommentsSkeleton />
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 opacity-10">💬</div>
          <p className="text-zinc-600 text-sm">Henüz yorum yok. İlk yorumu sen yaz!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isOwn={comment.userId === user?.id}
              isLoggedIn={!!user}
              onReact={(type) => reactMutation.mutate({ commentId: comment.id, type })}
              onDelete={() => deleteMutation.mutate(comment.id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === comment.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentCard({
  comment, isOwn, isLoggedIn, onReact, onDelete, isDeleting,
}: {
  comment: Comment;
  isOwn: boolean;
  isLoggedIn: boolean;
  onReact: (type: 'heart' | 'like') => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const date = new Date(comment.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const totalReactions = comment.hearts + comment.likes;

  return (
    <div
      className="rounded-2xl p-4 transition-all group"
      style={{
        background: totalReactions > 0 ? 'rgba(139,92,246,0.04)' : 'rgba(255,255,255,0.025)',
        border: totalReactions > 0 ? '1px solid rgba(139,92,246,0.14)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={comment.userName} image={comment.userImage} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{comment.userName}</span>
              <span className="text-[10px] text-zinc-600">{date}</span>
            </div>
            {isOwn && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-2 py-0.5 rounded-lg"
                style={{ color: '#71717a', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#f87171';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#71717a';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                {isDeleting ? '…' : 'Sil'}
              </button>
            )}
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap wrap-break-word mb-3">
            {comment.body}
          </p>

          {/* Reaction buttons */}
          <div className="flex items-center gap-2">
            <ReactionBtn
              emoji="❤️"
              count={comment.hearts}
              active={comment.userReactions.includes('heart')}
              disabled={!isLoggedIn}
              onClick={() => onReact('heart')}
            />
            <ReactionBtn
              emoji="👍"
              count={comment.likes}
              active={comment.userReactions.includes('like')}
              disabled={!isLoggedIn}
              onClick={() => onReact('like')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReactionBtn({
  emoji, count, active, disabled, onClick,
}: {
  emoji: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all"
      style={{
        background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
        border: active ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
        color: active ? '#a78bfa' : '#52525b',
        transform: active ? 'scale(1.05)' : 'scale(1)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <span style={{ fontSize: '13px', lineHeight: 1 }}>{emoji}</span>
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  );
}

function Avatar({ name, image, size }: { name: string; image: string | null; size: number }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const hue = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, hsl(${hue},60%,38%), hsl(${(hue + 40) % 360},60%,52%))`,
        fontSize: size * 0.38,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start gap-3">
            <div className="skeleton rounded-full shrink-0" style={{ width: 34, height: 34 }} />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-3 rounded w-32" />
              <div className="skeleton h-3 rounded w-full" />
              <div className="skeleton h-3 rounded w-3/4" />
              <div className="flex gap-2 pt-1">
                <div className="skeleton h-6 w-14 rounded-xl" />
                <div className="skeleton h-6 w-14 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
