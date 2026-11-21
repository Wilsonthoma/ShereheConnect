'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';
import { getToken } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FullPageLoader } from '@/components/ui';
import {
  ACTIVE_BOOKING_STATUSES,
  API_BASE_URL,
  calculateTierSubtotalKes,
  getAvailableCount,
  getEffectivePricingMode,
  getOccupantsPerUnit,
  isDuplicateBookingError,
  pickInitialTierId,
  resolveLabel,
  type AttendanceMode,
  type EventDetail,
  type OverviewTab,
  type SubgroupOption,
  type TranslateFn,
} from '@/lib/eventDetailHelpers';

const EventOverviewSection = dynamic(
  () => import('@/components/events/EventOverviewSection'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 h-44 animate-pulse" />
    ),
  },
);

const TicketBookingPanel = dynamic(
  () => import('@/components/events/TicketBookingPanel'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 h-80 animate-pulse" />
    ),
  },
);

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug ?? '';
  const { t, language } = useLanguage();

  const isSw = language === 'sw';
  const localeTag = isSw ? 'sw-KE' : 'en-KE';

  const tr = useCallback<TranslateFn>(
    (key, interpParams) => resolveLabel(t, isSw, key, interpParams),
    [t, isSw],
  );

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
      if (amount === 0) return tr('common.free');
      return `KES ${numberFormatter.format(amount)}`;
    },
    [numberFormatter, tr],
  );

  const formatDateTime = useCallback(
    (iso?: string | null): string => {
      if (!iso) return tr('common.tba');
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return iso;
      return dateTimeFormatter.format(date);
    },
    [dateTimeFormatter, tr],
  );

  const formatGroupCategoryLabel = useCallback(
    (category?: string | null): string => {
      switch (category) {
        case 'FAMILY':
          return tr('common.group.family');
        case 'COUPLE':
          return tr('common.group.couple');
        case 'FRIENDS':
          return tr('common.group.friends');
        case 'TABLE':
          return tr('common.group.table');
        default:
          return category ? category : tr('common.group.bundle');
      }
    },
    [tr],
  );

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOverviewTab, setActiveOverviewTab] =
    useState<OverviewTab>('OVERVIEW');
  const [existingBooking, setExistingBooking] = useState<BookingRecord | null>(
    null,
  );

  const [attendanceMode, setAttendanceMode] =
    useState<AttendanceMode>('INDIVIDUAL');
  const [selectedSubgroupKey, setSelectedSubgroupKey] = useState<string>('');
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

  const subgroupOptions = useMemo<SubgroupOption[]>(() => {
    return groupTiers.map((tier) => {
      const categoryLabel = tier.groupCategory
        ? formatGroupCategoryLabel(String(tier.groupCategory).toUpperCase())
        : tier.name;
      const label =
        tier.groupCategory && tier.name && tier.name !== categoryLabel
          ? `${categoryLabel} - ${tier.name}`
          : categoryLabel;

      return {
        key: tier.id,
        label,
        tierId: tier.id,
        category: tier.groupCategory,
        occupantsPerUnit: getOccupantsPerUnit(tier),
        pricingMode: getEffectivePricingMode(tier),
        priceKes: tier.priceKes,
        availableCount: getAvailableCount(tier),
        isActive: tier.isActive !== false,
      };
    });
  }, [groupTiers, formatGroupCategoryLabel]);

  const visibleTiers = useMemo(() => {
    if (attendanceMode === 'GROUP') {
      if (!selectedSubgroupKey) return groupTiers;
      return groupTiers.filter((tier) => tier.id === selectedSubgroupKey);
    }
    return individualTiers;
  }, [attendanceMode, selectedSubgroupKey, groupTiers, individualTiers]);

  const applyModeSelection = useCallback(
    (
      mode: AttendanceMode,
      preferredSubgroupKey = '',
      soloPool = individualTiers,
      subgroupsPool = subgroupOptions,
    ) => {
      setAttendanceMode(mode);
      setQuantity(1);
      setBookingError(null);

      if (mode === 'GROUP') {
        const activeSubgroup =
          subgroupsPool.find(
            (opt) =>
              opt.key === preferredSubgroupKey &&
              opt.isActive &&
              opt.availableCount > 0,
          ) ??
          subgroupsPool.find((opt) => opt.isActive && opt.availableCount > 0) ??
          subgroupsPool[0];

        if (activeSubgroup) {
          setSelectedSubgroupKey(activeSubgroup.key);
          setSelectedTierId(activeSubgroup.tierId);
        } else {
          setSelectedSubgroupKey('');
          setSelectedTierId('');
        }
      } else {
        setSelectedTierId(pickInitialTierId(soloPool));
      }
    },
    [individualTiers, subgroupOptions],
  );

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
            data?.message || tr('evt.detail.fetchFailed', { status: res.status }),
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

        setAttendanceMode('INDIVIDUAL');
        setSelectedSubgroupKey(pickInitialTierId(grpTiers));
        setSelectedTierId(pickInitialTierId(soloTiers));

        const token = getToken();
        if (token && loadedEvent?.id) {
          try {
            const myBookingsRes = await bookingsApi.listMyBookings?.();
            const list: BookingRecord[] = Array.isArray(myBookingsRes)
              ? myBookingsRes
              : Array.isArray(
                    (myBookingsRes as { items?: BookingRecord[] })?.items,
                  )
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
        setError(err instanceof Error ? err.message : tr('evt.detail.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEvent();
    return () => {
      active = false;
      controller.abort();
    };
  }, [slug, tr]);

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

  async function handleBookTickets(e: FormEvent) {
    e.preventDefault();
    if (!event || !selectedTier) return;

    if (existingBooking) {
      setBookingError(
        tr('evt.detail.existingBookingNotice', {
          ref: existingBooking.bookingReference,
        }),
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
        err instanceof Error ? err.message : tr('evt.detail.createFailed');
      if (
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('401')
      ) {
        router.push(`/login?next=${encodeURIComponent(`/events/${slug}`)}`);
        return;
      }
      setBookingError(
        isDuplicateBookingError(message)
          ? tr('evt.detail.duplicateBookingError')
          : message,
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return <FullPageLoader message={tr('evt.detail.loading')} />;
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-10 space-y-4 transition-colors">
        <div className="container-fluid space-y-4">
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-normal text-red-600 dark:text-red-400">
            {error || tr('evt.notFound')}
          </div>
          <Link
            href="/events"
            className="inline-block text-sm font-normal text-[#29ABE2] hover:text-[#1A8CC4]"
          >
            {tr('evt.browse')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] transition-colors">
      <div className="container-fluid py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 w-full space-y-6">
          {event.coverImageUrl && (
            <div className="max-w-xl mx-auto overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A]">
              <img
                src={event.coverImageUrl}
                alt={event.title}
                loading="eager"
                decoding="async"
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}

          <EventOverviewSection
            event={event}
            activeTab={activeOverviewTab}
            onSelectTab={setActiveOverviewTab}
            tr={tr}
            formatDateTime={formatDateTime}
          />
        </section>

        <TicketBookingPanel
          tiers={tiers}
          individualTiers={individualTiers}
          groupTiers={groupTiers}
          subgroupOptions={subgroupOptions}
          selectedSubgroupKey={selectedSubgroupKey}
          visibleTiers={visibleTiers}
          attendanceMode={attendanceMode}
          selectedTier={selectedTier}
          quantity={quantity}
          maxSelectable={maxSelectable}
          estimatedOccupants={estimatedOccupants}
          totalKes={totalKes}
          existingBooking={existingBooking}
          submitting={submitting}
          bookingError={bookingError}
          tr={tr}
          formatKes={formatKes}
          formatGroupCategoryLabel={formatGroupCategoryLabel}
          onSelectAttendanceMode={(mode) => applyModeSelection(mode)}
          onSelectSingleSubgroup={(opt) => applyModeSelection('GROUP', opt.key)}
          onSelectTierId={setSelectedTierId}
          onChangeQuantity={setQuantity}
          onClearBookingError={() => setBookingError(null)}
          onSubmit={handleBookTickets}
        />
      </div>
    </main>
  );
}