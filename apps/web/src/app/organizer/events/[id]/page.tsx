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
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  organizerEventsApi,
  AttendeeListItem,
} from '@/lib/eventsApi';
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

  const [event, setEvent] = useState<any>(null);
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
  }, [id]);

  if (loading) return <FullPageLoader message="Loading event..." />;
  if (!event) return <div className="p-20 text-center">Event not found</div>;

  const startDate = new Date(event.startsAt);
  const locale = language === 'sw' ? 'sw-KE' : 'en-KE';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <button
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
              <Calendar className="w-4 h-4" /> {startDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0 ${STATUS_STYLES[event.status] || STATUS_STYLES.DRAFT}`}>
          {event.status.replace('_', ' ')}
        </span>
      </div>

      {/* Warning Banners */}
      {event.status === 'NEEDS_REVISION' && event.rejectionReason && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-700 dark:text-red-300 mb-1">Admin Feedback</p>
            <p className="text-sm text-red-600 dark:text-red-400">{event.rejectionReason}</p>
          </div>
        </div>
      )}

      {event.status === 'CANCELLED' && event.rejectionReason && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">Cancellation reason</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{event.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Two Column Layout: Main Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        
        {/* Main Content */}
        <div className="space-y-6 min-w-0">
          {/* Compact Image */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[240px]">
            <EventImage
              src={event.coverImageUrl}
              alt={event.title}
              variant="banner"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">About This Event</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Ticket Tiers */}
          {event.ticketTiers && event.ticketTiers.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Ticket Tiers</h2>
                <div className="text-xs text-slate-500">
                  {event.ticketTiers.reduce((s: number, t: any) => s + (t.quantitySold || 0), 0)} sold / {event.ticketTiers.reduce((s: number, t: any) => s + (t.quantityTotal || 0), 0)} total
                </div>
              </div>
              <div className="space-y-3">
                {event.ticketTiers.map((tier: any) => {
                  const remaining = (tier.quantityTotal || 0) - (tier.quantitySold || 0);
                  return (
                    <div key={tier.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{tier.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{remaining} remaining</p>
                      </div>
                      <p className="font-bold text-gold">
                        {tier.priceKes === 0 ? 'Free' : `KES ${tier.priceKes.toLocaleString()}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Stats Block */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Max Attendees</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{event.maxAttendees ? String(event.maxAttendees) : 'Unlimited'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tickets Sold</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {event.ticketTiers?.reduce((s: number, t: any) => s + (t.quantitySold || 0), 0) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Created</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {new Date(event.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Block */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">Actions</h3>
            
            {['DRAFT', 'NEEDS_REVISION'].includes(event.status) && (
              <>
                <Link
                  href={`/organizer/events/${event.id}/edit`}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit Event
                </Link>
                <button
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  Submit for Approval
                </button>
              </>
            )}

            {['LIVE', 'ONGOING', 'APPROVED'].includes(event.status) && (
              <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-semibold hover:bg-amber-500 hover:text-white transition-colors">
                Cancel Event
              </button>
            )}

            {event.status === 'DRAFT' && (
              <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Draft
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
