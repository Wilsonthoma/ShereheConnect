'use client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';
  avatarUrl?: string;
}

const TOKEN_KEY = 'attendee_access_token';
const REFRESH_KEY = 'attendee_refresh_token';
const USER_KEY = 'attendee_user';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/* ============================================
   STORAGE
   ============================================ */

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(
  token: string,
  refreshToken: string | null,
  user: AuthUser,
) {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ============================================
   JWT EXPIRY HELPERS
   ============================================ */

interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * True if the token is expired, or within `bufferSec` of expiring.
 * Default buffer = 30 seconds — refresh before it actually dies.
 */
export function isTokenExpired(token: string, bufferSec = 30): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    // If we can't decode it, don't assume it's valid
    return true;
  }
  return payload.exp * 1000 < Date.now() + bufferSec * 1000;
}

/**
 * A real "logged in" check — the token must exist, the user must exist,
 * AND the token must not be expired (within the 30s safety buffer).
 */
export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  if (!getUser()) return false;
  if (isTokenExpired(token)) return false;
  return true;
}

/* ============================================
   REFRESH
   ============================================ */

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchange the stored refresh token for a fresh access token.
 * Concurrent calls share a single in-flight request.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!res.ok) return null;

      const data = await res.json().catch(() => ({}));
      const accessToken: string | undefined = data.accessToken;
      const newRefresh: string | undefined = data.refreshToken;

      if (!accessToken) return null;

      localStorage.setItem(TOKEN_KEY, accessToken);
      if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);

      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/* ============================================
   UTILS
   ============================================ */

export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'ORGANIZER':
      return 'Organizer';
    case 'ADMIN':
      return 'Administrator';
    default:
      return 'Attendee';
  }
}

export function getHomeRoute(role: string): string {
  switch (role) {
    case 'ORGANIZER':
      return '/organizer/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/dashboard';
  }
}
