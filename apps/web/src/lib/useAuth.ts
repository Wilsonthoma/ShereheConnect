'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUser, getToken, isLoggedIn, clearAuth, AuthUser } from './auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const sync = useCallback(() => {
    setUser(getUser());
    setToken(getToken());
    setAuthed(isLoggedIn());
    setLoading(false);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = '/';
  }, []);

  return { user, token, loading, isLoggedIn: authed, logout };
}
