'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, ChevronDown, Users, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { publicEventsApi, type EventItem } from '@/lib/eventsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const CATEGORIES = [
  { code: 'FESTIVAL', labelKey: 'events.cat.festival' as const },
  { code: 'CONFERENCE', labelKey: 'events.cat.conference' as const },
  { code: 'ENTERTAINMENT', labelKey: 'events.cat.entertainment' as const },
  { code: 'SPORTS', labelKey: 'events.cat.sports' as const },
  { code: 'ARTS', labelKey: 'events.cat.arts' as const },
  { code: 'COMMUNITY', labelKey: 'events.cat.community' as const },
  { code: 'EDUCATION', labelKey: 'events.cat.education' as const },
  { code: 'BUSINESS', labelKey: 'events.cat.business' as const },
];

const COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Kakamega',
  'Nyeri',
  'Meru',
  'Machakos',
  'Kisii',
];

const HERO_VIDEO_SOURCES = [
  'https://videos.pexels.com/video-files/2022395/2022395-hd_1280_720_30fps.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-crowd-dancing-at-a-concert-with-lights-42937-large.mp4',
];

const HERO_VIDEO_POSTER =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80';

function getTierUnitPrice(
  tier: NonNullable<EventItem['ticketTiers']>[number],
): number {
  const occupants =
    typeof tier.occupantsPerUnit === 'number' && tier.occupantsPerUnit > 0
      ? tier.occupantsPerUnit
      : tier.groupCategory === 'COUPLE'
        ? 2
        : 1;
  if (tier.isGroupSubgroup && tier.pricingMode === 'PER_OCCUPANT') {
    return tier.priceKes * occupants;
  }
  return tier.priceKes;
}

