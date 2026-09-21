'use client';

import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Payments
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View all M-Pesa transactions and payment history.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-gradient flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">
          No transactions yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Payments will appear here once attendees start booking.
        </p>
      </div>
    </div>
  );
}
