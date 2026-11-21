'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';
import type { GroupCategory, GroupPricingMode } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface EventTicketTier {
  id: string;
  name: string;
  description?: string | null;
  priceKes: number;
  quantityTotal: number;
  quantitySold: number;
  quantityReserved: number;
  isGroupSubgroup?: boolean;
  groupCategory?: GroupCategory | string | null;
  occupantsPerUnit?: number;
  pricingMode?: GroupPricingMode | string;
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
  maxAttendees?: number | null;
  totalTicketsAvailable?: number | null;
  allowGroupBookings?: boolean;
  ticketTiers?: EventTicketTier[];
  organizer?: {
    id?: string;
    businessName?: string | null;
  } | null;
}

type AttendanceMode = 'INDIVIDUAL' | 'GROUP';

const ACTIVE_BOOKING_STATUSES = new Set([
  'PENDING',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CHECKED_IN',
]);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:3001';

function getAvailableCount(tier: EventTicketTier): number {
  return Math.max(
    0,
    tier.quantityTotal - tier.quantitySold - tier.quantityReserved,
  );
}

function getOccupantsPerUnit(tier: EventTicketTier): number {
  if (typeof tier.occupantsPerUnit === 'number' && tier.occupantsPerUnit > 0) {
    return tier.occupantsPerUnit;
  }
  if (tier.groupCategory === 'COUPLE') return 2;
  if (tier.groupCategory === 'TABLE') return 6;
  return 1;
}

function getEffectivePricingMode(tier: EventTicketTier): GroupPricingMode {
  return tier.pricingMode === 'PER_OCCUPANT' ? 'PER_OCCUPANT' : 'BUNDLE_FIXED';
}

function calculateTierSubtotalKes(
  tier: EventTicketTier,
  quantity: number,
): number {
  const safeQty = Math.max(1, quantity);
  const mode = getEffectivePricingMode(tier);
  const occupants = getOccupantsPerUnit(tier);
  if (tier.isGroupSubgroup && mode === 'PER_OCCUPANT') {
    return tier.priceKes * occupants * safeQty;
  }
  return tier.priceKes * safeQty;
}

function pickInitialTierId(list: EventTicketTier[]): string {
  const firstAvailable =
    list.find((item) => item.isActive !== false && getAvailableCount(item) > 0) ??
    list[0];
  return firstAvailable ? firstAvailable.id : '';
}

