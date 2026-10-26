'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Ticket as TicketIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import {
  adminEventsApi,
  EventItem,
} from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AdminEventReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { language } = useLanguage();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const load = async () => {
    const token = getToken();
    if (!token || !id) return;
    try {
      const data = await adminEventsApi.get(token, id);
      setEvent(data);
    } catch (err: any) {
      toast.error(
        'Failed to load event',
        err?.message ?? 'Unknown error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const review = async (
    action: 'APPROVED' | 'REJECTED' | 'REQUESTED_CHANGES',
  ) => {
    const token = getToken();
    if (!token || !event) return;

    if (action === 'REJECTED' && !rejectionReason.trim()) {
      toast.error(
        'Reason required',
        'Please explain why the event is rejected.',
      );
      return;
    }

    setBusy(action);
    try {
      await adminEventsApi.review(token, event.id, {
        action,
        notes: notes.trim() || undefined,
        rejectionReason:
          action === 'REJECTED' ? rejectionReason.trim() : undefined,
      });

      const label =
        action === 'APPROVED'
          ? 'approved and is now LIVE'
          : action === 'REJECTED'
          ? 'rejected'
          : 'sent back for changes';

      toast.success('Review saved', `Event ${label}.`);
      await load();
      setNotes('');
      setRejectionReason('');
    } catch (err: any) {
      toast.error(
        'Review failed',
        err?.message ?? 'Unknown error',
      );
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <FullPageLoader message="Loading event..." />;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Event not found.</p>
        <Link
          href="/admin/events"
          className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-orange font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to events
        </Link>
      </div>
    );
  }

  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const locale = language === 'sw' ? 'sw-KE' : 'en-KE';
  const dateStr = startsAt.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = `${startsAt.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })} – ${endsAt.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const canReview = event.status === 'PENDING_APPROVAL';
  const totalSold = event.ticketTiers?.reduce(
    (s, t) => s + (t.quantitySold || 0),
    0,
  );
  const totalQty = event.ticketTiers?.reduce(
    (s, t) => s + (t.quantityTotal || 0),
    0,
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        onClick={() => router.push('/admin/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </button>

      {/* Cover */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative aspect-[16/7] bg-slate-100 dark:bg-slate-800">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gold to-orange" />
          )}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white">
              {event.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <h1 className="heading-display text-2xl md:text-3xl text-slate-900 dark:text-white mb-4">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {event.venueName}, {event.county}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {dateStr}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {event.organizer?.businessName ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-3">
          Description
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {event.description}
        </p>
      </div>

      {/* Ticket tiers */}
      {event.ticketTiers && event.ticketTiers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              Ticket Tiers
            </h2>
            <span className="text-xs text-slate-500">
              {totalSold} / {totalQty} sold
            </span>
          </div>
          <div className="space-y-2">
            {event.ticketTiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <TicketIcon className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {tier.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gold text-sm">
                    {tier.priceKes === 0
                      ? 'Free'
                      : `KES ${tier.priceKes.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tier.quantityTotal} total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review panel */}
      {canReview ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-gold/30 p-6 md:p-8">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gold" />
            Review Decision
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Internal notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any notes for the audit trail..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Rejection reason (required for reject)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="Tell the organizer what needs fixing..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold resize-none text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => review('APPROVED')}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {busy === 'APPROVED' ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve & Publish
              </button>

              <button
                onClick={() => review('REQUESTED_CHANGES')}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {busy === 'REQUESTED_CHANGES' ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Request Changes
              </button>

              <button
                onClick={() => review('REJECTED')}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {busy === 'REJECTED' ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
          <p className="text-sm text-slate-500">
            This event is <strong>{event.status.replace('_', ' ')}</strong> —
            no further review action is available.
          </p>
        </div>
      )}
    </div>
  );
}
