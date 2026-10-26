'use client';

import { api, ApiException } from './api';

export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'NEEDS_REVISION'
  | 'APPROVED'
  | 'LIVE'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface TicketTier {
  id?: string;
  name: string;
  description?: string;
  priceKes: number;
  quantityTotal: number;
  quantitySold?: number;
  quantityReserved?: number;
  salesStartAt?: string;
  salesEndAt?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface EventCategory {
  id: string;
  code: string;
  name: string;
}

export interface EventOrganizer {
  businessName: string;
  bio?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  county?: string;
  averageRating?: number;
  kycStatus?: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  venueName: string;
  address: string;
  county: string;
  latitude?: number | null;
  longitude?: number | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  rejectionReason?: string | null;
  maxAttendees?: number | null;
  category?: EventCategory | null;
  organizer?: EventOrganizer;
  ticketTiers?: TicketTier[];
  reviews?: any[];
  _count?: { bookings: number };
  createdAt?: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
}

export interface EventListResponse {
  total: number;
  limit: number;
  offset: number;
  items: EventItem[];
}

export interface CreateEventPayload {
  title: string;
  description: string;
  categoryId?: string;
  coverImageUrl?: string;
  venueName: string;
  address: string;
  county: string;
  latitude?: number;
  longitude?: number;
  startsAt: string;
  endsAt: string;
  maxAttendees?: number;
  ticketTiers: TicketTier[];
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  coverImageUrl?: string;
  venueName?: string;
  address?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  startsAt?: string;
  endsAt?: string;
  maxAttendees?: number;
  ticketTiers?: TicketTier[];
}

export interface AttendeeListItem {
  id: string;
  reference: string;
  status: string;
  quantity: number;
  totalAmountKes: number;
  createdAt: string;
  confirmedAt?: string | null;
  attendee: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  tier: {
    name: string;
    priceKes: number;
  };
  ticket: {
    ticketCode: string;
    status: string;
  } | null;
}

export interface AttendeeListResponse {
  total: number;
  items: AttendeeListItem[];
}

/* ─────────────────────────────
   PUBLIC
   ───────────────────────────── */
export const publicEventsApi = {
  list: (params?: {
    q?: string;
    categoryId?: string;
    county?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.county) query.set('county', params.county);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get<EventListResponse>(`/events${qs ? `?${qs}` : ''}`);
  },
  detail: (slug: string) => api.get<EventItem>(`/events/${slug}`),
};

/* ─────────────────────────────
   ORGANIZER
   ───────────────────────────── */
export const organizerEventsApi = {
  list: (token: string, params?: { status?: EventStatus; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.q) query.set('q', params.q);
    const qs = query.toString();
    return api.get<EventListResponse>(
      `/organizer/events${qs ? `?${qs}` : ''}`,
      token,
    );
  },

  detail: (token: string, id: string) =>
    api.get<EventItem>(`/organizer/events/${id}`, token),

  get: (token: string, id: string) =>
    api.get<EventItem>(`/organizer/events/${id}`, token),

  create: (token: string, data: CreateEventPayload) =>
    api.post<EventItem>(`/organizer/events`, data, token),

  update: (token: string, id: string, data: UpdateEventPayload) =>
    api.patch<EventItem>(`/organizer/events/${id}`, data, token),

  submit: (token: string, id: string) =>
    api.post<EventItem>(`/organizer/events/${id}/submit`, {}, token),

  delete: (token: string, id: string) =>
    api.delete<{ success: boolean; deletedId: string }>(
      `/organizer/events/${id}`,
      token,
    ),

  cancel: (token: string, id: string, reason?: string) =>
    api.post<EventItem>(
      `/organizer/events/${id}/cancel`,
      { reason },
      token,
    ),

  duplicate: (token: string, id: string) =>
    api.post<EventItem>(`/organizer/events/${id}/duplicate`, {}, token),

  attendees: (token: string, id: string) =>
    api.get<AttendeeListResponse>(
      `/organizer/events/${id}/attendees`,
      token,
    ),
};

/* ─────────────────────────────
   ADMIN
   ───────────────────────────── */
export const adminEventsApi = {
  list: (
    token: string,
    params?: { status?: EventStatus; q?: string; county?: string },
  ) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.q) query.set('q', params.q);
    if (params?.county) query.set('county', params.county);
    const qs = query.toString();
    return api.get<EventListResponse>(
      `/admin/events${qs ? `?${qs}` : ''}`,
      token,
    );
  },
  get: (token: string, id: string) =>
    api.get<EventItem>(`/admin/events/${id}`, token),
  review: (
    token: string,
    id: string,
    data: {
      action: 'APPROVED' | 'REJECTED' | 'REQUESTED_CHANGES';
      notes?: string;
      rejectionReason?: string;
    },
  ) => api.post<EventItem>(`/admin/events/${id}/review`, data, token),
};

export { ApiException };
