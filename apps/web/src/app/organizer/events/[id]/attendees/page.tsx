'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Ticket as TicketIcon,
  Search,
  AlertCircle,
} from 'lucide-react';
import {
  organizerEventsApi,
  AttendeeListItem,
} from '@/lib/eventsApi';
import { getToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { FullPageLoader } from '@/components/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  PAYMENT_RECEIVED:
    'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  CONFIRMED:
    'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  CHECKED_IN:
    'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300',
  CANCELLED:
    'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  FAILED:
    'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
  EXPIRED:
    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const { language } = useLanguage();

  const [items, setItems] = useState<AttendeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = getToken();
      if (!token || !eventId) return;
      try {
        const res = await organizerEventsApi.attendees(token, eventId);
        setItems(res.items);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load attendees');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.attendee.fullName.toLowerCase().includes(q) ||
      item.attendee.email.toLowerCase().includes(q) ||
      item.attendee.phone.toLowerCase().includes(q) ||
      item.reference.toLowerCase().includes(q) ||
      (item.ticket?.ticketCode ?? '').toLowerCase().includes(q)
    );
  });

  const confirmedCount = items.filter((i) =>
    ['CONFIRMED', 'PAYMENT_RECEIVED', 'CHECKED_IN'].includes(i.status),
  ).length;
  const totalRevenue = items
    .filter((i) =>
      ['CONFIRMED', 'PAYMENT_RECEIVED', 'CHECKED_IN'].includes(i.status),
    )
    .reduce((s, i) => s + i.totalAmountKes, 0);

  if (loading) {
    return <FullPageLoader message="Loading attendees..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <button
        onClick={() => router.push(`/organizer/events/${eventId}`)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Attendees
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Everyone who has booked or paid for this event.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Bookings"
          value={String(items.length)}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Confirmed"
          value={String(confirmedCount)}
        />
        <StatCard
          icon={<TicketIcon className="w-5 h-5" />}
          label="Total Tickets"
          value={String(items.reduce((s, i) => s + i.quantity, 0))}
        />
        <StatCard
          icon={<TicketIcon className="w-5 h-5" />}
          label="Revenue"
          value={`KES ${totalRevenue.toLocaleString()}`}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search name, email, phone, reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
            No attendees yet
          </h3>
          <p className="text-sm text-slate-500">
            Bookings will appear here as soon as someone reserves a ticket.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Attendee
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Tier
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Qty
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Ticket
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const date = new Date(b.createdAt);
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
                      key={b.id}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {b.attendee.fullName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {b.attendee.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {b.attendee.phone}
                        </p>
                        <p className="text-[0.65rem] text-slate-400 mt-1">
                          Ref: {b.reference} · {dateStr}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {b.tier.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {b.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gold">
                        KES {b.totalAmountKes.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase tracking-wide ${
                            STATUS_STYLES[b.status] ||
                            STATUS_STYLES.PENDING
                          }`}
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.ticket ? (
                          <div>
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                              {b.ticket.ticketCode}
                            </p>
                            <p className="text-[0.65rem] text-emerald-500 font-semibold uppercase">
                              {b.ticket.status}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
