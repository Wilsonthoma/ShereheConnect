'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Ticket,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { organizerApi, OrganizerProfile } from '@/lib/organizerApi';

const STATS = [
  { label: 'Total Events', value: '0', icon: Calendar, trend: '+0 this month' },
  { label: 'Tickets Sold', value: '0', icon: Ticket, trend: '+0 this week' },
  { label: 'Attendees', value: '0', icon: Users, trend: 'No attendees yet' },
  { label: 'Revenue', value: 'KES 0', icon: TrendingUp, trend: 'No revenue yet' },
];

export default function OrganizerDashboardPage() {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    organizerApi
      .getProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const kycStatus = profile?.kycStatus;
  const needsVerification = kycStatus !== 'VERIFIED';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Welcome to your dashboard
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here&apos;s an overview of your events and performance.
        </p>
      </div>

      {/* Verification banner */}
      {!loadingProfile && needsVerification && (
        <div
          className={`rounded-2xl p-5 border ${
            kycStatus === 'PENDING'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
          }`}
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                kycStatus === 'PENDING'
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
              }`}
            >
              {kycStatus === 'PENDING' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-bold text-base mb-1 ${
                  kycStatus === 'PENDING'
                    ? 'text-blue-900 dark:text-blue-200'
                    : 'text-amber-900 dark:text-amber-200'
                }`}
              >
                {kycStatus === 'NEEDS_REVISION'
                  ? 'Your submission needs changes'
                  : kycStatus === 'REJECTED'
                  ? 'Your verification was rejected'
                  : kycStatus === 'PENDING'
                  ? 'Verification pending review'
                  : kycStatus === 'SUSPENDED'
                  ? 'Account suspended'
                  : 'Complete your verification to start'}
              </h3>
              <p
                className={`text-sm mb-3 ${
                  kycStatus === 'PENDING'
                    ? 'text-blue-800 dark:text-blue-300/90'
                    : 'text-amber-800 dark:text-amber-300/90'
                }`}
              >
                {kycStatus === 'PENDING'
                  ? 'Your details have been submitted and are being reviewed by our team. You will be notified via email once approved.'
                  : 'Submit your business information and payment method so an admin can verify your account. Only then can you create events.'}
              </p>
              {profile?.kycNotes && kycStatus === 'NEEDS_REVISION' && (
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  <strong>Admin note:</strong> {profile.kycNotes}
                </p>
              )}

              {/* Only show button if they need to take action */}
              {kycStatus !== 'PENDING' && kycStatus !== 'SUSPENDED' && (
                <Link
                  href="/organizer/onboarding"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  {kycStatus === 'NEEDS_REVISION'
                    ? 'Update submission'
                    : kycStatus === 'REJECTED'
                    ? 'Resubmit'
                    : 'Start onboarding'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingProfile && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {stat.label}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {stat.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-gradient flex items-center justify-center">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
          {kycStatus === 'VERIFIED'
            ? 'No events yet'
            : 'Event creation unlocks after verification'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {kycStatus === 'VERIFIED'
            ? 'Create your first event and start selling tickets across Kenya.'
            : 'Once your organizer account is verified by an admin, you can start creating events.'}
        </p>
        {kycStatus === 'VERIFIED' ? (
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Create Event
          </Link>
        ) : kycStatus !== 'PENDING' && kycStatus !== 'SUSPENDED' ? (
          <Link
            href="/organizer/onboarding"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Go to Onboarding
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
