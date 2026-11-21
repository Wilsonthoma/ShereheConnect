'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  bookingsApi,
  type BookingRecord,
  type BookingStatus,
} from '@/lib/bookingsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function getBookingTickets(booking: BookingRecord) {
  if (Array.isArray(booking.eTickets) && booking.eTickets.length > 0) {
    return booking.eTickets;
  }
  return booking.eTicket ? [booking.eTicket] : [];
}

function useCountdown(
  expiresAt: string,
  active: boolean,
  expiredSuffix: string,
): string {
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!active) {
      setRemaining('');
      return;
    }

    function update() {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setRemaining(`00:00${expiredSuffix}`);
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
  }, [expiresAt, active, expiredSuffix]);

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
  const { t, language } = useLanguage();
  const localeTag = language === 'sw' ? 'sw-KE' : 'en-KE';

  const formatKes = (amount: number): string => {
    if (amount === 0) return t('common.free');
    return `KES ${amount.toLocaleString(localeTag)}`;
  };

  const formatDateTime = (iso?: string | null): string => {
    if (!iso) return t('common.tba');
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(localeTag, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatGroupCategoryLabel = (category?: string | null): string => {
    switch (category) {
      case 'FAMILY':
        return t('common.group.family');
      case 'COUPLE':
        return t('common.group.couple');
      case 'FRIENDS':
        return t('common.group.friends');
      case 'TABLE':
        return t('common.group.table');
      default:
        return category ? category : t('common.group.bundle');
    }
  };

  const isPending = booking.status === 'PENDING';
  const countdown = useCountdown(
    booking.expiresAt,
    isPending,
    t('bookings.card.expiredSuffix'),
  );
  const canCancel =
    booking.status === 'PENDING' || booking.status === 'PAYMENT_RECEIVED';
  const tickets = getBookingTickets(booking);
  const isGroup = Boolean(booking.ticketTier.isGroupSubgroup);
  const occupants =
    typeof booking.occupantsCount === 'number' && booking.occupantsCount > 0
      ? booking.occupantsCount
      : isGroup && (booking.ticketTier.occupantsPerUnit ?? 1) > 1
        ? (booking.ticketTier.occupantsPerUnit ?? 1) * booking.quantity
        : booking.quantity;

  const pricingModeLabel =
    booking.ticketTier.pricingMode === 'BUNDLE_FIXED'
      ? t('common.pricing.fixedBundle')
      : t('common.pricing.perOccupant');

  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 space-y-4 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {booking.bookingReference}
            </p>
            {isGroup && (
              <span className="inline-flex items-center rounded-full bg-[#E0F2FE] dark:bg-[#29ABE2]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                {formatGroupCategoryLabel(booking.ticketTier.groupCategory)}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            <Link
              href={`/events/${booking.event.slug}`}
              className="hover:text-[#1A8CC4] dark:hover:text-[#29ABE2] transition-colors"
            >
              {booking.event.title}
            </Link>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {booking.event.venueName}, {booking.event.county} /{' '}
            {formatDateTime(booking.event.startsAt)}
          </p>
        </div>

        <span className="rounded-full border border-[#29ABE2]/40 bg-[#E0F2FE]/70 dark:bg-[#29ABE2]/15 px-3 py-1 text-xs font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm border-t border-slate-200 dark:border-slate-700 pt-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('bookings.card.ticketsAndOccupants')}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {booking.quantity}x {booking.ticketTier.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {t('bookings.card.occupantsSummary', {
              count: occupants,
              label:
                occupants === 1
                  ? t('common.occupant.singular')
                  : t('common.occupant.plural'),
              modePart:
                isGroup && booking.ticketTier.pricingMode
                  ? t('bookings.card.modeSuffix', { mode: pricingModeLabel })
                  : '',
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('bookings.card.totalAmount')}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white">
            {formatKes(booking.totalAmountKes)}
          </p>
          {booking.unitPriceKes > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {t('bookings.card.unitRate', {
                amount: formatKes(booking.unitPriceKes),
              })}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isPending
              ? t('bookings.card.holdRemaining')
              : t('bookings.card.created')}
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
            {t('bookings.card.payHeading')}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            {t('bookings.card.payBody', {
              amount: formatKes(booking.totalAmountKes),
              ref: booking.bookingReference,
            })}
          </p>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="rounded-xl bg-slate-50 dark:bg-[#2B2B2B] border border-slate-200 dark:border-slate-700 p-3 text-xs space-y-1.5">
          <p className="font-semibold text-slate-900 dark:text-white">
            {t('bookings.card.issuedHeading', { count: tickets.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            {tickets.map((ticket, idx) => (
              <span
                key={ticket.id || ticket.ticketCode || idx}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#3A3A3A] border border-slate-200 dark:border-slate-600 px-2.5 py-1 font-mono text-[11px] text-slate-800 dark:text-slate-100"
              >
                <span>{ticket.ticketCode}</span>
                <span className="text-[10px] font-sans font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                  {ticket.status}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4 text-sm">
          {tickets.length > 0 && (
            <Link
              href={`/tickets?bookingId=${encodeURIComponent(booking.id)}`}
              className="font-semibold text-[#1A8CC4] dark:text-[#29ABE2] underline"
            >
              {tickets.length > 1
                ? t('bookings.card.viewAllTickets', { count: tickets.length })
                : t('bookings.card.viewSingleTicket', {
                    code: tickets[0].ticketCode,
                  })}
            </Link>
          )}
        </div>

        {canCancel && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={cancellingId === booking.id}
            disabled={cancellingId === booking.id}
            onClick={() => onCancel(booking.id)}
          >
            {cancellingId === booking.id
              ? t('bookings.card.cancelling')
              : t('bookings.card.cancelButton')}
          </Button>
        )}
      </div>
    </article>
  );
}

export default function BookingsPage() {
  const { t } = useLanguage();
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
      setError(err instanceof Error ? err.message : t('bookings.error.load'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    setError(null);
    try {
      await bookingsApi.cancelBooking(id, {
        reason: t('bookings.card.cancelReason'),
      });
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bookings.error.cancel'));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] transition-colors">
      <div className="container-fluid py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: "'Kaushan Script', cursive" }}
              className="text-3xl sm:text-4xl text-slate-900 dark:text-white"
            >
              {t('bookings.title')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {t('bookings.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="booking-status-filter"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              {t('bookings.filterLabel')}
            </label>
            <select
              id="booking-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#3A3A3A] px-3 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#29ABE2]"
            >
              <option value="">{t('bookings.filter.all')}</option>
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
            {t('bookings.loading')}
          </p>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-8 text-center space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('bookings.empty')}
            </p>
            <Link href="/events" className="inline-block">
              <Button
                variant="primary"
                size="md"
                className="bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-full px-6 py-2.5 text-sm"
              >
                {t('bookings.browseEvents')}
              </Button>
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
      </div>
    </main>
  );
}