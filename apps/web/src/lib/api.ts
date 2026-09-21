/**
 * ShereheConnect — API Client
 * Centralized HTTP client for all backend calls.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

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
};

/* ============================================
   EXTENDED AUTH API
   Password reset, change password, verify email
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

  changePassword: (currentPassword: string, newPassword: string, token: string) =>
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
