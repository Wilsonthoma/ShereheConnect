'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  AlertCircle,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { organizerEventsApi } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader, EventImage } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface EventTierView {
  id: string;
  name: string;
  priceKes: number;
  quantityTotal: number;
  quantitySold?: number;
  quantityReserved?: number;
  isGroupSubgroup?: boolean;
  groupCategory?: string | null;
  occupantsPerUnit?: number | null;
  pricingMode?: 'PER_OCCUPANT' | 'BUNDLE_FIXED' | null;
}

interface OrganizerEventDetail {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  venueName: string;
  county: string;
  startsAt: string;
  status: string;
  rejectionReason?: string | null;
  maxAttendees?: number | null;
  createdAt: string;
  ticketTiers?: EventTierView[];
  _count?: {
    bookings?: number;
  };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  PENDING_APPROVAL: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  NEEDS_REVISION: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  APPROVED: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  LIVE: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  ONGOING: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  COMPLETED: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  CANCELLED: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  REJECTED: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
};

export default function OrganizerEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { language } = useLanguage();

  const [event, setEvent] = useState<OrganizerEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!id) {
      setLoading(false);
      return;
    }
    if (!token) {
      setLoading(false);
      router.replace(`/login?next=${encodeURIComponent(`/organizer/events/${id}`)}`);
      return;
    }
    try {
      const data = (await organizerEventsApi.detail(
        token,
        id,
      )) as OrganizerEventDetail;
      setEvent(data);
    } catch (err: unknown) {
      toast.error(
        'Failed to load event',
        err instanceof Error ? err.message : 'Unknown error',
      );
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmitForApproval = async () => {
    const token = getToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/organizer/events/${id}`)}`);
      return;
    }

    setBusy('submit');
    try {
      await organizerEventsApi.submit(token, id);
      toast.success('Event submitted for approval');
      await load();
    } catch (err: unknown) {
      toast.error(
        'Could not submit event',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleCancelEvent = async () => {
    if (!event || !window.confirm(`Cancel "${event.title}"?`)) return;
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setBusy('cancel');
    try {
      await organizerEventsApi.cancel(token, id, 'Cancelled by organizer');
      toast.success('Event cancelled');
      await load();
    } catch (err: unknown) {
      toast.error(
        'Could not cancel event',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteDraft = async () => {
    if (
      !event ||
      !window.confirm(`Delete draft "${event.title}"? This cannot be undone.`)
    ) {
      return;
    }
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setBusy('delete');
    try {
      await organizerEventsApi.delete(token, id);
      toast.success('Draft deleted');
      router.replace('/organizer/events');
    } catch (err: unknown) {
      toast.error(
        'Could not delete draft',
        err instanceof Error ? err.message : 'Please try again.',
      );
      setBusy(null);
    }
  };

  if (loading) return <FullPageLoader message="Loading event..." />;
  if (!event) return <div className="p-20 text-center">Event not found</div>;

  const startDate = new Date(event.startsAt);
  const locale = language === 'sw' ? 'sw-KE' : 'en-KE';
  const tiers = event.ticketTiers ?? [];
  const totalSold = tiers.reduce((s, t) => s + (t.quantitySold || 0), 0);
  const totalCapacity = tiers.reduce((s, t) => s + (t.quantityTotal || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <button
        type="button"
        onClick={() => router.push('/organizer/events')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Events
      </button>

      {/* Title + Status */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {event.venueName}, {event.county}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />{' '}
              {startDate.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <span
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0 ${
            STATUS_STYLES[event.status] || STATUS_STYLES.DRAFT
          }`}
        >
          {event.status.replace('_', ' ')}
        </span>
      </div>

      {/* Warning Banners */}
      {event.status === 'NEEDS_REVISION' && event.rejectionReason && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex gap-3">
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
      )}

      {event.status === 'CANCELLED' && event.rejectionReason && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">
              Cancellation reason
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {event.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {/* Two Column Layout: Main Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Main Content */}
        <div className="space-y-6 min-w-0">
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[240px]">
            <EventImage
              src={event.coverImageUrl ?? undefined}
              alt={event.title}
              variant="banner"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">
              About This Event
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {tiers.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  Ticket Tiers &amp; Subgroups
                </h2>
                <div className="text-xs text-slate-500">
                  {totalSold} sold / {totalCapacity} total
                </div>
              </div>
              <div className="space-y-3">
                {tiers.map((tier) => {
                  const sold = tier.quantitySold || 0;
                  const reserved = tier.quantityReserved || 0;
                  const remaining = Math.max(
                    0,
                    (tier.quantityTotal || 0) - sold - reserved,
                  );
                  const isGroup = Boolean(tier.isGroupSubgroup);
                  const occupants = Math.max(1, Number(tier.occupantsPerUnit || 1));
                  const pricingLabel = isGroup
                    ? tier.pricingMode === 'PER_OCCUPANT'
                      ? 'per person'
                      : `fixed package (${occupants} guests)`
                    : 'per ticket';

                  return (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-800 dark:text-slate-100">
                            {tier.name}
                          </p>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                            {isGroup
                              ? `${tier.groupCategory || 'GROUP'} • ${occupants}/unit`
                              : 'INDIVIDUAL'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {remaining} remaining
                          {reserved > 0 ? ` (${reserved} held)` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gold">
                          {tier.priceKes === 0
                            ? 'Free'
                            : `KES ${tier.priceKes.toLocaleString('en-KE')}`}
                        </p>
                        <p className="text-[11px] text-slate-400">{pricingLabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4">
              Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Max Attendees
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {event.maxAttendees ? String(event.maxAttendees) : 'Unlimited'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tickets Sold
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {totalSold}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Created
                </span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {new Date(event.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">
              Actions
            </h3>

            {['DRAFT', 'NEEDS_REVISION'].includes(event.status) && (
              <>
                <Link
                  href={`/organizer/events/${event.id}/edit`}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit Event
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSubmitForApproval()}
                  disabled={busy !== null}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {busy === 'submit' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {busy === 'submit' ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </>
            )}

            {['LIVE', 'ONGOING', 'APPROVED'].includes(event.status) && (
              <button
                type="button"
                onClick={() => void handleCancelEvent()}
                disabled={busy !== null}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-semibold hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                {busy === 'cancel' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {busy === 'cancel' ? 'Cancelling...' : 'Cancel Event'}
              </button>
            )}

            {event.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => void handleDeleteDraft()}
                disabled={busy !== null}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                {busy === 'delete' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {busy === 'delete' ? 'Deleting...' : 'Delete Draft'}
              </button>
            )}

            <Link
              href={`/organizer/events/${event.id}/attendees`}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-500 hover:text-white transition-colors mt-2"
            >
              <Users className="w-4 h-4" /> View Attendees ({event._count?.bookings || 0})
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}