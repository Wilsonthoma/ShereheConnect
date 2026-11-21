'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Calendar, Ticket, Heart, Bell } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui';

const ProtectedRoute = dynamic(
  () => import('@/components/auth').then((mod) => mod.ProtectedRoute),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-light dark:bg-slate-950 py-10 md:py-16">
        <div className="container-fluid space-y-6 animate-pulse">
          <div className="h-9 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        </div>
      </main>
    ),
  },
);

const STAT_CARDS = [
  { label: 'My Tickets', value: '0', icon: Ticket, href: '/tickets' },
  { label: 'Bookings', value: '0', icon: Calendar, href: '/bookings' },
  { label: 'Wishlist', value: '0', icon: Heart, href: '/wishlist' },
  { label: 'Notifications', value: '0', icon: Bell, href: '/notifications' },
] as const;

function DashboardStatsGridImpl() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {STAT_CARDS.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 p-5 hover:shadow-card-hover hover:-translate-y-1 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-dark dark:text-slate-100 mb-1">
              {stat.value}
            </div>
            <div className="text-xs font-medium text-gray uppercase tracking-wide">
              {stat.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const DashboardStatsGrid = dynamic(
  () => Promise.resolve(DashboardStatsGridImpl),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-border dark:border-slate-800 p-5 animate-pulse"
          />
        ))}
      </div>
    ),
  },
);

function DashboardContent() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 py-10 md:py-16">
      <div className="container-fluid">
        <div className="mb-8">
          <h1 className="heading-display heading-md text-brand-gradient mb-2">
            Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-gray">
            Here&apos;s what&apos;s happening with your events.
          </p>
        </div>

        <DashboardStatsGrid />

        {/* Empty state CTA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-lg text-dark dark:text-slate-100 mb-2">
            Discover your first event
          </h3>
          <p className="text-sm text-gray mb-6 max-w-md mx-auto">
            Browse events across Kenya and book your next experience.
          </p>
          <Link href="/events" className="inline-block">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="gap-2 px-6 py-3 rounded-full bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none text-sm font-semibold"
            >
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}