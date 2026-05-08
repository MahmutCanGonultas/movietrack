import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

interface AuthStore {
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setUserImage: (image: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  authLoading: true,
  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setUserImage: (image) => set((s) => s.user ? { user: { ...s.user, image } } : {}),
}));
