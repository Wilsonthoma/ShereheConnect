'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getToken, isLoggedIn, clearAuth, AuthUser } from './auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [token, setToken] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(() => isLoggedIn());

  const sync = useCallback(() => {
    setUser(getUser());
    setToken(getToken());
    setAuthed(isLoggedIn());
    setLoading(false);
  }, []);

  useEffect(() => {
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const logout = useCallback(() => {
    clearAuth();
    router.replace('/login');
  }, [router]);

  return { user, token, loading, isLoggedIn: authed, logout };
}
