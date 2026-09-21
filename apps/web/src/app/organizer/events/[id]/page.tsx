'use client';

import { useParams } from 'next/navigation';

export default function EventDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Event Details
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Event ID: {id}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Event details coming soon.
        </p>
      </div>
    </div>
  );
}
