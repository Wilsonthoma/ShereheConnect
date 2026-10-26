'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  Send,
  MapPin,
  Calendar,
  Clock,
  Users,
  Ticket as TicketIcon,
  AlertCircle,
  Ban,
  Trash2,
} from 'lucide-react';
import { organizerEventsApi, EventItem } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const STATUS_STYLES: Record<string, string> = {
  DRAFT:
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  PENDING_APPROVAL:
    'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  NEEDS_REVISION:
    'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  APPROVED:
    'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  LIVE: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  ONGOING:
    'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  COMPLETED:
    'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  REJECTED:
    'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  CANCELLED:
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
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

  const handleSubmitForApproval = async () => {
    const token = getToken();
    if (!token || !event) return;
    setBusy('submit');
    try {
      await organizerEventsApi.submit(token, event.id);
      toast.success('Event submitted!', 'Awaiting admin approval.');
      await load();
    } catch (err: any) {
      toast.error(
        'Submit failed',
        err?.message ?? 'Unknown error',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!event) return;
    const reason = window.prompt(
      'Why are you cancelling this event? (Optional)',
      '',
    );
    if (reason === null) return; // user pressed Cancel
    const token = getToken();
    if (!token) return;
    setBusy('cancel');
    try {
      await organizerEventsApi.cancel(token, event.id, reason || undefined);
      toast.success(
        'Event cancelled',
        'Attendees will see it as cancelled.',
      );
      await load();
    } catch (err: any) {
      toast.error(
        'Cancel failed',
        err?.message ?? 'Unknown error',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (
      !window.confirm(
        `Delete "${event.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    const token = getToken();
    if (!token) return;
    setBusy('delete');
    try {
      await organizerEventsApi.delete(token, event.id);
      toast.success('Event deleted', 'The draft was removed.');
      router.push('/organizer/events');
    } catch (err: any) {
      toast.error(
        'Delete failed',
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
        <p className="text-slate-500 dark:text-slate-400">
          Event not found.
        </p>
        <Link
          href="/organizer/events"
          className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-orange font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Events
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

  const canEditOrSubmit =
    event.status === 'DRAFT' || event.status === 'NEEDS_REVISION';
  const canCancel = ['LIVE', 'ONGOING', 'APPROVED'].includes(event.status);
  const canDelete = event.status === 'DRAFT';
  const hasAttendees = (event._count?.bookings ?? 0) > 0;

  const totalQuantity = event.ticketTiers?.reduce(
    (sum, t) => sum + (t.quantityTotal || 0),
    0,
  );
  const totalSold = event.ticketTiers?.reduce(
    (sum, t) => sum + (t.quantitySold || 0),
    0,
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => router.push('/organizer/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Events
      </button>

      {/* Cover + title */}
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
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                STATUS_STYLES[event.status] || STATUS_STYLES.DRAFT
              }`}
            >
              {event.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {event.venueName}, {event.county}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {dateStr}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {timeStr}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {canEditOrSubmit && (
              <>
                <Link
                  href={`/organizer/events/${event.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Event
                </Link>
                <button
                  onClick={handleSubmitForApproval}
                  disabled={busy === 'submit'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:transform-none transition-all"
                >
                  {busy === 'submit' ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {busy === 'submit'
                    ? 'Submitting...'
                    : 'Submit for Approval'}
                </button>
              </>
            )}

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={busy === 'cancel'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-semibold hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                {busy === 'cancel' ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                Cancel Event
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={busy === 'delete'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                {busy === 'delete' ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Draft
              </button>
            )}

            {hasAttendees && (
              <Link
                href={`/organizer/events/${event.id}/attendees`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Users className="w-4 h-4" />
                View Attendees ({event._count?.bookings})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Admin feedback */}
      {event.status === 'NEEDS_REVISION' && event.rejectionReason && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-700 dark:text-red-300 mb-1">
                Admin Feedback
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {event.rejectionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled reason */}
      {event.status === 'CANCELLED' && event.rejectionReason && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Ban className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">
                Cancellation reason
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {event.rejectionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">
          About This Event
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
          {event.description}
        </p>
      </div>

      {/* Ticket tiers */}
      {event.ticketTiers && event.ticketTiers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              Ticket Tiers
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {totalSold} / {totalQuantity} sold
            </div>
          </div>

          <div className="space-y-3">
            {event.ticketTiers.map((tier) => {
              const remaining =
                (tier.quantityTotal || 0) - (tier.quantitySold || 0);
              return (
                <div
                  key={tier.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0">
                      <TicketIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {tier.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {remaining} remaining · {tier.quantitySold || 0}{' '}
                        sold
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-gold">
                      {tier.priceKes === 0
                        ? 'Free'
                        : `KES ${tier.priceKes.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Max Attendees"
          value={
            event.maxAttendees ? String(event.maxAttendees) : 'Unlimited'
          }
        />
        <StatCard
          icon={<TicketIcon className="w-5 h-5" />}
          label="Tickets Sold"
          value={String(totalSold)}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Created"
          value={new Date(event.createdAt!).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-3">
        {icon}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <p className="font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
