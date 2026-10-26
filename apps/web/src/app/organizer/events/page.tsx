'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Eye,
  Edit3,
  Send,
  Calendar,
  Copy,
  Trash2,
} from 'lucide-react';
import { organizerEventsApi, EventItem, EventStatus } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const STATUS_TABS: { key: EventStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_APPROVAL', label: 'Pending' },
  { key: 'NEEDS_REVISION', label: 'Needs Changes' },
  { key: 'LIVE', label: 'Live' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function OrganizerEventsPage() {
  const { t } = useLanguage();

  const tr = (key: string, fallback: string): string => {
    const v = t(key as any);
    return v === key ? fallback : v;
  };

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EventStatus | 'ALL'>('ALL');
  const [busy, setBusy] = useState<string | null>(null);

  const fetchEvents = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await organizerEventsApi.list(
        token,
        activeTab === 'ALL' ? undefined : { status: activeTab },
      );
      setEvents(res.items);
    } catch (err: any) {
      toast.error(
        tr('organizer.events.loadFailed', 'Failed to load events'),
        err?.message ?? 'Unknown error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSubmit = async (eventId: string) => {
    const token = getToken();
    if (!token) return;
    setBusy(eventId);
    try {
      await organizerEventsApi.submit(token, eventId);
      toast.success(
        tr('organizer.events.submittedTitle', 'Event submitted!'),
        tr('organizer.events.submittedBody', 'Awaiting admin approval.'),
      );
      fetchEvents();
    } catch (err: any) {
      toast.error(
        tr('organizer.events.submitFailed', 'Submit failed'),
        err?.message ?? 'Unknown error',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDuplicate = async (eventId: string) => {
    const token = getToken();
    if (!token) return;
    setBusy(eventId);
    try {
      const copy = await organizerEventsApi.duplicate(token, eventId);
      toast.success(
        tr('organizer.events.duplicatedTitle', 'Event duplicated'),
        tr(
          'organizer.events.duplicatedBody',
          'A new draft copy has been created.',
        ),
      );
      fetchEvents();
      // Optional: navigate to the new copy
      // window.location.href = `/organizer/events/${copy.id}/edit`;
    } catch (err: any) {
      toast.error(
        tr('organizer.events.duplicateFailed', 'Duplicate failed'),
        err?.message ?? 'Unknown error',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (eventId: string, title: string) => {
    if (
      !window.confirm(
        tr(
          'organizer.events.deleteConfirm',
          `Delete "${title}"? This cannot be undone.`,
        ),
      )
    ) {
      return;
    }
    const token = getToken();
    if (!token) return;
    setBusy(eventId);
    try {
      await organizerEventsApi.delete(token, eventId);
      toast.success(
        tr('organizer.events.deletedTitle', 'Event deleted'),
        tr('organizer.events.deletedBody', 'The draft was removed.'),
      );
      fetchEvents();
    } catch (err: any) {
      toast.error(
        tr('organizer.events.deleteFailed', 'Delete failed'),
        err?.message ?? 'Unknown error',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
            {tr('organizer.events.title', 'My Events')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tr(
              'organizer.events.subtitle',
              'Create, manage, and track your events.',
            )}
          </p>
        </div>
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          {tr('organizer.events.create', 'Create Event')}
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm font-semibold transition-all border-b-2 -mb-1 ${
              activeTab === tab.key
                ? 'text-gold border-gold'
                : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <FullPageLoader
          message={tr('organizer.events.loading', 'Loading events...')}
        />
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
            {activeTab !== 'ALL'
              ? tr(
                  'organizer.events.emptyFilteredTitle',
                  'No events in this status',
                )
              : tr('organizer.events.emptyTitle', 'No events yet')}
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            {activeTab === 'ALL'
              ? tr(
                  'organizer.events.emptyBody',
                  'Create your first event to get started.',
                )
              : tr(
                  'organizer.events.emptyFilteredBody',
                  'Try a different tab to see other events.',
                )}
          </p>
          {activeTab === 'ALL' && (
            <Link
              href="/organizer/events/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              {tr(
                'organizer.events.createFirst',
                'Create Your First Event',
              )}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              onSubmit={handleSubmit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              isBusy={busy === event.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({
  event,
  onSubmit,
  onDuplicate,
  onDelete,
  isBusy,
}: {
  event: EventItem;
  onSubmit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  isBusy: boolean;
}) {
  const { language } = useLanguage();

  const date = new Date(event.startsAt);
  const dateStr = date.toLocaleDateString(
    language === 'sw' ? 'sw-KE' : 'en-KE',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );

  const statusColors: Record<string, string> = {
    DRAFT:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    PENDING_APPROVAL:
      'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    NEEDS_REVISION:
      'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
    LIVE: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    ONGOING:
      'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    COMPLETED:
      'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
    CANCELLED:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    REJECTED:
      'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  };

  const canEdit =
    event.status === 'DRAFT' || event.status === 'NEEDS_REVISION';
  const canDelete = event.status === 'DRAFT';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center gap-4">
      {/* Thumbnail */}
      <div className="w-full md:w-24 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold to-orange" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
            {event.title}
          </h3>
          <span
            className={`px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-wide shrink-0 ${
              statusColors[event.status] || statusColors.DRAFT
            }`}
          >
            {event.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>📍 {event.venueName}, {event.county}</span>
          <span>📅 {dateStr}</span>
          {event.ticketTiers && event.ticketTiers.length > 0 && (
            <span>
              🎟️ {event.ticketTiers.length} tier
              {event.ticketTiers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {event.status === 'NEEDS_REVISION' && event.rejectionReason && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded px-3 py-2">
            <strong>Admin feedback:</strong> {event.rejectionReason}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link
          href={`/organizer/events/${event.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>

        {canEdit && (
          <>
            <Link
              href={`/organizer/events/${event.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Link>
            <button
              onClick={() => onSubmit(event.id)}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-gradient text-white text-xs font-semibold hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:transform-none transition-all"
            >
              {isBusy ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isBusy ? 'Submitting...' : 'Submit'}
            </button>
          </>
        )}

        <button
          onClick={() => onDuplicate(event.id)}
          disabled={isBusy}
          title="Duplicate event"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete(event.id, event.title)}
            disabled={isBusy}
            title="Delete draft"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
