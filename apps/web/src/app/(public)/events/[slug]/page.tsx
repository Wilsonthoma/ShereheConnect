'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  Phone,
  Star,
} from 'lucide-react';
import { publicEventsApi, EventItem } from '@/lib/eventsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FullPageLoader, Button } from '@/components/ui';
import { toast } from '@/lib/toast';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { t, language } = useLanguage();

  const tr = (key: string, fallback: string) => {
    const val = t(key as any);
    return val === key ? fallback : val;
  };

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    publicEventsApi
      .detail(slug)
      .then(setEvent)
      .catch((err) => setError(err.message || 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <FullPageLoader
        message={tr('events.detail.loading', 'Loading event...')}
      />
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-light dark:bg-slate-950 transition-colors">
        <div className="text-center max-w-md px-4">
          <h2 className="heading-display text-3xl text-slate-800 dark:text-slate-100 mb-2">
            {tr('events.detail.notFound', 'Event not found')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {error ||
              tr(
                'events.detail.notFoundDesc',
                'This event does not exist or is not live.',
              )}
          </p>
          <Link href="/events">
            <Button variant="primary">
              {tr('events.detail.browse', 'Browse All Events')}
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);
  const locale = language === 'sw' ? 'sw-KE' : 'en-KE';

  const startStr = startDate.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = endDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasMap = event.latitude != null && event.longitude != null;

  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 transition-colors">
      {/* ============================================
          COVER HERO
      ============================================ */}
      <div className="relative h-[300px] md:h-[450px] overflow-hidden bg-slate-900">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold to-orange" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 container-fluid pb-8 text-white">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-gold mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tr('events.detail.back', 'Back')}
          </button>
          {event.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-brand-gradient text-white text-xs font-bold uppercase tracking-wider mb-3 shadow-lg">
              {event.category.name}
            </span>
          )}
          <h1 className="heading-display heading-md text-white drop-shadow-lg max-w-4xl">
            {event.title}
          </h1>
        </div>
      </div>

      {/* ============================================
          CONTENT BODY
      ============================================ */}
      <div className="container-fluid py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── LEFT: Details ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-8">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {tr('events.detail.when', 'When')}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {startStr}
                  </p>
                  <p className="text-xs text-slate-500">
                    {startTime} — {endTime}
                  </p>
                </div>
              </div>

              <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-800" />

              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {tr('events.detail.where', 'Where')}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {event.venueName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {event.address}, {event.county}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
                {tr('events.detail.about', 'About this event')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Map (optional) */}
            {hasMap && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
                  {tr('events.detail.location', 'Location')}
                </h2>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <iframe
                    title="Event location"
                    width="100%"
                    height="300"
                    frameBorder="0"
                    style={{ border: 0 }}
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=en&z=14&output=embed`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-gold hover:text-orange font-semibold transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {tr('events.detail.openInMaps', 'Open in Google Maps')}
                </a>
              </div>
            )}

            {/* Organizer card — now with logo, bio, phone */}
            {event.organizer && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
                  {tr('events.detail.organizer', 'Organizer')}
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Logo / initial */}
                  {event.organizer.logoUrl ? (
                    <img
                      src={event.organizer.logoUrl}
                      alt={event.organizer.businessName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
                      {event.organizer.businessName.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base text-slate-800 dark:text-slate-100">
                      {event.organizer.businessName}
                    </p>

                    {event.organizer.averageRating != null &&
                      event.organizer.averageRating > 0 && (
                        <p className="inline-flex items-center gap-1 text-xs text-gold mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-gold" />
                          {Number(event.organizer.averageRating).toFixed(1)}
                        </p>
                      )}

                    {event.organizer.bio && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        {event.organizer.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {event.organizer.county && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.organizer.county}
                        </span>
                      )}
                      {event.organizer.phone && (
                        <a
                          href={`tel:${event.organizer.phone}`}
                          className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {event.organizer.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Tickets ── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 sticky top-24">
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-gold" />
                {tr('events.detail.tickets', 'Tickets')}
              </h2>

              {!event.ticketTiers || event.ticketTiers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {tr('events.detail.noTickets', 'No tickets available.')}
                </p>
              ) : (
                <div className="space-y-3 mb-6">
                  {event.ticketTiers
                    .filter((t) => t.isActive !== false)
                    .map((tier) => {
                      const remaining =
                        tier.quantityTotal -
                        (tier.quantitySold || 0) -
                        (tier.quantityReserved || 0);
                      const soldOut = remaining <= 0;

                      return (
                        <div
                          key={tier.id}
                          className={`p-4 rounded-xl border ${
                            soldOut
                              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                              {tier.name}
                            </span>
                            <span className="font-bold text-gold text-sm">
                              KES {tier.priceKes.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {soldOut
                              ? tr('events.detail.soldOut', 'Sold out')
                              : `${remaining} ${tr(
                                  'events.detail.remaining',
                                  'remaining',
                                )}`}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  toast.info(
                    tr(
                      'events.detail.bookingComingSoonTitle',
                      'Booking coming soon',
                    ),
                    tr(
                      'events.detail.bookingComingSoonBody',
                      'The booking flow will be available shortly.',
                    ),
                  );
                }}
              >
                {tr('events.detail.bookNow', 'Book Now')}
              </Button>

              <p className="mt-4 text-xs text-center text-slate-400">
                {tr('events.detail.secure', 'Secure payment via M-Pesa')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}