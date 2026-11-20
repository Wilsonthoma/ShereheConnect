export type BookingStatus =
  | 'PENDING'
  | 'PAYMENT_RECEIVED'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED'
  | 'CHECKED_IN';

export type TicketStatus = 'ISSUED' | 'CHECKED_IN' | 'SCANNED' | 'REVOKED';

export interface CreateBookingPayload {
  eventId: string;
  ticketTierId: string;
  quantity: number;
}

export interface BookingFilterParams {
  status?: BookingStatus;
  eventId?: string;
  q?: string;
}

export interface CancelBookingPayload {
  reason?: string;
}

export interface CheckInTicketPayload {
  ticketCode?: string;
  qrToken?: string;
  eventId?: string;
}

export interface BookingEventSummary {
  id: string;
  title: string;
  slug: string;
  venueName: string;
  address?: string | null;
  county: string;
  startsAt: string;
  endsAt: string;
  coverImageUrl?: string | null;
}

export interface BookingTicketTierSummary {
  id: string;
  name: string;
  priceKes: number;
  isGroupSubgroup?: boolean;
  groupCategory?: string | null;
  occupantsPerUnit?: number;
  pricingMode?: 'PER_OCCUPANT' | 'BUNDLE_FIXED' | string;
}

export interface BookingETicket {
  id: string;
  bookingId: string;
  ticketIndex?: number;
  ticketCode: string;
  qrToken: string;
  guestName?: string | null;
  status: TicketStatus;
  checkedInAt?: string | null;
  scannedAt?: string | null;
  createdAt: string;
}

export interface BookingPaymentSummary {
  id: string;
  amountKes: number;
  status: string;
  mpesaReceipt?: string | null;
  createdAt: string;
}

export interface BookingAttendeeSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface BookingRecord {
  id: string;
  bookingReference: string;
  attendeeId: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
  occupantsCount?: number | null;
  unitPriceKes: number;
  totalAmountKes: number;
  status: BookingStatus;
  expiresAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  event: BookingEventSummary;
  ticketTier: BookingTicketTierSummary;
  eTicket?: BookingETicket | null;
  eTickets?: BookingETicket[];
  payments?: BookingPaymentSummary[];
  attendee?: BookingAttendeeSummary;
}

export interface EventBookingsSummary {
  totalBookings: number;
  totalOccupants: number;
  confirmedBookings: number;
  confirmedOccupants: number;
  pendingBookings: number;
  pendingOccupants: number;
  checkedInTickets: number;
  grossRevenueKes: number;
}

export interface EventBookingsResponse {
  eventId: string;
  eventTitle: string;
  summary: EventBookingsSummary;
  items: BookingRecord[];
}

export interface CheckInTicketResponse {
  alreadyCheckedIn: boolean;
  ticket: BookingETicket & {
    booking?: {
      id: string;
      bookingReference: string;
      occupantsCount?: number | null;
      attendee?: { id: string; fullName: string; phone?: string | null };
      ticketTier?: {
        id: string;
        name: string;
        groupCategory?: string | null;
      };
    };
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:3001';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem('accessToken') ||
    window.localStorage.getItem('token') ||
    null
  );
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const parsed = data as { message?: string | string[] } | null;
    const message =
      (parsed &&
        (Array.isArray(parsed.message)
          ? parsed.message.join(', ')
          : parsed.message)) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export const bookingsApi = {
  createBooking(payload: CreateBookingPayload): Promise<BookingRecord> {
    return request<BookingRecord>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listMyBookings(filter?: BookingFilterParams): Promise<BookingRecord[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.eventId) params.set('eventId', filter.eventId);
    if (filter?.q) params.set('q', filter.q);
    const query = params.toString();
    return request<BookingRecord[]>(`/bookings/my${query ? `?${query}` : ''}`);
  },

  getBookingById(id: string): Promise<BookingRecord> {
    return request<BookingRecord>(`/bookings/${encodeURIComponent(id)}`);
  },

  cancelBooking(
    id: string,
    payload?: CancelBookingPayload,
  ): Promise<BookingRecord> {
    return request<BookingRecord>(
      `/bookings/${encodeURIComponent(id)}/cancel`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload ?? {}),
      },
    );
  },

  listEventBookings(
    eventId: string,
    filter?: BookingFilterParams,
  ): Promise<EventBookingsResponse> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.q) params.set('q', filter.q);
    const query = params.toString();
    return request<EventBookingsResponse>(
      `/bookings/event/${encodeURIComponent(eventId)}${query ? `?${query}` : ''}`,
    );
  },

  checkInTicket(payload: CheckInTicketPayload): Promise<CheckInTicketResponse> {
    return request<CheckInTicketResponse>('/bookings/tickets/check-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};