function AmbientHeroVideoImpl() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const promise = el.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {});
    }
  }, [srcIndex]);

  const handleError = () => {
    setSrcIndex((prev) =>
      prev + 1 < HERO_VIDEO_SOURCES.length ? prev + 1 : prev,
    );
  };

  return (
    <div className="relative h-60 sm:h-72 md:h-80 w-full overflow-hidden">
      <video
        ref={videoRef}
        key={HERO_VIDEO_SOURCES[srcIndex]}
        src={HERO_VIDEO_SOURCES[srcIndex]}
        poster={HERO_VIDEO_POSTER}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onCanPlay={() => {
          videoRef.current?.play().catch(() => {});
        }}
        onError={handleError}
        className="w-full h-full object-cover scale-[1.03] opacity-85 dark:opacity-75"
      />

      {/* Seamless horizontal & vertical edge fades blending into right content & page surface */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/35 to-slate-50 dark:from-transparent dark:via-[#2B2B2B]/45 dark:to-[#2B2B2B]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50/70 dark:from-[#2B2B2B] dark:via-transparent dark:to-[#2B2B2B]/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-slate-50/80 to-transparent dark:from-[#2B2B2B]/80"
      />
    </div>
  );
}

const AmbientHeroVideo = dynamic(() => Promise.resolve(AmbientHeroVideoImpl), {
  ssr: false,
  loading: () => (
    <div className="h-60 sm:h-72 md:h-80 w-full rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
  ),
});

export default function EventsPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  const { t } = useLanguage();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory,
  );
  const [county, setCounty] = useState('');

  useEffect(() => {
    let active = true;

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicEventsApi.list({
          q: search.trim() || undefined,
          categoryId: selectedCategory || undefined,
          county: county || undefined,
          limit: 50,
        });
        if (!active) return;
        setEvents(res.items);
        setTotal(res.total);
      } catch (err: unknown) {
        if (!active || (err as Error)?.name === 'AbortError') return;
        const message =
          err instanceof Error ? err.message : t('events.loading');
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [search, selectedCategory, county, t]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setCounty('');
    setSearch('');
  };

  const hasFilters = Boolean(selectedCategory || county || search.trim());

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] transition-colors">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E0F2FE]/60 via-slate-50 to-slate-50 dark:from-[#1E293B]/75 dark:via-[#2B2B2B] dark:to-[#2B2B2B] py-10 md:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#29ABE2]/10 via-transparent to-[#1A8CC4]/10"
        />

        <div className="container-fluid max-w-7xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <AmbientHeroVideo />
            </div>

            <div className="lg:col-span-6 space-y-5 text-left relative z-10">
              <div className="space-y-2">
                <h1
                  style={{ fontFamily: "'Kaushan Script', cursive" }}
                  className="text-4xl sm:text-5xl text-slate-900 dark:text-white leading-tight"
                >
                  {t('events.hero.title')}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  {t('events.hero.subtitle')}
                </p>
              </div>

              <div className="max-w-xl">
                <label htmlFor="events-search-input" className="sr-only">
                  {t('events.search.placeholder')}
                </label>
                <div className="flex items-center gap-3 bg-white dark:bg-[#3A3A3A] rounded-full shadow-2xl px-5 py-3 border border-transparent dark:border-slate-700 focus-within:border-[#29ABE2] transition-colors">
                  <Search className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
                  <input
                    id="events-search-input"
                    type="text"
                    placeholder={t('events.search.placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 min-w-0"
                  />
                  {search && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      className="rounded-full p-1.5 h-auto min-w-0 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container-fluid max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <label htmlFor="events-category-filter" className="sr-only">
                  {t('events.filter.allCategories')}
                </label>
                <select
                  id="events-category-filter"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-white dark:bg-[#3A3A3A] border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 font-medium cursor-pointer hover:border-[#29ABE2]/60 focus:border-[#29ABE2] focus:outline-none transition-colors"
                >
                  <option value="">{t('events.filter.allCategories')}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {t(cat.labelKey)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <label htmlFor="events-county-filter" className="sr-only">
                  {t('events.filter.allCounties')}
                </label>
                <select
                  id="events-county-filter"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="appearance-none pl-9 pr-10 py-2.5 rounded-lg bg-white dark:bg-[#3A3A3A] border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 font-medium cursor-pointer hover:border-[#29ABE2]/60 focus:border-[#29ABE2] focus:outline-none transition-colors"
                >
                  <option value="">{t('events.filter.allCounties')}</option>
                  {COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-sm text-slate-500 dark:text-slate-300 hover:text-[#1A8CC4] dark:hover:text-[#29ABE2] font-medium px-2 h-auto"
                >
                  {t('events.filter.clear')}
                </Button>
              )}
            </div>

            {!loading && !error && (
              <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                {total}{' '}
                {total === 1
                  ? t('events.result.singular')
                  : t('events.result.plural')}{' '}
                {t('events.result.found')}
              </p>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[380px] rounded-2xl bg-white dark:bg-[#3A3A3A] border border-slate-100 dark:border-slate-700 overflow-hidden animate-pulse"
                >
                  <div className="h-[240px] bg-slate-200 dark:bg-slate-700" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-500 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-20 max-w-md mx-auto rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] px-6">
              <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
                {t('events.empty.title')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">
                {t('events.empty.subtitle')}
              </p>
              {hasFilters && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={clearFilters}
                  className="bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-full px-5 py-2 text-sm font-semibold"
                >
                  {t('events.filter.clear')}
                </Button>
              )}
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event, index) => (
                <PublicEventCard
                  key={event.id}
                  event={event}
                  eagerImage={index < 4}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function PublicEventCard({
  event,
  eagerImage = false,
}: {
  event: EventItem;
  eagerImage?: boolean;
}) {
  const { t, language } = useLanguage();
  const localeTag = language === 'sw' ? 'sw-KE' : 'en-KE';

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [localeTag],
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(localeTag),
    [localeTag],
  );

  const cheapestPrice = useMemo(() => {
    const activeTiers = (event.ticketTiers ?? []).filter(
      (tier) => tier.isActive !== false,
    );
    if (activeTiers.length === 0) return null;
    const sorted = [...activeTiers].sort(
      (a, b) => getTierUnitPrice(a) - getTierUnitPrice(b),
    );
    return getTierUnitPrice(sorted[0]);
  }, [event.ticketTiers]);

  const hasGroupTier = useMemo(
    () =>
      Boolean(event.allowGroupBookings) ||
      (event.ticketTiers ?? []).some(
        (tier) => tier.isActive !== false && Boolean(tier.isGroupSubgroup),
      ),
    [event.allowGroupBookings, event.ticketTiers],
  );

  const dateStr = useMemo(() => {
    const date = new Date(event.startsAt);
    return Number.isNaN(date.getTime())
      ? event.startsAt
      : dateFormatter.format(date);
  }, [event.startsAt, dateFormatter]);

  return (
    <Link
      href={`/events/${event.slug}`}
      style={
        eagerImage
          ? undefined
          : { contentVisibility: 'auto', containIntrinsicSize: '0 380px' }
      }
      className="group relative flex flex-col h-full bg-white dark:bg-[#3A3A3A] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_0_0_2px_#29ABE2,0_12px_20px_-8px_rgba(0,0,0,0.08)] hover:border-[#29ABE2] hover:-translate-y-1.5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      <div className="relative w-full h-[220px] sm:h-[240px] md:h-[260px] shrink-0 overflow-hidden bg-slate-100 dark:bg-[#2B2B2B] z-[1]">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            loading={eagerImage ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#29ABE2] to-[#1A8CC4]" />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white dark:to-[#3A3A3A] pointer-events-none z-[5]" />

        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
          {event.category && (
            <span className="px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#1A8CC4] text-[0.65rem] font-semibold uppercase tracking-wide shadow-sm">
              {event.category.name}
            </span>
          )}
          {hasGroupTier && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[0.65rem] font-semibold uppercase tracking-wide shadow-sm">
              <Users className="w-3 h-3 text-[#29ABE2]" />
              {t('events.card.groupBadge')}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-grow px-4 pt-3 pb-3 bg-white dark:bg-[#3A3A3A] relative z-10">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-[#1A8CC4] dark:group-hover:text-[#29ABE2]">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1 mb-3 text-[0.75rem] text-slate-500 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <MapPin
              className="w-3 h-3 text-[#29ABE2] shrink-0"
              strokeWidth={2.5}
            />
            <span className="truncate">
              {event.venueName}, {event.county}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar
              className="w-3 h-3 text-[#29ABE2] shrink-0"
              strokeWidth={2.5}
            />
            <span className="truncate">{dateStr}</span>
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
          {cheapestPrice !== null ? (
            <span className="text-base font-extrabold text-[#1A8CC4] dark:text-[#29ABE2]">
              {cheapestPrice === 0
                ? t('common.free')
                : t('events.card.fromKes', {
                    amount: numberFormatter.format(cheapestPrice),
                  })}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-200 group-hover:text-[#1A8CC4] dark:group-hover:text-[#29ABE2] transition-colors">
            {t('events.card.view')} →
          </span>
        </div>
      </div>
    </Link>
  );
}