'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  bookingsApi,
  type BookingETicket,
  type BookingRecord,
} from '@/lib/bookingsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface TicketPassEntry {
  booking: BookingRecord;
  ticket: BookingETicket;
  passIndex: number;
  totalPassesInBooking: number;
}

function extractTicketsForBooking(booking: BookingRecord): BookingETicket[] {
  if (Array.isArray(booking.eTickets) && booking.eTickets.length > 0) {
    return booking.eTickets;
  }
  return booking.eTicket ? [booking.eTicket] : [];
}

export default function TicketsPage() {
  const { t, language } = useLanguage();
  const localeTag = language === 'sw' ? 'sw-KE' : 'en-KE';

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

  const [bookingsWithTickets, setBookingsWithTickets] = useState<
    BookingRecord[]
  >([]);
  const [selectedTicketCode, setSelectedTicketCode] = useState<string>('');
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
        const issued = list.filter(
          (b) => extractTicketsForBooking(b).length > 0,
        );
        setBookingsWithTickets(issued);

        const searchParams =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
        const preferredBookingId = searchParams?.get('bookingId');

        const preferredBooking = preferredBookingId
          ? issued.find((b) => b.id === preferredBookingId)
          : undefined;
        const initialTicket = extractTicketsForBooking(
          preferredBooking ?? issued[0] ?? ({} as BookingRecord),
        )[0];

        if (initialTicket?.ticketCode) {
          setSelectedTicketCode(initialTicket.ticketCode);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t('tickets.error.load'));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTickets();
    return () => {
      active = false;
    };
  }, [t]);

  const allPasses = useMemo<TicketPassEntry[]>(() => {
    const entries: TicketPassEntry[] = [];
    for (const booking of bookingsWithTickets) {
      const tickets = extractTicketsForBooking(booking);
      tickets.forEach((ticket, idx) => {
        entries.push({
          booking,
          ticket,
          passIndex: ticket.ticketIndex ?? idx + 1,
          totalPassesInBooking: tickets.length,
        });
      });
    }
    return entries;
  }, [bookingsWithTickets]);

  const selectedEntry = useMemo<TicketPassEntry | null>(() => {
    if (allPasses.length === 0) return null;
    return (
      allPasses.find((p) => p.ticket.ticketCode === selectedTicketCode) ??
      allPasses[0]
    );
  }, [allPasses, selectedTicketCode]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] transition-colors">
      <div className="container-fluid py-8 space-y-6">
        <div>
          <h1
            style={{ fontFamily: "'Kaushan Script', cursive" }}
            className="text-3xl sm:text-4xl text-slate-900 dark:text-white"
          >
            {t('tickets.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t('tickets.subtitle')}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('tickets.loading')}
          </p>
        ) : allPasses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-8 text-center space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('tickets.empty')}
            </p>
            <Link href="/bookings" className="btn-coddy inline-block text-sm">
              {t('tickets.goToBookings')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-4">
              {allPasses.map(
                ({ booking, ticket, passIndex, totalPassesInBooking }) => {
                  const isSelected =
                    selectedEntry?.ticket.ticketCode === ticket.ticketCode;
                  const isGroup = Boolean(booking.ticketTier.isGroupSubgroup);
                  const occupants =
                    typeof booking.occupantsCount === 'number' &&
                    booking.occupantsCount > 0
                      ? booking.occupantsCount
                      : booking.quantity;

                  return (
                    <article
                      key={ticket.id || ticket.ticketCode}
                      onClick={() => setSelectedTicketCode(ticket.ticketCode)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all space-y-3 ${
                        isSelected
                          ? 'border-[#29ABE2] bg-[#E0F2FE]/60 dark:bg-[#29ABE2]/15'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                              {ticket.ticketCode} /{' '}
                              {t('tickets.refPrefix', {
                                ref: booking.bookingReference,
                              })}
                            </p>
                            {totalPassesInBooking > 1 && (
                              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-[#2B2B2B] px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                {t('tickets.passBadge', {
                                  index: passIndex,
                                  total: totalPassesInBooking,
                                })}
                              </span>
                            )}
                            {isGroup && (
                              <span className="inline-flex items-center rounded-full bg-[#E0F2FE] dark:bg-[#29ABE2]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                                {formatGroupCategoryLabel(
                                  booking.ticketTier.groupCategory,
                                )}
                              </span>
                            )}
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {booking.event.title}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-300">
                            {booking.event.venueName}, {booking.event.county} /{' '}
                            {formatDateTime(booking.event.startsAt)}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#29ABE2]/40 bg-white dark:bg-[#2B2B2B] px-3 py-1 text-xs font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                          {ticket.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          {t('tickets.meta.tier')}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {booking.ticketTier.name}
                          </strong>
                        </span>
                        <span>
                          {t('tickets.meta.units')}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {booking.quantity}
                          </strong>
                        </span>
                        <span>
                          {t('tickets.meta.occupants')}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {occupants}
                          </strong>
                        </span>
                        {ticket.guestName && (
                          <span>
                            {t('tickets.meta.guest')}{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {ticket.guestName}
                            </strong>
                          </span>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </section>

            <aside className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 h-fit space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('tickets.aside.heading')}
              </h2>
              {selectedEntry ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t('tickets.aside.event')}
                    </p>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {selectedEntry.booking.event.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t('tickets.aside.refAndTier')}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {selectedEntry.booking.bookingReference} ·{' '}
                      {selectedEntry.booking.ticketTier.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t('tickets.aside.ticketCode')}
                    </p>
                    <p className="font-mono font-semibold text-sm text-[#1A8CC4] dark:text-[#29ABE2]">
                      {selectedEntry.ticket.ticketCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t('tickets.aside.qrToken')}
                    </p>
                    <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] p-3 font-mono text-slate-800 dark:text-slate-100 break-all select-all">
                      {selectedEntry.ticket.qrToken}
                    </div>
                  </div>
                  {(selectedEntry.ticket.checkedInAt ||
                    selectedEntry.ticket.scannedAt) && (
                    <p className="text-slate-600 dark:text-slate-300">
                      {t('tickets.aside.checkedInAt')}{' '}
                      <span className="font-mono font-semibold">
                        {formatDateTime(
                          selectedEntry.ticket.checkedInAt ??
                            selectedEntry.ticket.scannedAt,
                        )}
                      </span>
                    </p>
                  )}
                  <p className="text-slate-500 dark:text-slate-400">
                    {t('tickets.aside.singleAdmissionNote')}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('tickets.aside.selectPrompt')}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}