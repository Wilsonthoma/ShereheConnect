'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  adminEventsApi,
  EventItem,
  EventStatus,
} from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const TABS: { key: EventStatus | 'ALL'; label: string; icon: any }[] = [
  { key: 'PENDING_APPROVAL', label: 'Pending', icon: Clock },
  { key: 'LIVE', label: 'Live', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Rejected', icon: XCircle },
  { key: 'ALL', label: 'All', icon: Calendar },
];

const STATUS_BADGE: Record<string, string> = {
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

export default function AdminEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus =
    (searchParams.get('status') as EventStatus | 'ALL') ||
    'PENDING_APPROVAL';
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<EventStatus | 'ALL'>(
    initialStatus,
  );
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      try {
        const res = await adminEventsApi.list(token, {
          status: activeTab === 'ALL' ? undefined : activeTab,
          q: search || undefined,
        });
        setEvents(res.items);
      } catch (err: any) {
        toast.error(
          'Failed to load events',
          err?.message ?? 'Unknown error',
        );
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [activeTab, search]);

  const handleTabClick = (key: EventStatus | 'ALL') => {
    setActiveTab(key);
    router.replace(
      key === 'ALL' ? '/admin/events' : `/admin/events?status=${key}`,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-3xl text-slate-900 dark:text-white mb-1">
          Events
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review and manage all events on the platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabClick(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-1 ${
              activeTab === key
                ? 'text-gold border-gold'
                : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search title or venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {/* Content */}
      {loading ? (
        <FullPageLoader message="Loading events..." />
      ) : events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No events in this view.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Event
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Organizer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const date = new Date(event.startsAt);
                  const dateStr = date.toLocaleDateString(
                    language === 'sw' ? 'sw-KE' : 'en-KE',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    },
                  );

                  return (
                    <tr
                      key={event.id}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
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
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {event.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {event.venueName}, {event.county}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {event.organizer?.businessName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-wide ${
                            STATUS_BADGE[event.status] ??
                            STATUS_BADGE.DRAFT
                          }`}
                        >
                          {event.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
