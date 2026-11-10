'use client';

import { useEffect, useState } from 'react';
import { Check, Gem } from 'lucide-react';
import {
  organizerApi,
  SubscriptionOverview,
  SubscriptionPlan,
} from '@/lib/organizerApi';
import { FullPageLoader } from '@/components/ui';
import { toast } from '@/lib/toast';

export default function SubscriptionPage() {
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizerApi
      .getSubscription()
      .then(setOverview)
      .catch((error) => toast.error('Could not load plans', error?.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader message="Loading subscription..." />;

  if (!overview) {
    return <p className="py-12 text-center text-sm text-slate-500">Subscription information is unavailable.</p>;
  }

  const activePlan = overview.activeSubscription?.plan;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Subscription
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your plan and billing.
        </p>
      </div>

      {activePlan && (
        <section className="flex flex-wrap items-center justify-between gap-5 border-y border-slate-200 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Gem className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Current plan</p>
              <h3 className="font-bold text-slate-900 dark:text-white">{activePlan.name}</h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {overview.eventsThisMonth} of {formatLimit(activePlan.maxEventsPerMonth)} events used this month
          </p>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {overview.plans.map((plan) => (
          <PlanOption
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === activePlan?.id}
          />
        ))}
      </div>

      <p className="border-l-2 border-amber-500 pl-4 text-sm text-slate-600 dark:text-slate-300">
        Paid plan checkout is not available yet. Your plan will not change until a payment is confirmed.
      </p>
    </div>
  );
}

function PlanOption({
  plan,
  isCurrent,
}: {
  plan: SubscriptionPlan;
  isCurrent: boolean;
}) {
  return (
    <article className="flex flex-col border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {plan.priceKes === 0
              ? 'Free'
              : `KES ${plan.priceKes.toLocaleString()} / ${plan.billingInterval.toLowerCase()}`}
          </p>
        </div>
        {isCurrent && <Check className="h-5 w-5 text-emerald-600" aria-label="Current plan" />}
      </div>
      <ul className="my-5 flex-1 space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <li>{formatLimit(plan.maxEventsPerMonth)} events per month</li>
        <li>{formatLimit(plan.maxAttendeesEvent)} attendees per event</li>
      </ul>
      <button
        type="button"
        disabled
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700"
      >
        {isCurrent ? 'Current plan' : 'Upgrade unavailable'}
      </button>
    </article>
  );
}

function formatLimit(limit: number | null): string {
  return limit === null ? 'Unlimited' : String(limit);
}
