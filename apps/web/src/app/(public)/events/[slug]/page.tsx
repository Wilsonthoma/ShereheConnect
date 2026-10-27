'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Calendar, Star, CheckCircle2, 
  Ticket as TicketIcon, MessageSquarePlus, Navigation
} from 'lucide-react';
import { publicEventsApi, EventItem } from '@/lib/eventsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { FullPageLoader, Button } from '@/components/ui';
import { toast } from '@/lib/toast';
import { isLoggedIn } from '@/lib/auth';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { t, language } = useLanguage();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'venue' | 'organizer' | 'reviews'>('details');
  const [distance, setDistance] = useState<string | null>(null);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    if (!slug) return;
    publicEventsApi.detail(slug)
      .then(setEvent)
      .catch((err) => setError(err.message || 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!event || !event.latitude || !event.longitude) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const dist = calculateDistance(
            position.coords.latitude, position.coords.longitude,
            event.latitude!, event.longitude!
          );
          setDistance(dist);
        },
        () => {
          setDistance(null);
        }
      );
    }
  }, [event]);

  if (loading) return <FullPageLoader message="Loading event..." />;
  
  if (error || !event) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-light dark:bg-slate-950 transition-colors">
        <div className="text-center max-w-md px-4">
          <h2 className="heading-display text-3xl text-slate-800 dark:text-slate-100 mb-2">{t('evt.notFound')}</h2>
          <p className="text-slate-500 mb-6">{t('evt.notFoundDesc')}</p>
          <Link href="/events"><Button variant="primary">{t('evt.browse')}</Button></Link>
        </div>
      </main>
    );
  }

  const startDate = new Date(event.startsAt);
  const locale = language === 'sw' ? 'sw-KE' : 'en-KE';
  
  const dateStr = startDate.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  
  const totalTicketsLeft = event.ticketTiers?.filter(t => t.isActive !== false).reduce((acc, tier) => {
    return acc + (tier.quantityTotal - (tier.quantitySold || 0) - (tier.quantityReserved || 0));
  }, 0) || 0;

  const cheapestTier = event.ticketTiers?.filter(t => t.isActive !== false).sort((a, b) => a.priceKes - b.priceKes)[0];
  
  const reviews = (event as any).reviews || [];
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleOpenReviewModal = () => {
    if (!isLoggedIn()) {
      toast.info('Login required', 'Please log in to write a review.');
      router.push(`/login?next=/events/${slug}`);
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return toast.error('Please write a review');
    toast.success('Review submitted!', 'Thank you for your feedback.');
    setIsReviewModalOpen(false);
    setReviewText('');
    setReviewRating(5);
  };

  return (
    <main className="event-detail-page min-h-screen bg-white dark:bg-slate-950 pb-20 transition-colors">
      
      {/* ========== BREADCRUMB ========== */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-4">
        <div className="event-breadcrumb flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-orange-500 transition-colors">{t('nav.home', 'Home')}</Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link href="/events" className="hover:text-orange-500 transition-colors">{t('nav.events', 'Events')}</Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-800 dark:text-slate-100 font-medium truncate">{event.title}</span>
        </div>
      </div>

      {/* ========== CONTAINER ========== */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">

        {/* ========== HERO: IMAGE + INFO SIDE BY SIDE ========== */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,380px)_1fr] gap-6 md:gap-8 mb-6 items-start">

          {/* Image (contained, responsive) */}
          <div className="event-image-container relative rounded-2xl overflow-hidden w-full aspect-[4/3] max-h-[280px] md:max-h-[320px]">
            {event.coverImageUrl ? (
              <img
                src={event.coverImageUrl}
                alt={event.title}
                className="event-main-image absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
            )}

            <button
              onClick={() => router.back()}
              className="absolute top-3 left-3 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all z-10"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {event.isFeatured && (
              <span className="event-featured-badge absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[0.65rem] font-bold uppercase tracking-wider shadow-md z-10">
                <Star className="w-3 h-3 fill-white" /> Featured
              </span>
            )}
          </div>

          {/* Info beside image */}
          <div className="flex flex-col min-w-0">

            {/* Title + rating row */}
            <div className="event-title-section flex justify-between items-start flex-wrap gap-3 mb-3">
              <h1 className="heading-display text-2xl md:text-3xl lg:text-4xl text-slate-800 dark:text-slate-100 flex-1 min-w-0 leading-tight">
                {event.title}
              </h1>

              <button
                onClick={() => setActiveTab('reviews')}
                className="event-rating flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-orange-400 transition-all shrink-0"
              >
                <div className="flex text-orange-400">
                  <Star className={`w-3.5 h-3.5 ${reviews.length > 0 ? 'fill-orange-400' : ''}`} />
                  <Star className={`w-3.5 h-3.5 ${reviews.length > 0 ? 'fill-orange-400' : ''}`} />
                  <Star className={`w-3.5 h-3.5 ${reviews.length > 0 ? 'fill-orange-400' : ''}`} />
                  <Star className={`w-3.5 h-3.5 ${reviews.length > 0 ? 'fill-orange-400' : ''}`} />
                  <Star className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-slate-500 font-medium">({reviews.length})</span>
              </button>
            </div>

            {/* Meta stack */}
            <div className="event-meta flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500 shrink-0" /> {dateStr} at {timeStr}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" /> {event.county}
              </span>
              <span className="flex items-center gap-2 text-orange-500 font-medium">
                <TicketIcon className="w-4 h-4 shrink-0" /> {t('evt.tickets.left', { count: totalTicketsLeft })}
              </span>
            </div>
          </div>
        </div>

        {/* ========== TWO-COLUMN GRID ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          
          {/* ===== MAIN COLUMN ===== */}
          <div className="min-w-0 space-y-6">
            
            {/* ===== TABS ===== */}
            <div className="event-tabs flex gap-1 border-b-2 border-slate-200 dark:border-slate-800 overflow-x-auto">
              {['details', 'venue', 'organizer', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`tab-btn px-5 py-3 text-sm font-semibold capitalize whitespace-nowrap transition-all relative ${
                    activeTab === tab 
                      ? 'text-orange-500 active' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t(`evt.tab.${tab}`)}
                </button>
              ))}
            </div>

            {/* ===== TAB CONTENT ===== */}
            <div className="tab-content active animate-in fade-in duration-300">
              {activeTab === 'details' && (
                <div className="space-y-8">
                  <section className="event-description">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-500 text-xs font-bold">i</div>
                      {t('evt.about')}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap text-sm">
                      {event.description}
                    </p>
                  </section>

                  {event.eventFeatures && event.eventFeatures.length > 0 && (
                    <section className="event-features">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
                        {t('evt.features')}
                      </h2>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0">
                        {event.eventFeatures.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {t(`feature.${feature.toLowerCase().replace(/\s+/g, '')}` as any) || feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'venue' && (
                <section className="event-venue-details">
                  <div className="venue-header flex items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="venue-icon w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-500">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('evt.tab.venue')}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{event.venueName}, {event.address}</p>
                    </div>
                  </div>
                  
                  {distance && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-sm font-semibold mb-4">
                      <Navigation className="w-4 h-4" /> {distance} km away from your current location
                    </div>
                  )}

                  {event.latitude && event.longitude && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-80">
                      <iframe title="Event location" width="100%" height="100%" frameBorder="0" style={{ border: 0 }} referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${event.latitude},${event.longitude}&hl=en&z=14&output=embed`} />
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'organizer' && event.organizer && (
                <section className="organizer-info">
                  <div className="organizer-header flex items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                    {event.organizer.logoUrl ? (
                      <img src={event.organizer.logoUrl} alt={event.organizer.businessName} className="organizer-avatar w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="organizer-avatar w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-2xl">{event.organizer.businessName.charAt(0)}</div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{event.organizer.businessName}</h2>
                      {event.organizer.bio && <p className="text-sm text-slate-500 mt-1">{event.organizer.bio}</p>}
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'reviews' && (
                <section>
                  <div className="reviews-summary flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <div>
                      <div className="rating-number text-2xl font-extrabold text-slate-800 dark:text-slate-100">{averageRating}</div>
                      <div className="stars-large flex text-orange-400 my-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`w-4 h-4 ${star <= Number(averageRating) ? 'fill-orange-400' : ''}`} />
                        ))}
                      </div>
                      <span className="total-reviews text-xs text-slate-500">({reviews.length} reviews)</span>
                    </div>

                    <button 
                      onClick={handleOpenReviewModal}
                      className="write-review-btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shrink-0"
                    >
                      <MessageSquarePlus className="w-4 h-4" /> Write a Review
                    </button>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-sm text-slate-500">{t('evt.reviews.empty')}</p>
                    </div>
                  ) : (
                    <div className="reviews-list space-y-4">
                      {reviews.map((review: any, i: number) => (
                        <div key={i} className="review-card p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="review-header flex items-center justify-between mb-2">
                            <span className="reviewer-name font-bold text-sm">{review.userName || 'Attendee'}</span>
                            <div className="review-rating flex text-orange-400">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-orange-400' : ''}`} />
                              ))}
                            </div>
                          </div>
                          <p className="review-content text-sm text-slate-600 dark:text-slate-400">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>

          {/* ===== STICKY SIDEBAR (event-sidebar) ===== */}
          <aside className="event-sidebar lg:sticky lg:top-24 h-fit">
            <div className="ticket-card bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
              <div className="p-6 md:p-8">
                {cheapestTier ? (
                  <div className="ticket-price-info text-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <p className="price-label text-xs text-slate-500 mb-1">{t('evt.tickets.starting')}</p>
                    <p className="current-price text-3xl font-bold text-orange-500">KES {cheapestTier.priceKes.toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 mb-6 text-center">No tickets available</p>
                )}

                <div className="space-y-3 mb-6">
                  {event.ticketTiers?.filter(t => t.isActive !== false).map(tier => (
                    <div key={tier.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{tier.name}</span>
                      <span className="text-orange-500 font-bold text-sm">KES {tier.priceKes.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <Button variant="primary" size="lg" fullWidth onClick={() => toast.info('Coming soon', 'Booking flow is under construction.')} className="book-now-btn w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl">
                  {t('evt.tickets.book')}
                </Button>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Write a Review</h3>
            <p className="text-sm text-slate-500 mb-6">Share your experience with {event.title}.</p>

            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-orange-400 text-orange-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  placeholder="What did you think of the event?"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}