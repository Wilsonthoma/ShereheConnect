'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Calendar } from 'lucide-react';
import { publicEventsApi, EventItem } from '@/lib/eventsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FullPageLoader } from '@/components/ui';

const CATEGORIES = [
  { code: 'FESTIVAL', tKey: 'events.cat.festival', fallback: 'Festivals' },
  { code: 'CONFERENCE', tKey: 'events.cat.conference', fallback: 'Conferences' },
  { code: 'ENTERTAINMENT', tKey: 'events.cat.entertainment', fallback: 'Entertainment' },
  { code: 'SPORTS', tKey: 'events.cat.sports', fallback: 'Sports' },
  { code: 'ARTS', tKey: 'events.cat.arts', fallback: 'Arts & Culture' },
  { code: 'COMMUNITY', tKey: 'events.cat.community', fallback: 'Community' },
  { code: 'EDUCATION', tKey: 'events.cat.education', fallback: 'Workshops' },
  { code: 'BUSINESS', tKey: 'events.cat.business', fallback: 'Business' },
];

export default function EventsPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  const { t } = useLanguage();

  const tr = (key: string, fallback: string) => {
    const val = t(key as any);
    return val === key ? fallback : val;
  };

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

  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 transition-colors">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-16 md:py-20">
        <div className="container-fluid text-center">
          <h1 className="heading-display heading-lg text-white mb-4">
            {tr('events.hero.title', 'Discover Events')}
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            {tr(
              'events.hero.subtitle',
              'Find festivals, conferences, concerts, and more happening across Kenya.',
            )}
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full shadow-2xl px-5 py-3 border border-transparent dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={tr(
                  'events.search.placeholder',
                  'Search events, venues, or organizers...',
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters + content */}
      <section className="py-10 md:py-14">
        <div className="container-fluid">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                !selectedCategory
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-gold/50'
              }`}
            >
              {tr('events.filter.all', 'All')}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat.code
                    ? 'bg-brand-gradient text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-gold/50'
                }`}
              >
                {tr(cat.tKey, cat.fallback)}
              </button>
            ))}
          </div>

          {/* County filter */}
          <div className="mb-8 max-w-xs">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={tr(
                  'events.filter.county',
                  'Filter by county...',
                )}
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {loading && (
            <FullPageLoader
              message={tr('events.loading', 'Loading events...')}
            />
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-500 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
                {tr('events.empty.title', 'No events found')}
              </h3>
              <p className="text-sm text-slate-500">
                {tr(
                  'events.empty.subtitle',
                  'Try adjusting your search or filters.',
                )}
              </p>
            </div>
          )}

          {!loading && events.length > 0 && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {total}{' '}
                {total !== 1
                  ? tr('events.result.plural', 'events')
                  : tr('events.result.singular', 'event')}{' '}
                {tr('events.result.found', 'found')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event) => (
                  <PublicEventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/* ============================================
   PUBLIC EVENT CARD
   ============================================ */
function PublicEventCard({ event }: { event: EventItem }) {
  const { t, language } = useLanguage();

  const cheapestTier = event.ticketTiers
    ?.filter((tier) => tier.isActive !== false)
    .sort((a, b) => a.priceKes - b.priceKes)[0];

  const date = new Date(event.startsAt);
  const dateStr = date.toLocaleDateString(
    language === 'sw' ? 'sw-KE' : 'en-KE',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );

  const viewLabel = (() => {
    const val = t('events.card.view' as any);
    return val === 'events.card.view' ? 'View' : val;
  })();

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold to-orange" />
        )}
        {event.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-gradient text-white text-[0.65rem] font-bold uppercase shadow-md">
            {event.category.name}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 group-hover:text-gold transition-colors">
          {event.title}
        </h3>

        <div className="space-y-1 text-[0.75rem] text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">
              {event.venueName}, {event.county}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateStr}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {cheapestTier ? (
            <span className="text-sm font-bold text-gold">
              From KES {cheapestTier.priceKes.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-gold transition-colors">
            {viewLabel} →
          </span>
        </div>
      </div>
    </Link>
  );
}