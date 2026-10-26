/**
 * ShereheConnect — API Client
 * Centralized HTTP client with automatic token refresh on 401.
 */

import {
  getToken,
  isTokenExpired,
  refreshAccessToken,
  clearAuth,
  getRefreshToken,
} from './auth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export class ApiException extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
  }
}

/* ============================================
   CORE REQUEST — with 401 refresh + retry
   ============================================ */

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  isRetry = false,
): Promise<T> {
  // Proactively refresh if the token is about to expire
  let effectiveToken = token ?? null;

  if (
    effectiveToken &&
    !isRetry &&
    isTokenExpired(effectiveToken) &&
    getRefreshToken()
  ) {
    const fresh = await refreshAccessToken();
    if (fresh) effectiveToken = fresh;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiException(
      err?.message ?? 'Network error — please check your connection.',
      0,
    );
  }

  // ============================================
  // Handle 401 — try to refresh, then retry ONCE
  // ============================================
  if (response.status === 401 && !isRetry && getRefreshToken()) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      return request<T>(path, options, fresh, true);
    }
    // Refresh failed → clean logout
    handleSessionExpired();
    throw new ApiException(
      'Your session expired. Please log in again.',
      401,
    );
  }

  // If we still got a 401 on a protected route with no refresh available
  if (response.status === 401 && !isRetry) {
    // Do NOT auto-logout for public endpoints — just throw
    // If token was provided, that means it was a protected call
    if (token) {
      handleSessionExpired();
    }
    const data = await response.json().catch(() => ({}));
    const message =
      data?.message ?? data?.error ?? 'Unauthorized';
    throw new ApiException(
      Array.isArray(message) ? message.join(', ') : message,
      401,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.message ||
      data.error ||
      `Request failed with status ${response.status}`;
    throw new ApiException(
      Array.isArray(message) ? message.join(', ') : message,
      response.status,
    );
  }

  return data as T;
}

function handleSessionExpired() {
  if (typeof window === 'undefined') return;
  clearAuth();
  // Broadcast event so Navbar and others can react immediately
  window.dispatchEvent(new Event('sherehe:auth-expired'));

  // Redirect to login with a return path and an expired flag
  const path = window.location.pathname;
  if (!path.startsWith('/login') && !path.startsWith('/register')) {
    window.location.href = `/login?expired=1&next=${encodeURIComponent(path)}`;
  }
}

/* ============================================
   PUBLIC api object (unchanged API surface)
   ============================================ */

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'GET' }, token),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),

  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, token),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE' }, token),
};

/* ============================================
   AUTH API
   ============================================ */

export interface AuthUserResponse {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';
  status: string;
  emailVerified?: boolean;
}

export interface LoginResponse {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterResponse extends LoginResponse {
  user: AuthUserResponse & { requiresVerification?: boolean };
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  register: (data: {
    email: string;
    phone: string;
    password: string;
    fullName: string;
    role?: 'ATTENDEE' | 'ORGANIZER';
  }) => api.post<RegisterResponse>('/auth/register', data),

  me: (token: string) => api.get<AuthUserResponse>('/auth/me', token),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken?: string }>(
      '/auth/refresh',
      { refreshToken },
    ),
};

/* ============================================
   EXTENDED AUTH API
   ============================================ */

export const extendedAuthApi = {
  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }),

  resendVerification: (email: string) =>
    api.post<{ message: string }>('/auth/resend-verification', { email }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),

  changePassword: (
    currentPassword: string,
    newPassword: string,
    token: string,
  ) =>
    api.post<{ message: string }>(
      '/auth/change-password',
      { currentPassword, newPassword },
      token,
    ),
};

/* ============================================
   OTP API
   ============================================ */

export const otpApi = {
  verifyOtp: (email: string, otp: string) =>
    api.post<{
      message: string;
      verified?: boolean;
      alreadyVerified?: boolean;
    }>('/auth/verify-otp', { email, otp }),

  resendOtp: (email: string) =>
    api.post<{ message: string; alreadyVerified?: boolean }>(
      '/auth/resend-otp',
      { email },
    ),
};

/* ============================================
   PROFILE API
   ============================================ */

export const profileApi = {
  update: (
    data: { fullName?: string; phone?: string },
    token: string,
  ) =>
    api.patch<{
      message: string;
      user: {
        id: string;
        email: string;
        phone: string;
        fullName: string;
        role: string;
        status: string;
        emailVerified: boolean;
      };
    }>('/auth/profile', data, token),
};
