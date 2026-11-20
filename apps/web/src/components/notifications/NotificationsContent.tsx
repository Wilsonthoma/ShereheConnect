'use client';

export function NotificationsContent() {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-6 space-y-2">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        Notifications
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        You have no new notifications right now.
      </p>
    </section>
  );
}
