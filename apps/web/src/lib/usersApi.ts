import { api } from './api';
import { getToken } from './auth';

export type UserRole = 'ATTENDEE' | 'ORGANIZER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVISION';

export interface AdminUserListItem {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileImageUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isOnline: boolean;
}

export interface AdminUserDetail extends AdminUserListItem {
  organizerProfile?: any;
  loginSessions?: any[];
  _count?: {
    bookings: number;
    approvedEvents: number;
    notifications: number;
  };
}

export interface OnlineUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  profileImageUrl: string | null;
  loginSessions: {
    lastActiveAt: string;
    deviceLabel: string | null;
    ipAddress: string | null;
  }[];
}

export interface ListUsersParams {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface ListUsersResponse {
  items: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

function token(): string | null {
  return getToken();
}

export const adminUsersApi = {
  list: (params: ListUsersParams) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.role) qs.set('role', params.role);
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<ListUsersResponse>(`/admin/users${suffix}`, token());
  },

  detail: (id: string) =>
    api.get<AdminUserDetail>(`/admin/users/${id}`, token()),

  updateStatus: (id: string, status: UserStatus, reason?: string) =>
    api.patch(`/admin/users/${id}/status`, { status, reason }, token()),

  softDelete: (id: string) =>
    api.delete(`/admin/users/${id}`, token()),

  verifyEmail: (id: string) =>
    api.patch(`/admin/users/${id}/verify-email`, {}, token()),

  revokeSessions: (id: string) =>
    api.delete<{ revoked: number }>(`/admin/users/${id}/sessions`, token()),

  listOnline: () => api.get<OnlineUser[]>('/admin/users/online', token()),

  listKycQueue: () =>
    api.get<any[]>('/admin/users/organizers/kyc', token()),

  reviewKyc: (organizerId: string, kycStatus: KycStatus, notes?: string) =>
    api.patch(
      `/admin/users/organizers/${organizerId}/kyc`,
      { kycStatus, notes },
      token(),
    ),
};
