'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';

function formatKes(amount: number): string {
  if (amount === 0) return 'FREE';
  return `KES ${amount.toLocaleString('en-KE')}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'TBA';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getBookingSeats(b: BookingRecord): number {
  return b.occupantsCount && b.occupantsCount > 0 ? b.occupantsCount : b.quantity;
}

export default function EventAttendeesPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id ?? '';

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [search, setSearch] = useState('');
  const [checkInCode, setCheckInCode] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttendees = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await bookingsApi.listEventBookings(eventId);
      const list = Array.isArray(res) ? res : res?.items ?? [];
      setBookings(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load event bookings',
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const handleCheckIn = async (codeToUse?: string) => {
    const raw = (codeToUse ?? checkInCode).trim();
    if (!raw) {
      toast.error('Enter a ticket code', 'Provide a TKT code or QR token to check in.');
      return;
    }

    setCheckingIn(true);
    try {
      const token = getToken();
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const resp = await fetch(`${baseUrl}/bookings/tickets/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ticketCode: raw, eventId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message || 'Check-in failed');
      }

      if (data?.alreadyCheckedIn) {
        toast.success('Already checked in', `${raw} was already admitted.`);
      } else {
        toast.success('Ticket checked in', `${raw} marked as CHECKED_IN.`);
      }

      if (!codeToUse) setCheckInCode('');
      await loadAttendees();
    } catch (err: any) {
      toast.error('Check-in error', err?.message || 'Could not verify ticket.');
    } finally {
      setCheckingIn(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const name = b.attendee?.fullName?.toLowerCase() ?? '';
      const email = b.attendee?.email?.toLowerCase() ?? '';
      const phone = b.attendee?.phone?.toLowerCase() ?? '';
      const ref = b.bookingReference.toLowerCase();
      const ticketList: any[] = Array.isArray((b as any).eTickets)
        ? (b as any).eTickets
        : b.eTicket
          ? [b.eTicket]
          : [];
      const matchesTicket = ticketList.some((t) =>
        (t?.ticketCode ?? '').toLowerCase().includes(q),
      );
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        ref.includes(q) ||
        matchesTicket
      );
    });
  }, [bookings, search]);

  const summary = useMemo(() => {
    let totalTickets = 0;
    let confirmedTickets = 0;
    let grossKes = 0;

    for (const b of bookings) {
      const seats = getBookingSeats(b);
      totalTickets += seats;
      if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') {
        confirmedTickets += seats;
        grossKes += b.totalAmountKes;
      }
    }

    return {
      totalBookings: bookings.length,
      totalTickets,
      confirmedTickets,
      grossKes,
    };
  }, [bookings]);

  return (
    <main className="container-fluid py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white">
            Event Attendees &amp; Bookings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Monitor reservations, confirmed tickets, group occupants, and direct payment status.
          </p>
        </div>

        <Link
          href="/organizer"
          className="text-sm font-semibold text-[#1A8CC4] dark:text-[#29ABE2] underline"
        >
          Back to Organizer Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Bookings
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.totalBookings}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Tickets
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.totalTickets}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confirmed Tickets
          </p>
          <p className="text-2xl font-bold text-[#1A8CC4] dark:text-[#29ABE2] mt-1">
            {summary.confirmedTickets}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confirmed Value
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatKes(summary.grossKes)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="attendee-search-input"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
          >
            Search Bookings &amp; Guests
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
            Filter by attendee name, email, phone number, booking reference, or ticket code.
          </p>
          <input
            id="attendee-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by attendee, email, phone, reference, or ticket code..."
            className="w-full rounded-xl border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#3A3A3A] px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#29ABE2]"
          />
        </div>

        <div>
          <label
            htmlFor="ticket-checkin-input"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
          >
            Gate Ticket Check-In
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
            Enter or scan an e-ticket code (e.g., TKT-1234ABCD) to mark it as checked in.
          </p>
          <div className="flex gap-2">
            <input
              id="ticket-checkin-input"
              type="text"
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
              placeholder="Enter ticket code (e.g., TKT-1234ABCD)..."
              className="flex-1 rounded-xl border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#3A3A3A] px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#29ABE2]"
            />
            <button
              type="button"
              disabled={checkingIn}
              onClick={() => handleCheckIn()}
              className="rounded-xl bg-[#29ABE2] hover:bg-[#1A8CC4] text-white px-4 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-50 transition-colors"
            >
              {checkingIn ? 'Checking...' : 'Check In'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading attendees...
        </p>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-8 text-center text-sm text-slate-600 dark:text-slate-300">
          No bookings match the current view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Attendee</th>
                <th className="py-3.5 px-4">Tier &amp; Qty</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">E-Ticket</th>
                <th className="py-3.5 px-4">Booked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredBookings.map((b) => {
                const seats = getBookingSeats(b);
                const tierAny: any = b.ticketTier;
                const ticketList: any[] = Array.isArray((b as any).eTickets)
                  ? (b as any).eTickets
                  : b.eTicket
                    ? [b.eTicket]
                    : [];

                return (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#2B2B2B]/60"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {b.attendee?.fullName || 'Attendee'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {b.attendee?.email || ''}
                        {b.attendee?.phone ? ` / ${b.attendee.phone}` : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                      <div>
                        {b.quantity}x {b.ticketTier.name}
                        {tierAny?.isGroupSubgroup
                          ? ` (${tierAny.groupCategory || 'GROUP'} • ${seats} guests)`
                          : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {formatKes(b.totalAmountKes)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full border border-[#29ABE2]/40 bg-[#E0F2FE]/60 dark:bg-[#29ABE2]/15 px-2.5 py-0.5 text-xs font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {ticketList.length === 0 ? (
                        'Pending'
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {ticketList.map((t) => {
                            const checked = t.status === 'CHECKED_IN';
                            return (
                              <button
                                key={t.id || t.ticketCode}
                                type="button"
                                disabled={checked || b.status !== 'CONFIRMED'}
                                onClick={() => handleCheckIn(t.ticketCode)}
                                className="rounded-md border border-[#29ABE2]/40 bg-[#E0F2FE]/60 dark:bg-[#2B2B2B] px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100 hover:bg-[#29ABE2] hover:text-white disabled:opacity-70 transition-colors"
                              >
                                {t.ticketCode} ({t.status})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(b.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}