'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  bookingsApi,
  type BookingRecord,
  type BookingStatus,
} from '@/lib/bookingsApi';

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

function useCountdown(expiresAt: string, active: boolean): string {
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!active) {
      setRemaining('');
      return;
    }

    function update() {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setRemaining('00:00 (Expired)');
        return;
      }
      const totalSeconds = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      setRemaining(
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      );
    }

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, active]);

  return remaining;
}

function BookingCard({
  booking,
  onCancel,
  cancellingId,
}: {
  booking: BookingRecord;
  onCancel: (id: string) => void;
  cancellingId: string | null;
}) {
  const isPending = booking.status === 'PENDING';
  const countdown = useCountdown(booking.expiresAt, isPending);
  const canCancel =
    booking.status === 'PENDING' || booking.status === 'PAYMENT_RECEIVED';

  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {booking.bookingReference}
          </p>
          <h2 className="text-lg text-slate-900 dark:text-white">
            <Link
              href={`/events/${booking.event.slug}`}
              className="hover:text-[#29ABE2] transition-colors"
            >
              {booking.event.title}
            </Link>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {booking.event.venueName}, {booking.event.county} /{' '}
            {formatDateTime(booking.event.startsAt)}
          </p>
        </div>

        <span className="rounded-full border border-[#29ABE2]/40 bg-[#E0F2FE]/60 dark:bg-[#29ABE2]/15 px-3 py-1 text-xs font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border-t border-slate-200 dark:border-slate-700 pt-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tickets</p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {booking.quantity}x {booking.ticketTier.name}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Amount
          </p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {formatKes(booking.totalAmountKes)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isPending ? 'Hold Remaining' : 'Created'}
          </p>
          <p className="font-semibold font-mono text-slate-900 dark:text-white">
            {isPending
              ? countdown || '15:00'
              : formatDateTime(booking.createdAt)}
          </p>
        </div>
      </div>

      {isPending && booking.totalAmountKes > 0 && (
        <div className="rounded-xl bg-slate-50 dark:bg-[#2B2B2B] border border-slate-200 dark:border-slate-700 p-3.5 text-xs space-y-1">
          <p className="font-semibold text-slate-900 dark:text-white">
            Direct Organizer Payment Instructions
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Pay{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatKes(booking.totalAmountKes)}
            </span>{' '}
            directly to the organizer using booking reference{' '}
            <span className="font-mono font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
              {booking.bookingReference}
            </span>{' '}
            before the reservation hold expires.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4 text-sm">
          {booking.eTicket && (
            <Link
              href="/tickets"
              className="font-semibold text-[#1A8CC4] dark:text-[#29ABE2] underline"
            >
              View E-Ticket ({booking.eTicket.ticketCode})
            </Link>
          )}
        </div>

        {canCancel && (
          <button
            type="button"
            disabled={cancellingId === booking.id}
            onClick={() => onCancel(booking.id)}
            className="rounded-full border border-red-500/50 px-4 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
      </div>
    </article>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await bookingsApi.listMyBookings(
        statusFilter ? { status: statusFilter as BookingStatus } : undefined,
      );
      setBookings(items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load bookings',
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    setError(null);
    try {
      await bookingsApi.cancelBooking(id, {
        reason: 'Cancelled from bookings dashboard',
      });
      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to cancel booking',
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="container-fluid py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white">
            My Bookings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Track active 15-minute ticket holds, payment references, and
            confirmed reservations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="booking-status-filter"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            Status
          </label>
          <select
            id="booking-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#3A3A3A] px-3 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#29ABE2]"
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading your bookings...
        </p>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-8 text-center space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No bookings found.
          </p>
          <Link href="/events" className="btn-coddy inline-block text-sm">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />
          ))}
        </div>
      )}
    </main>
  );
}