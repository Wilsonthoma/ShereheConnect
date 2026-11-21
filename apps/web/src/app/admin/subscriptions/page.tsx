'use client';

import dynamic from 'next/dynamic';

function SubscriptionsPlaceholderCardImpl() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        This section will be built in a future phase.
      </p>
    </div>
  );
}

const SubscriptionsPlaceholderCard = dynamic(
  () => Promise.resolve(SubscriptionsPlaceholderCardImpl),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 animate-pulse" />
    ),
  },
);

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Subscriptions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Coming soon.
        </p>
      </div>
      <SubscriptionsPlaceholderCard />
    </div>
  );
}