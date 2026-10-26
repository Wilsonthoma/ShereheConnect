'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Ticket as TicketIcon,
} from 'lucide-react';
import { adminEventsApi, EventItem } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader, EventImage } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type ReviewAction = 'APPROVED' | 'REJECTED' | 'REQUESTED_CHANGES';

export default function AdminEventReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { language } = useLanguage();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ReviewAction | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token || !id) return;
    adminEventsApi
      .get(token, id)
      .then(setEvent)
      .catch((err: any) =>
        toast.error('Failed to load event', err?.message ?? 'Unknown error'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (action: ReviewAction, feedback: string) => {
    const token = getToken();
    if (!token || !event) return;

    setSubmitting(true);
    try {
      await adminEventsApi.review(token, event.id, {
        action,
        notes: feedback || undefined,
        rejectionReason: action !== 'APPROVED' ? feedback : undefined,
      });
      toast.success(
        `Event ${
          action === 'APPROVED'
            ? 'approved'
            : action === 'REJECTED'
            ? 'rejected'
            : 'sent back for changes'
        }!`,
      );
      router.push('/admin/events');
    } catch (err: any) {
      toast.error('Review failed', err?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
      setModal(null);
      setNotes('');
    }
  };

  if (loading) return <FullPageLoader message="Loading event..." />;

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Event not found</p>
        <Link
          href="/admin/events"
          className="text-gold hover:underline mt-4 inline-block"
        >
          Back to events
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.endsAt);
  const locale = language === 'sw' ? 'sw-KE' : 'en-KE';
  const isPending = event.status === 'PENDING_APPROVAL';

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        onClick={() => router.push('/admin/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-block px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
            {event.status.replace(/_/g, ' ')}
          </span>
          {event.submittedAt && (
            <span className="text-xs text-slate-500">
              Submitted{' '}
              {new Date(event.submittedAt).toLocaleString(locale)}
            </span>
          )}
        </div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          {event.title}
        </h1>
        <p className="text-sm text-slate-500">
          By <strong>{event.organizer?.businessName}</strong>
          {event.organizer?.county ? ` (${event.organizer.county})` : ''}
        </p>
      </div>

      {/* Cover */}
      <div className="rounded-2xl overflow-hidden">
        <EventImage
          src={event.coverImageUrl}
          alt={event.title}
          variant="hero"
        />
      </div>

      {/* Key info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            When
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {startDate.toLocaleString(locale)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            to {endDate.toLocaleString(locale)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Where
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {event.venueName}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {event.address}, {event.county}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">
          Description
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
          {event.description}
        </p>
      </div>

      {/* Tickets */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <TicketIcon className="w-4 h-4" />
          Ticket Tiers
        </h3>
        {event.ticketTiers && event.ticketTiers.length > 0 ? (
          <div className="space-y-2">
            {event.ticketTiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
              >
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">
                  {tier.name}
                </span>
                <div className="text-right">
                  <p className="font-bold text-sm text-gold">
                    {tier.priceKes === 0
                      ? 'Free'
                      : `KES ${tier.priceKes.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tier.quantityTotal} available
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No ticket tiers</p>
        )}
      </div>

      {/* Prior reviews */}
      {event.reviews && event.reviews.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">
            Prior Reviews
          </h3>
          <div className="space-y-3">
            {event.reviews.map((review: any) => (
              <div
                key={review.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {review.admin?.fullName || 'Admin'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(review.createdAt).toLocaleString(locale)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase bg-slate-200 dark:bg-slate-700">
                    {review.action.replace(/_/g, ' ')}
                  </span>
                </div>
                {review.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {review.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {isPending && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-gold/40 p-6 sticky bottom-4 shadow-2xl">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4">
            Review Decision
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setModal('APPROVED')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => setModal('REQUESTED_CHANGES')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Request Changes
            </button>
            <button
              onClick={() => setModal('REJECTED')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setModal(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
              {modal === 'APPROVED'
                ? 'Approve Event?'
                : modal === 'REQUESTED_CHANGES'
                ? 'Request Changes'
                : 'Reject Event?'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {modal === 'APPROVED'
                ? 'This event will go live and be visible to attendees.'
                : 'The organizer will receive your feedback.'}
            </p>

            {modal !== 'APPROVED' && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  modal === 'REQUESTED_CHANGES'
                    ? 'Describe what needs to change...'
                    : 'Explain why the event is rejected...'
                }
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold text-sm mb-4 resize-none"
              />
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(modal, notes)}
                disabled={
                  submitting || (modal !== 'APPROVED' && !notes.trim())
                }
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors ${
                  modal === 'APPROVED'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : modal === 'REQUESTED_CHANGES'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : modal === 'APPROVED' ? (
                  <Check className="w-4 h-4" />
                ) : modal === 'REQUESTED_CHANGES' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
