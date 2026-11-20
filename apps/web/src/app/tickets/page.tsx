'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'TBA';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function TicketsPage() {
  const [bookingsWithTickets, setBookingsWithTickets] = useState<
    BookingRecord[]
  >([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError(null);
      try {
        const list = await bookingsApi.listMyBookings();
        if (!active) return;
        const issued = list.filter((b) => Boolean(b.eTicket));
        setBookingsWithTickets(issued);
        if (issued.length > 0) {
          setSelectedBooking(issued[0]);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load e-tickets',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTickets();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="container-fluid py-8 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white">
          My E-Tickets
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Present your e-ticket code or QR token at the event entrance for gate
          validation[cite: 18, 26].
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading e-tickets...
        </p>
      ) : bookingsWithTickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-8 text-center space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You do not have any issued e-tickets yet.
          </p>
          <Link href="/bookings" className="btn-coddy inline-block text-sm">
            Go to My Bookings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4">
            {bookingsWithTickets.map((booking) => {
              const ticket = booking.eTicket!;
              const active = selectedBooking?.id === booking.id;

              return (
                <article
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all space-y-3 ${
                    active
                      ? 'border-[#29ABE2] bg-[#E0F2FE]/50 dark:bg-[#29ABE2]/15'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {ticket.ticketCode} / Ref: {booking.bookingReference}
                      </p>
                      <h2 className="text-lg text-slate-900 dark:text-white mt-0.5">
                        {booking.event.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {booking.event.venueName}, {booking.event.county} /{' '}
                        {formatDateTime(booking.event.startsAt)}
                      </p>
                    </div>
                    <span className="rounded-full border border-[#29ABE2]/40 bg-white dark:bg-[#2B2B2B] px-3 py-1 text-xs font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                      {ticket.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Tier:{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {booking.ticketTier.name}
                    </span>{' '}
                    / Quantity:{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {booking.quantity}
                    </span>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 h-fit space-y-4">
            <h2 className="text-base text-slate-900 dark:text-white">
              Gate Pass Details
            </h2>
            {selectedBooking?.eTicket ? (
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Event</p>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    {selectedBooking.event.title}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Ticket Code
                  </p>
                  <p className="font-mono font-semibold text-sm text-[#1A8CC4] dark:text-[#29ABE2]">
                    {selectedBooking.eTicket.ticketCode}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">
                    QR Token Payload
                  </p>
                  <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] p-3 font-mono text-slate-800 dark:text-slate-100 break-all select-all">
                    {selectedBooking.eTicket.qrToken}
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Each ticket can be admitted once at the gate[cite: 18].
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a ticket to inspect its pass details.
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}