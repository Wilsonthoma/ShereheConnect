'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { organizerEventsApi, EventItem } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader, EventImage } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  PENDING_APPROVAL: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  NEEDS_REVISION: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  APPROVED: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  LIVE: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  ONGOING: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  COMPLETED: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  REJECTED: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

export default function OrganizerEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { language } = useLanguage();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const token = getToken();
    if (!token || !id) return;
    try {
      const data = await organizerEventsApi.detail(token, id);
      setEvent(data);
    } catch (err: any) {
      toast.error('Failed to load event', err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmitForApproval = async () => {
    const token = getToken();
    if (!token || !event) return;
    setBusy('submit');
    try {
      await organizerEventsApi.submit(token, event.id);
      toast.success('Event submitted!', 'Awaiting admin approval.');
      await load();
    } catch (err: any) {
      toast.error('Submit failed', err?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!event) return;
    const reason = window.prompt('Why are you cancelling this event? (Optional)', '');
    if (reason === null) return;
    const token = getToken();
    if (!token) return;
    setBusy('cancel');
    try {
      await organizerEventsApi.cancel(token, event.id, reason || undefined);
      toast.success('Event cancelled', 'Attendees will see it as cancelled.');
      await load();
    } catch (err: any) {
      toast.error('Cancel failed', err?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    const token = getToken();
    if (!token) return;
    setBusy('delete');
    try {
      await organizerEventsApi.delete(token, event.id);
      toast.success('Event deleted', 'The draft was removed.');
      router.push('/organizer/events');
    } catch (err: any) {
      toast.error('Delete failed', err?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <FullPageLoader message="Loading event..." />;

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Event not found.</p>
        <Link href="/organizer/events" className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-orange font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to My Events
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

  const timeStr = `${startsAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} – ${endsAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

  const canEditOrSubmit = event.status === 'DRAFT' || event.status === 'NEEDS_REVISION';
  const canCancel = ['LIVE', 'ONGOING', 'APPROVED'].includes(event.status);
  const canDelete = event.status === 'DRAFT';
  const hasAttendees = (event._count?.bookings ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/organizer/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Events
      </button>

      {/* Cover + header container */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative max-h-[300px] md:max-h-[400px] overflow-hidden">
          <EventImage
            src={event.coverImageUrl}
            alt={event.title}
            variant="banner"
            className="w-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${STATUS_STYLES[event.status] || STATUS_STYLES.DRAFT}`}>
              {event.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-4">
            {event.title}
          </h1>

          {/* Clean metadata without emojis */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <span>{event.venueName}, {event.county}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
            <span>{dateStr}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
            <span>{timeStr}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {canEditOrSubmit && (
              <>
                <Link
                  href={`/organizer/events/${event.id}/edit`}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Edit Event
                </Link>
                <button
                  onClick={handleSubmitForApproval}
                  disabled={busy === 'submit'}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:transform-none transition-all"
                >
                  {busy === 'submit' ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </>
            )}

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={busy === 'cancel'}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-semibold hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                {busy === 'cancel' ? 'Cancelling...' : 'Cancel Event'}
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={busy === 'delete'}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                {busy === 'delete' ? 'Deleting...' : 'Delete Draft'}
              </button>
            )}

            {hasAttendees && (
              <Link
                href={`/organizer/events/${event.id}/attendees`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                View Attendees ({event._count?.bookings})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Admin feedback / Cancellation */}
      {event.status === 'NEEDS_REVISION' && event.rejectionReason && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-5">
          <div>
            <p className="font-bold text-sm text-red-700 dark:text-red-300 mb-1">Admin Feedback</p>
            <p className="text-sm text-red-600 dark:text-red-400">{event.rejectionReason}</p>
          </div>
        </div>
      )}

      {event.status === 'CANCELLED' && event.rejectionReason && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <div>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">Cancellation reason</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{event.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">About This Event</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
          {event.description}
        </p>
      </div>

      {/* Ticket tiers */}
      {event.ticketTiers && event.ticketTiers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Ticket Tiers</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {event.ticketTiers.reduce((s, t) => s + (t.quantitySold || 0), 0)} sold / {event.ticketTiers.reduce((s, t) => s + (t.quantityTotal || 0), 0)} total
            </div>
          </div>

          <div className="space-y-3">
            {event.ticketTiers.map((tier) => {
              const remaining = (tier.quantityTotal || 0) - (tier.quantitySold || 0);
              return (
                <div key={tier.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{tier.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{remaining} remaining · {tier.quantitySold || 0} sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gold">{tier.priceKes === 0 ? 'Free' : `KES ${tier.priceKes.toLocaleString()}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Max Attendees</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">{event.maxAttendees ? String(event.maxAttendees) : 'Unlimited'}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tickets Sold</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">{event.ticketTiers?.reduce((s, t) => s + (t.quantitySold || 0), 0) || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Created</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">{new Date(event.createdAt!).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}
