'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, Eye, Users } from 'lucide-react';
import { organizerEventsApi, EventItem } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  NEEDS_REVISION: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  LIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  ONGOING: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  COMPLETED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
};

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await organizerEventsApi.list(token, { limit: 50, q: search || undefined });
        setEvents(res.items);
      } catch (err: any) {
        toast.error('Failed to load events', err?.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
            My Events
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your events, attendees, and ticket sales.
          </p>
        </div>
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          Create Event
        </Link>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <FullPageLoader message="Loading events..." />
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">No events yet</h3>
          <p className="text-sm text-slate-500 mb-6">Create your first event to get started.</p>
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-gradient text-white text-sm font-semibold"
          >
            Create Event
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow"
            >
              {/* Image left */}
              <div className="w-full md:w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                {event.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Calendar className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Details middle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">
                    {event.title}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wide ${STATUS_STYLES[event.status] || STATUS_STYLES.DRAFT}`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  By {event.organizer?.businessName || 'You'}
                </p>

                {/* Clean text-only meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{event.venueName}, {event.county}</span>
                  <span>{new Date(event.startsAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{event.ticketTiers?.length || 0} tier{event.ticketTiers?.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="mt-3 flex items-center text-[0.7rem] text-slate-400">
                  Submitted {new Date(event.createdAt).toLocaleDateString('en-GB')}
                </div>
              </div>

              {/* Actions right */}
              <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <Link
                  href={`/organizer/events/${event.id}/attendees`}
                  className="flex-1 md:w-32 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Attendees
                </Link>
                <Link
                  href={`/organizer/events/${event.id}`}
                  className="flex-1 md:w-32 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-gradient text-white text-xs font-bold hover:shadow-md transition-all"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