function isDuplicateBookingError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already booked') ||
    normalized.includes('duplicate') ||
    normalized.includes('active booking') ||
    normalized.includes('one booking per event') ||
    normalized.includes('already have a booking')
  );
}

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? '';
  const { t, language } = useLanguage();

  const isSw = language === 'sw';
  const localeTag = isSw ? 'sw-KE' : 'en-KE';

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(localeTag),
    [localeTag],
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [localeTag],
  );

  const formatKes = useCallback(
    (amount: number): string => {
      if (amount === 0) return t('common.free');
      return `KES ${numberFormatter.format(amount)}`;
    },
    [numberFormatter, t],
  );

  const formatDateTime = useCallback(
    (iso?: string | null): string => {
      if (!iso) return t('common.tba');
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return iso;
      return dateTimeFormatter.format(date);
    },
    [dateTimeFormatter, t],
  );

  const formatGroupCategoryLabel = useCallback(
    (category?: string | null): string => {
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
    },
    [t],
  );

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [existingBooking, setExistingBooking] = useState<BookingRecord | null>(
    null,
  );

  const [attendanceMode, setAttendanceMode] =
    useState<AttendanceMode>('INDIVIDUAL');
  const [selectedSubgroupFilter, setSelectedSubgroupFilter] =
    useState<string>('ALL');
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const tiers = useMemo(() => event?.ticketTiers ?? [], [event]);

  const individualTiers = useMemo(
    () => tiers.filter((tier) => !tier.isGroupSubgroup),
    [tiers],
  );

  const groupTiers = useMemo(
    () => tiers.filter((tier) => Boolean(tier.isGroupSubgroup)),
    [tiers],
  );

  const availableSubgroups = useMemo(() => {
    const categories = new Set<string>();
    for (const tier of groupTiers) {
      if (tier.groupCategory) {
        categories.add(String(tier.groupCategory).toUpperCase());
      }
    }
    return ['ALL', ...Array.from(categories)];
  }, [groupTiers]);

  const visibleTiers = useMemo(() => {
    if (attendanceMode === 'GROUP') {
      if (selectedSubgroupFilter === 'ALL') return groupTiers;
      return groupTiers.filter(
        (tier) =>
          String(tier.groupCategory || '').toUpperCase() ===
          selectedSubgroupFilter,
      );
    }
    return individualTiers;
  }, [attendanceMode, selectedSubgroupFilter, groupTiers, individualTiers]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    const controller = new AbortController();

    async function loadEvent() {
      setLoading(true);
      setError(null);
      setExistingBooking(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/events/${encodeURIComponent(slug)}`,
          {
            credentials: 'include',
            signal: controller.signal,
          },
        );
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;

        if (!res.ok) {
          throw new Error(
            data?.message || t('evt.detail.fetchFailed', { status: res.status }),
          );
        }

        if (!active) return;
        const loadedEvent: EventDetail = data?.event ?? data;
        setEvent(loadedEvent);

        const loadedTiers = loadedEvent.ticketTiers ?? [];
        const soloTiers = loadedTiers.filter((item) => !item.isGroupSubgroup);
        const grpTiers = loadedTiers.filter((item) =>
          Boolean(item.isGroupSubgroup),
        );

        const initialMode: AttendanceMode =
          soloTiers.length > 0
            ? 'INDIVIDUAL'
            : grpTiers.length > 0
              ? 'GROUP'
              : 'INDIVIDUAL';
        setAttendanceMode(initialMode);
        setSelectedSubgroupFilter('ALL');

        const pool = initialMode === 'GROUP' ? grpTiers : soloTiers;
        setSelectedTierId(pickInitialTierId(pool));

        // Check if the authenticated user already has an active booking on this event
        const token = getToken();
        if (token && loadedEvent?.id) {
          try {
            const myBookingsRes = await bookingsApi.listMyBookings?.();
            const list: BookingRecord[] = Array.isArray(myBookingsRes)
              ? myBookingsRes
              : Array.isArray((myBookingsRes as { items?: BookingRecord[] })?.items)
                ? (myBookingsRes as { items: BookingRecord[] }).items
                : [];
            if (active) {
              const activeMatch = list.find(
                (b) =>
                  b.event?.id === loadedEvent.id &&
                  ACTIVE_BOOKING_STATUSES.has(String(b.status).toUpperCase()),
              );
              if (activeMatch) {
                setExistingBooking(activeMatch);
              }
            }
          } catch {
            // Non-blocking check; backend enforces duplicate prevention too
          }
        }
      } catch (err) {
        if (!active || (err as Error)?.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : t('evt.detail.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEvent();
    return () => {
      active = false;
      controller.abort();
    };
  }, [slug, t]);

  function handleSelectAttendanceMode(mode: AttendanceMode) {
    setAttendanceMode(mode);
    setSelectedSubgroupFilter('ALL');
    const pool = mode === 'GROUP' ? groupTiers : individualTiers;
    setSelectedTierId(pickInitialTierId(pool));
    setQuantity(1);
    setBookingError(null);
  }

  function handleSelectSubgroupFilter(subgroup: string) {
    setSelectedSubgroupFilter(subgroup);
    const filtered =
      subgroup === 'ALL'
        ? groupTiers
        : groupTiers.filter(
            (tier) =>
              String(tier.groupCategory || '').toUpperCase() === subgroup,
          );
    setSelectedTierId(pickInitialTierId(filtered));
    setQuantity(1);
    setBookingError(null);
  }

  const selectedTier = useMemo(
    () => visibleTiers.find((item) => item.id === selectedTierId) ?? null,
    [visibleTiers, selectedTierId],
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

  const estimatedOccupants = useMemo(() => {
    if (!selectedTier) return quantity;
    return selectedTier.isGroupSubgroup
      ? getOccupantsPerUnit(selectedTier) * quantity
      : quantity;
  }, [selectedTier, quantity]);

  const totalKes = useMemo(() => {
    if (!selectedTier) return 0;
    return calculateTierSubtotalKes(selectedTier, quantity);
  }, [selectedTier, quantity]);

  async function handleBookTickets(e: React.FormEvent) {
    e.preventDefault();
    if (!event || !selectedTier) return;

    if (existingBooking) {
      setBookingError(
        isSw
          ? `Tayari una nafasi hai (${existingBooking.bookingReference}) ya tukio hili. Nafasi moja tu inaruhusiwa kwa kila tukio.`
          : `You already have an active booking (${existingBooking.bookingReference}) for this event. Only one active booking is allowed per event.`,
      );
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const booking: BookingRecord = await bookingsApi.createBooking({
        eventId: event.id,
        ticketTierId: selectedTier.id,
        quantity,
      });

      if (booking.status === 'CONFIRMED' && totalKes === 0) {
        router.push(`/tickets?bookingId=${encodeURIComponent(booking.id)}`);
        return;
      }

      router.push(`/bookings/${encodeURIComponent(booking.id)}/pay`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('evt.detail.createFailed');
      if (
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('401')
      ) {
        router.push(`/login?next=${encodeURIComponent(`/events/${slug}`)}`);
        return;
      }
      if (isDuplicateBookingError(message)) {
        setBookingError(
          isSw
            ? 'Tayari una nafasi hai ya tukio hili. Huwezi kuweka nafasi mbili kwa tukio moja.'
            : 'You already have an active booking for this event. Duplicate bookings on the same event are not allowed.',
        );
      } else {
        setBookingError(message);
      }
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-10 transition-colors">
        <div className="container-fluid">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('evt.detail.loading')}
          </p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-10 space-y-4 transition-colors">
        <div className="container-fluid space-y-4">
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            {error || t('evt.notFound')}
          </div>
          <Link
            href="/events"
            className="inline-block text-sm font-semibold text-[#29ABE2] hover:text-[#1A8CC4]"
          >
            {t('evt.browse')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] transition-colors">
      <div className="container-fluid py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          {event.coverImageUrl && (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              loading="eager"
              decoding="async"
              className="w-full h-72 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
            />
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A8CC4] dark:text-[#29ABE2]">
                {event.county || t('common.kenya')}
                {event.venueName ? ` / ${event.venueName}` : ''}
              </p>
              {event.allowGroupBookings && groupTiers.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-[#E0F2FE] dark:bg-[#29ABE2]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                  {t('evt.detail.groupEnabled')}
                </span>
              )}
              {typeof event.totalTicketsAvailable === 'number' &&
                event.totalTicketsAvailable > 0 && (
                  <span className="inline-flex items-center rounded-full bg-slate-200/80 dark:bg-[#3A3A3A] px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {t('evt.detail.capacityPool', {
                      count: numberFormatter.format(event.totalTicketsAvailable),
                    })}
                  </span>
                )}
            </div>

            <h1
              style={{ fontFamily: "'Kaushan Script', cursive" }}
              className="text-3xl sm:text-4xl text-slate-900 dark:text-white"
            >
              {event.title}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('evt.detail.starts', { date: formatDateTime(event.startsAt) })}
              {event.endsAt
                ? ` / ${t('evt.detail.ends', { date: formatDateTime(event.endsAt) })}`
                : ''}
            </p>
            {event.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('evt.detail.venueAddress', { address: event.address })}
              </p>
            )}
            {event.organizer?.businessName && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('evt.detail.organizer', {
                  name: event.organizer.businessName,
                })}
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
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('evt.detail.selectHeading')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isSw
                ? 'Chagua kwanza jinsi utakavyohudhuria (Binafsi au Kikundi), kisha chagua kifurushi na idadi.'
                : 'First choose how you want to attend (Individual or Group), then pick a subgroup and quantity.'}
            </p>
          </div>

          {existingBooking && (
            <div className="rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-semibold">
                {isSw
                  ? `Tayari una nafasi hai (${existingBooking.bookingReference}) kwa tukio hili.`
                  : `You already have an active booking (${existingBooking.bookingReference}) for this event.`}
              </p>
              <p className="text-[11px] opacity-90">
                {isSw
                  ? 'Nafasi moja tu ya tukio hili inaruhusiwa kwa kila akaunti.'
                  : 'Only one active booking per event is allowed per account.'}
              </p>
              <Link
                href="/tickets"
                className="inline-block font-bold underline text-[#1A8CC4] dark:text-[#29ABE2]"
              >
                {isSw ? 'Angalia tiketi zako' : 'View your tickets'}
              </Link>
            </div>
          )}

          {tiers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('evt.detail.noTiers')}
            </p>
          ) : (
            <form onSubmit={handleBookTickets} className="space-y-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {isSw ? 'Jinsi ya Kuhudhuria' : 'How Are You Attending?'}
                </span>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-[#2B2B2B] p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    disabled={individualTiers.length === 0}
                    onClick={() => handleSelectAttendanceMode('INDIVIDUAL')}
                    className={`rounded-lg py-2 px-3 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      attendanceMode === 'INDIVIDUAL'
                        ? 'bg-white dark:bg-[#3A3A3A] text-[#1A8CC4] dark:text-[#29ABE2] shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isSw
                      ? `Binafsi (${individualTiers.length})`
                      : `Individual (${individualTiers.length})`}
                  </button>
                  <button
                    type="button"
                    disabled={groupTiers.length === 0}
                    onClick={() => handleSelectAttendanceMode('GROUP')}
                    className={`rounded-lg py-2 px-3 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      attendanceMode === 'GROUP'
                        ? 'bg-white dark:bg-[#3A3A3A] text-[#1A8CC4] dark:text-[#29ABE2] shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isSw
                      ? `Kikundi (${groupTiers.length})`
                      : `Group (${groupTiers.length})`}
                  </button>
                </div>
              </div>

              {attendanceMode === 'GROUP' && availableSubgroups.length > 2 && (
                <div className="space-y-1">
                  <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {isSw ? 'Chuja Kundi' : 'Filter Group Subgroup'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSubgroups.map((subgroup) => (
                      <button
                        key={subgroup}
                        type="button"
                        onClick={() => handleSelectSubgroupFilter(subgroup)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                          selectedSubgroupFilter === subgroup
                            ? 'border-[#29ABE2] bg-[#E0F2FE] dark:bg-[#29ABE2]/20 text-[#1A8CC4] dark:text-[#29ABE2]'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B2B2B] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {subgroup === 'ALL'
                          ? isSw
                            ? 'Yote'
                            : 'All Subgroups'
                          : formatGroupCategoryLabel(subgroup)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {visibleTiers.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isSw
                      ? 'Hakuna vifurushi katika chaguo hili kwa sasa.'
                      : 'No tiers available under this selection.'}
                  </p>
                ) : (
                  visibleTiers.map((tier) => {
                    const available = getAvailableCount(tier);
                    const disabled = tier.isActive === false || available <= 0;
                    const isSelected = tier.id === selectedTier?.id;
                    const occupantsPerUnit = getOccupantsPerUnit(tier);
                    const pricingMode = getEffectivePricingMode(tier);
                    const samplePrice = calculateTierSubtotalKes(tier, 1);

                    return (
                      <button
                        key={tier.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setSelectedTierId(tier.id);
                          setBookingError(null);
                        }}
                        className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-[#29ABE2] bg-[#E0F2FE]/70 dark:bg-[#29ABE2]/15'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2B2B2B]'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                              {tier.name}
                            </span>
                            {tier.isGroupSubgroup && (
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-[#E0F2FE] dark:bg-[#29ABE2]/20 px-2 py-0.5 text-[11px] font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                                  {formatGroupCategoryLabel(tier.groupCategory)}
                                </span>
                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-[#3A3A3A] px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                                  {t('evt.detail.occupantsPerUnit', {
                                    count: occupantsPerUnit,
                                    label:
                                      occupantsPerUnit === 1
                                        ? t('common.occupant.singular')
                                        : t('common.occupant.plural'),
                                  })}
                                </span>
                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-[#3A3A3A] px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                  {pricingMode === 'BUNDLE_FIXED'
                                    ? t('common.pricing.fixedBundle')
                                    : t('common.pricing.perOccupant')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-sm text-[#1A8CC4] dark:text-[#29ABE2] block">
                              {formatKes(samplePrice)}
                            </span>
                            {tier.isGroupSubgroup &&
                              pricingMode === 'PER_OCCUPANT' &&
                              tier.priceKes > 0 && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {t('evt.detail.perOccupantRate', {
                                    amount: formatKes(tier.priceKes),
                                  })}
                                </span>
                              )}
                          </div>
                        </div>

                        {tier.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
                            {tier.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                          {available > 0
                            ? t('evt.detail.remainingUnits', {
                                count: available,
                                unitLabel: tier.isGroupSubgroup
                                  ? available === 1
                                    ? t('common.unit.singular')
                                    : t('common.unit.plural')
                                  : available === 1
                                    ? t('common.ticket.singular')
                                    : t('common.ticket.plural'),
                              })
                            : t('evt.detail.soldOut')}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedTier && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor="ticket-qty"
                        className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {selectedTier.isGroupSubgroup
                          ? t('evt.detail.groupUnitsLabel')
                          : t('evt.detail.ticketQtyLabel')}
                      </label>
                      <input
                        id="ticket-qty"
                        type="number"
                        min={1}
                        max={maxSelectable}
                        value={quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setQuantity(
                            Math.min(maxSelectable, Math.max(1, val)),
                          );
                        }}
                        className="w-24 rounded-lg border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-[#2B2B2B] px-3 py-2 text-sm font-medium text-right text-slate-900 dark:text-white outline-none focus:border-[#29ABE2]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedTier.isGroupSubgroup
                        ? t('evt.detail.groupQtyHelper', {
                            perUnit: getOccupantsPerUnit(selectedTier),
                            qty: quantity,
                            total: estimatedOccupants,
                          })
                        : t('evt.detail.standardQtyHelper', {
                            max: maxSelectable,
                          })}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5">
                    {selectedTier.isGroupSubgroup && (
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>{t('evt.detail.estOccupants')}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {estimatedOccupants}{' '}
                          {estimatedOccupants === 1
                            ? t('common.occupant.singular')
                            : t('common.occupant.plural')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {t('evt.detail.totalAmount')}
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {formatKes(totalKes)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      Boolean(existingBooking) ||
                      selectedTier.isActive === false ||
                      getAvailableCount(selectedTier) <= 0
                    }
                    className="btn-coddy w-full text-sm disabled:opacity-50"
                  >
                    {existingBooking
                      ? isSw
                        ? 'Tayari Umeweka Nafasi'
                        : 'Already Booked'
                      : submitting
                        ? t('evt.detail.processing')
                        : totalKes === 0
                          ? t('evt.detail.claimFree')
                          : t('evt.detail.reserveHold')}
                  </button>
                </>
              )}

              {bookingError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                  {bookingError}
                </div>
              )}
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}