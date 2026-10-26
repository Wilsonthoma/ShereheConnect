'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { adminEventsApi, EventItem } from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';

export default function AdminDashboardPage() {
  const [pending, setPending] = useState<EventItem[]>([]);
  const [live, setLive] = useState<EventItem[]>([]);
  const [rejected, setRejected] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const [p, l, r] = await Promise.all([
          adminEventsApi.list(token, { status: 'PENDING_APPROVAL' }),
          adminEventsApi.list(token, { status: 'LIVE' }),
          adminEventsApi.list(token, { status: 'REJECTED' }),
        ]);
        setPending(p.items);
        setLive(l.items);
        setRejected(r.items);
      } catch (err: any) {
        toast.error(
          'Failed to load dashboard',
          err?.message ?? 'Unknown error',
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <FullPageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-display text-3xl text-slate-900 dark:text-white mb-1">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Overview of the events pipeline.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending Approval"
          value={pending.length}
          color="amber"
          href="/admin/events?status=PENDING_APPROVAL"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Live Events"
          value={live.length}
          color="emerald"
          href="/admin/events?status=LIVE"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Rejected"
          value={rejected.length}
          color="red"
          href="/admin/events?status=REJECTED"
        />
      </div>

      {/* Pending queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            Awaiting Review
          </h2>
          <Link
            href="/admin/events?status=PENDING_APPROVAL"
            className="text-sm text-gold hover:text-orange font-semibold inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              All caught up — nothing pending.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-gold/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {event.organizer?.businessName} · {event.county}
                  </p>
                </div>
                <span className="text-xs font-semibold text-gold">
                  Review →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'amber' | 'emerald' | 'red';
  href: string;
}) {
  const colors = {
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}
      >
        {icon}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </Link>
  );
}
