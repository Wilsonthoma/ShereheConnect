'use client';

import { Plus, Calendar } from 'lucide-react';

export default function OrganizerEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
            My Events
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage all your events in one place.
          </p>
        </div>
        <a
          href="/organizer/events/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </a>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-gradient flex items-center justify-center">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
          You haven&apos;t created any events yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Once you create an event, it will appear here for you to manage.
        </p>
        <a
          href="/organizer/events/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Your First Event
        </a>
      </div>
    </div>
  );
}
