import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthLoading } = useAuthStore();
  const { data: session, isPending } = authClient.useSession();
  const queryClient = useQueryClient();
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setAuthLoading(isPending);
    if (!isPending) {
      const newId = session?.user?.id ?? null;
      // Kullanıcı değiştiyse (logout veya farklı hesap) tüm cache'i temizle
      if (prevUserId.current !== undefined && prevUserId.current !== newId) {
        queryClient.clear();
      }
      prevUserId.current = newId;
      setUser(session?.user
        ? { id: session.user.id, email: session.user.email, name: session.user.name, image: session.user.image ?? null }
        : null,
      );
    }
  }, [session, isPending, setUser, setAuthLoading, queryClient]);

  return <>{children}</>;
}
