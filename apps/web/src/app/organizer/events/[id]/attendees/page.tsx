'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';

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

export default function EventAttendeesPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id ?? '';

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let active = true;

    async function loadAttendees() {
      setLoading(true);
      setError(null);
      try {
        const list = await bookingsApi.listEventBookings(eventId);
        if (!active) return;
        setBookings(list);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load event bookings',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAttendees();
    return () => {
      active = false;
    };
  }, [eventId]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const name = b.attendee?.fullName?.toLowerCase() ?? '';
      const email = b.attendee?.email?.toLowerCase() ?? '';
      const phone = b.attendee?.phone?.toLowerCase() ?? '';
      const ref = b.bookingReference.toLowerCase();
      const code = b.eTicket?.ticketCode?.toLowerCase() ?? '';
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        ref.includes(q) ||
        code.includes(q)
      );
    });
  }, [bookings, search]);

  const summary = useMemo(() => {
    let totalTickets = 0;
    let confirmedTickets = 0;
    let grossKes = 0;

    for (const b of bookings) {
      totalTickets += b.quantity;
      if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') {
        confirmedTickets += b.quantity;
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
            Event Attendees & Bookings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Monitor reservations, confirmed tickets, and direct payment
            status[cite: 26, 29, 31].
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by attendee, email, phone, reference, or ticket code..."
          className="w-full sm:max-w-md rounded-xl border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#3A3A3A] px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#29ABE2]"
        />
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
                <th className="py-3.5 px-4">Tier & Qty</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">E-Ticket</th>
                <th className="py-3.5 px-4">Booked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-[#2B2B2B]/60">
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
                    {b.quantity}x {b.ticketTier.name}
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
                    {b.eTicket ? `${b.eTicket.ticketCode} (${b.eTicket.status})` : 'Pending'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}