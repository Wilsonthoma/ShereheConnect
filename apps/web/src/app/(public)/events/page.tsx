'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar, ChevronDown } from 'lucide-react';
import { publicEventsApi, EventItem } from '@/lib/eventsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FullPageLoader } from '@/components/ui';

const CATEGORIES = [
  { code: 'FESTIVAL', label: 'Festivals' },
  { code: 'CONFERENCE', label: 'Conferences' },
  { code: 'ENTERTAINMENT', label: 'Entertainment' },
  { code: 'SPORTS', label: 'Sports' },
  { code: 'ARTS', label: 'Arts & Culture' },
  { code: 'COMMUNITY', label: 'Community' },
  { code: 'EDUCATION', label: 'Workshops' },
  { code: 'BUSINESS', label: 'Business' },
];

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Kakamega', 'Nyeri', 'Meru', 'Machakos', 'Kisii',
];

const BANNER_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80',
    alt: 'Festival crowd',
  },
  {
    src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&q=80',
    alt: 'Concert stage',
  },
  {
    src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80',
    alt: 'Live music',
  },
];

function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (BANNER_SLIDES.length <= 1) return;
    const t = setInterval(() => {
      if (!pausedRef.current) {
        setCurrent((i) => (i + 1) % BANNER_SLIDES.length);
      }
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-900"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Slides */}
      {BANNER_SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={i !== current}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Spacer governs height */}
      <img
        src={BANNER_SLIDES[0].src}
        alt=""
        className="w-full h-[160px] sm:h-[200px] md:h-[260px] object-cover invisible"
        aria-hidden="true"
      />

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {BANNER_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? 'w-8 bg-gradient-to-r from-[#f59e0b] to-[#ec6408]'
                : 'w-2 bg-white/60 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  const { t, language } = useLanguage();

  const tr = (key: string, fallback: string) => {
    const val = t(key as any);
    return val === key ? fallback : val;
  };

  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [county, setCounty] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicEventsApi.list({
          q: search || undefined,
          categoryId: selectedCategory || undefined,
          county: county || undefined,
          limit: 50,
        });
        setEvents(res.items);
        setTotal(res.total);
      } catch (err: any) {
        setError(err?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory, county]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setCounty('');
    setSearch('');
  };

  const hasFilters = Boolean(selectedCategory || county || search);

  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 transition-colors">
      {/* ===== HERO ===== */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16 md:py-20">
        <div className="container-fluid text-center">
          <h1 className="heading-display heading-lg text-white mb-4">
            {tr('events.hero.title', 'Discover Events')}
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            {tr('events.hero.subtitle', 'Find festivals, conferences, concerts, and more happening across Kenya.')}
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full shadow-2xl px-5 py-3 border border-transparent dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={tr('events.search.placeholder', 'Search events, venues, or organizers...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FULL-BLEED BANNER STRIP ===== */}
      <BannerCarousel />

      {/* ===== BODY ===== */}
      <section className="py-10 md:py-14">
        <div className="container-fluid max-w-7xl">

          {/* ===== FILTER BAR ===== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 font-medium cursor-pointer hover:border-gold/50 focus:border-gold focus:outline-none transition-colors"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>{cat.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="appearance-none pl-9 pr-10 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 font-medium cursor-pointer hover:border-gold/50 focus:border-gold focus:outline-none transition-colors"
                >
                  <option value="">All Counties</option>
                  {COUNTIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-slate-500 hover:text-orange-500 font-medium transition-colors px-2"
                >
                  Clear
                </button>
              )}
            </div>

            {!loading && !error && (
              <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                {total} {total !== 1 ? 'events' : 'event'} found
              </p>
            )}
          </div>

          {/* ===== STATES ===== */}
          {loading && <FullPageLoader message="Loading events..." />}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-500 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-20 max-w-md mx-auto rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6">
              <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">No events found</h3>
              <p className="text-sm text-slate-500 mb-6">Try adjusting your search or filters.</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* ===== GRID ===== */}
          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event) => (
                <PublicEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function PublicEventCard({ event }: { event: EventItem }) {
  const { language } = useLanguage();
  const cheapestTier = event.ticketTiers?.filter((t) => t.isActive !== false).sort((a, b) => a.priceKes - b.priceKes)[0];
  const date = new Date(event.startsAt);
  const dateStr = date.toLocaleDateString(language === 'sw' ? 'sw-KE' : 'en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] hover:shadow-[0_0_0_2px_#f59e0b,0_12px_20px_-8px_rgba(0,0,0,0.08)] hover:border-[#f59e0b] hover:-translate-y-1.5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      <div className="relative w-full h-[220px] sm:h-[240px] md:h-[260px] shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 z-[1]">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white dark:to-slate-900 pointer-events-none z-[5]" />

        {event.category && (
          <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#d97706] text-[0.65rem] font-semibold uppercase tracking-wide shadow-sm">
            {event.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-grow px-4 pt-3 pb-3 bg-white dark:bg-slate-900 relative z-10">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-snug mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-[#ec6408]">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1 mb-3 text-[0.75rem] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[#f59e0b] shrink-0" strokeWidth={2.5} />
            <span className="truncate">{event.venueName}, {event.county}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#f59e0b] shrink-0" strokeWidth={2.5} />
            <span className="truncate">{dateStr}</span>
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {cheapestTier ? (
            <span className="text-base font-extrabold text-[#ec6408]">
              From KES {cheapestTier.priceKes.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-[#ec6408] transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}