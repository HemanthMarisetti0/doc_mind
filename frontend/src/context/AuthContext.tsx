import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setUnauthorizedHandler, tokenStore } from '@/api/client';
import { authApi } from '@/api/endpoints';
import type { User } from '@/api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (token: string, user?: User) => Promise<void>;
  signOut: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const signIn = useCallback(async (token: string, knownUser?: User) => {
    tokenStore.set(token);
    setUser(knownUser ?? (await authApi.me()));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(signOut)
      .finally(() => setLoading(false));
  }, [signOut]);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, setUser }),
    [user, loading, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
