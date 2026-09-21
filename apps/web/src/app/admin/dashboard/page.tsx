'use client';

import { Users, PartyPopper, CreditCard, BadgeCheck, TrendingUp, Scale } from 'lucide-react';

const STATS = [
  { label: 'Total Users', value: '0', icon: Users, trend: '+0 this week' },
  { label: 'Active Events', value: '0', icon: PartyPopper, trend: '+0 this week' },
  { label: 'Pending KYC', value: '0', icon: BadgeCheck, trend: 'Needs review' },
  { label: 'Revenue (MTD)', value: 'KES 0', icon: TrendingUp, trend: 'Month to date' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Admin Overview
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Platform metrics and pending actions at a glance.
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
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-white" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
            Pending KYC Reviews
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No pending KYC applications.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">
            Events Awaiting Approval
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No events awaiting approval.
          </p>
        </div>
      </div>
    </div>
  );
}
