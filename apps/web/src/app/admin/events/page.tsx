'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { adminEventsApi, EventItem, EventStatus } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader, EventImage } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const STATUS_TABS: { key: EventStatus | 'ALL'; label: string }[] = [
  { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { key: 'LIVE', label: 'Live' },
  { key: 'NEEDS_REVISION', label: 'Needs Revision' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All Events' },
];

export default function AdminEventsPage() {
  const { language } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<EventStatus | 'ALL'>('PENDING_APPROVAL');
  const [counts, setCounts] = useState({ pending: 0 });

  const fetchEvents = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminEventsApi.list(
        token,
        activeTab === 'ALL' ? undefined : { status: activeTab },
      );
      setEvents(res.items);
      if (activeTab === 'PENDING_APPROVAL') {
        setCounts((c) => ({ ...c, pending: res.total }));
      }
    } catch (err: any) {
      toast.error('Failed to load events', err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
          Event Management
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review pending events, monitor live events, and manage the platform.
        </p>
      </div>

      {/* Tabs */}
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
            {tab.key === 'PENDING_APPROVAL' && counts.pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[0.6rem]">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <FullPageLoader message="Loading events..." />
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
            {activeTab === 'PENDING_APPROVAL'
              ? 'All caught up!'
              : 'No events in this category'}
          </h3>
          <p className="text-sm text-slate-500">
            {activeTab === 'PENDING_APPROVAL'
              ? 'There are no events waiting for approval.'
              : 'Try a different tab to see other events.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <AdminEventRow
              key={event.id}
              event={event}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminEventRow({
  event,
  language,
}: {
  event: EventItem;
  language: string;
}) {
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
    COMPLETED:
      'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
    REJECTED:
      'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Thumbnail */}
        <div className="shrink-0">
          <EventImage
            src={event.coverImageUrl}
            alt={event.title}
            variant="thumbnail"
            className="w-20 h-20 sm:w-24 sm:h-24"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
              {event.title}
            </h3>
            <span
              className={`px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-wide shrink-0 ${
                statusColors[event.status] || statusColors.DRAFT
              }`}
            >
              {event.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            By <strong>{event.organizer?.businessName || 'Unknown organizer'}</strong>
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>📍 {event.venueName}, {event.county}</span>
            <span>📅 {dateStr}</span>
            {event.ticketTiers && event.ticketTiers.length > 0 && (
              <span>
                🎟️ {event.ticketTiers.length} tier
                {event.ticketTiers.length !== 1 ? 's' : ''}
              </span>
            )}
            {event.submittedAt && (
              <span>
                🕐 Submitted{' '}
                {new Date(event.submittedAt).toLocaleDateString(
                  language === 'sw' ? 'sw-KE' : 'en-KE',
                )}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0">
          <Link
            href={`/admin/events/${event.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-gradient text-white text-xs font-semibold hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Review
          </Link>
        </div>
      </div>
    </div>
  );
}
