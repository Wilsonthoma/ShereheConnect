'use client';

import { Calendar, Ticket, Users, TrendingUp } from 'lucide-react';

const STATS = [
  { label: 'Total Events', value: '0', icon: Calendar, trend: '+0 this month' },
  { label: 'Tickets Sold', value: '0', icon: Ticket, trend: '+0 this week' },
  { label: 'Attendees', value: '0', icon: Users, trend: 'No attendees yet' },
  { label: 'Revenue', value: 'KES 0', icon: TrendingUp, trend: 'No revenue yet' },
];

export default function OrganizerDashboardPage() {
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
          No events yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Create your first event and start selling tickets across Kenya.
        </p>
        <a
          href="/organizer/events/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          Create Event
        </a>
      </div>
    </div>
  );
}
