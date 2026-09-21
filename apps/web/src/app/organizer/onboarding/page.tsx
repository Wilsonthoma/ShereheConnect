'use client';

export default function OrganizerOnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
        <h2 className="heading-display text-3xl text-slate-800 dark:text-slate-100 mb-4">
          Welcome, Organizer
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Complete your onboarding to start creating events. This will include KYC verification, subscription selection, and payment method setup.
        </p>
        <a
          href="/organizer/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          Continue to Dashboard
        </a>
      </div>
    </div>
  );
}
