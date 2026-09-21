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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
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

export function isLoggedIn(): boolean {
  return !!getToken() && !!getUser();
}

export function setAuth(token: string, refreshToken: string | null, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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

/**
 * Get the home route for a given role.
 * Used after login and for redirecting on role mismatch.
 */
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
