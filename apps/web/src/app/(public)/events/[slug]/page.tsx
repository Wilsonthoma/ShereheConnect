'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';

interface EventTicketTier {
  id: string;
  name: string;
  description?: string | null;
  priceKes: number;
  quantityTotal: number;
  quantitySold: number;
  quantityReserved: number;
  isActive?: boolean;
  salesStartAt?: string | null;
  salesEndAt?: string | null;
}

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  venueName?: string | null;
  address?: string | null;
  county?: string | null;
  startsAt: string;
  endsAt?: string | null;
  coverImageUrl?: string | null;
  status?: string;
  ticketTiers?: EventTicketTier[];
  organizer?: {
    id?: string;
    businessName?: string | null;
  } | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:3001';

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

function getAvailableCount(tier: EventTicketTier): number {
  return Math.max(
    0,
    tier.quantityTotal - tier.quantitySold - tier.quantityReserved,
  );
}

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? '';

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(
    null,
  );

  useEffect(() => {
    if (!slug) return;
    let active = true;

    async function loadEvent() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/events/${encodeURIComponent(slug)}`,
          {
            credentials: 'include',
          },
        );
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        if (!res.ok) {
          throw new Error(
            data?.message || `Failed to load event (${res.status})`,
          );
        }

        if (!active) return;
        const loadedEvent: EventDetail = data?.event ?? data;
        setEvent(loadedEvent);

        const tiers = loadedEvent.ticketTiers ?? [];
        const firstAvailable =
          tiers.find(
            (t) => t.isActive !== false && getAvailableCount(t) > 0,
          ) ?? tiers[0];
        if (firstAvailable) {
          setSelectedTierId(firstAvailable.id);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : 'Unable to load event details',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvent();
    return () => {
      active = false;
    };
  }, [slug]);

  const tiers = useMemo(() => event?.ticketTiers ?? [], [event]);

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === selectedTierId) ?? null,
    [tiers, selectedTierId],
  );

  const maxSelectable = useMemo(() => {
    if (!selectedTier) return 1;
    return Math.min(50, Math.max(1, getAvailableCount(selectedTier)));
  }, [selectedTier]);

  useEffect(() => {
    if (quantity > maxSelectable) {
      setQuantity(maxSelectable);
    }
  }, [maxSelectable, quantity]);

  const totalKes = (selectedTier?.priceKes ?? 0) * quantity;

  async function handleBookTickets(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !selectedTier) return;

    setSubmitting(true);
    setBookingError(null);
    setCreatedBooking(null);

    try {
      const booking = await bookingsApi.createBooking({
        eventId: event.id,
        ticketTierId: selectedTier.id,
        quantity,
      });
      setCreatedBooking(booking);

      const refreshRes = await fetch(
        `${API_BASE_URL}/events/${encodeURIComponent(slug)}`,
        { credentials: 'include' },
      );
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setEvent(refreshed?.event ?? refreshed);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create booking';
      if (
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('401')
      ) {
        router.push(
          `/login?redirect=${encodeURIComponent(`/events/${slug}`)}`,
        );
        return;
      }
      setBookingError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="container-fluid py-10">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading event...
        </p>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="container-fluid py-10 space-y-4">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error || 'Event not found'}
        </div>
        <Link
          href="/events"
          className="inline-block text-sm font-semibold text-[#29ABE2] hover:text-[#1A8CC4]"
        >
          Back to events
        </Link>
      </main>
    );
  }

  return (
    <main className="container-fluid py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <section className="lg:col-span-2 space-y-6">
        {event.coverImageUrl && (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-72 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
          />
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#29ABE2]">
            {event.county || 'Kenya'}
            {event.venueName ? ` / ${event.venueName}` : ''}
          </p>
          <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-white">
            {event.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Starts: {formatDateTime(event.startsAt)}
            {event.endsAt ? ` / Ends: ${formatDateTime(event.endsAt)}` : ''}
          </p>
          {event.organizer?.businessName && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Organizer: {event.organizer.businessName}
            </p>
          )}
        </div>

        {event.description && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
            {event.description}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 h-fit space-y-5">
        <h2 className="text-lg text-slate-900 dark:text-white">Select Tickets</h2>

        {tiers.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No ticket tiers are available for this event yet.
          </p>
        ) : (
          <form onSubmit={handleBookTickets} className="space-y-4">
            <div className="space-y-2.5">
              {tiers.map((tier) => {
                const available = getAvailableCount(tier);
                const disabled = tier.isActive === false || available <= 0;
                const isSelected = tier.id === selectedTierId;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-[#29ABE2] bg-[#E0F2FE]/60 dark:bg-[#29ABE2]/15'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B2B2B]'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {tier.name}
                      </span>
                      <span className="font-bold text-sm text-[#1A8CC4] dark:text-[#29ABE2]">
                        {formatKes(tier.priceKes)}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {tier.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {available > 0 ? `${available} remaining` : 'Sold out'}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedTier && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="ticket-qty"
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Quantity
                  </label>
                  <input
                    id="ticket-qty"
                    type="number"
                    min={1}
                    max={maxSelectable}
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      setQuantity(Math.min(maxSelectable, Math.max(1, val)));
                    }}
                    className="w-24 rounded-lg border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#2B2B2B] px-3 py-2 text-sm font-medium text-right text-slate-900 dark:text-white outline-none focus:border-[#29ABE2]"
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Total
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {formatKes(totalKes)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    selectedTier.isActive === false ||
                    getAvailableCount(selectedTier) <= 0
                  }
                  className="btn-coddy w-full text-sm disabled:opacity-50"
                >
                  {submitting
                    ? 'Processing...'
                    : totalKes === 0
                      ? 'Claim Free Ticket'
                      : 'Reserve Tickets (15-Min Hold)'}
                </button>
              </>
            )}

            {bookingError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                {bookingError}
              </div>
            )}

            {createdBooking && (
              <div className="rounded-xl border border-[#29ABE2]/50 bg-[#E0F2FE]/50 dark:bg-[#2B2B2B] p-4 space-y-2 text-xs text-slate-800 dark:text-slate-100">
                <p className="font-bold text-sm text-[#1A8CC4] dark:text-[#29ABE2]">
                  {createdBooking.status === 'CONFIRMED'
                    ? 'Ticket Confirmed'
                    : 'Reservation Held for 15 Minutes'}
                </p>
                <p>
                  Reference:{' '}
                  <span className="font-mono font-semibold">
                    {createdBooking.bookingReference}
                  </span>
                </p>
                <p>
                  {createdBooking.quantity}x {createdBooking.ticketTier.name} /{' '}
                  {formatKes(createdBooking.totalAmountKes)}
                </p>
                {createdBooking.status === 'CONFIRMED' &&
                createdBooking.eTicket ? (
                  <p className="font-mono">
                    E-Ticket Code: {createdBooking.eTicket.ticketCode}
                  </p>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300">
                    Pay directly using your booking reference{' '}
                    <span className="font-mono font-semibold">
                      {createdBooking.bookingReference}
                    </span>{' '}
                    before {formatDateTime(createdBooking.expiresAt)}.
                  </p>
                )}
                <div className="pt-1 flex gap-4">
                  <Link
                    href="/bookings"
                    className="font-semibold text-[#1A8CC4] dark:text-[#29ABE2] underline"
                  >
                    View Bookings
                  </Link>
                  {createdBooking.eTicket && (
                    <Link
                      href="/tickets"
                      className="font-semibold text-[#1A8CC4] dark:text-[#29ABE2] underline"
                    >
                      View E-Tickets
                    </Link>
                  )}
                </div>
              </div>
            )}
          </form>
        )}
      </aside>
    </main>
  );
}