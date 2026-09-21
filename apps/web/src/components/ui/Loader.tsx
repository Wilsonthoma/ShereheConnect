'use client';

import { Loader2 } from 'lucide-react';

/* ============================================
   FULL PAGE LOADER
   For initial page loads, auth checks, role guards
   ============================================ */

interface FullPageLoaderProps {
  message?: string;
  subMessage?: string;
}

export function FullPageLoader({ message = 'Loading...', subMessage }: FullPageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-brand-gradient blur-xl opacity-40 animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg">
          <span
            className="text-white text-2xl font-bold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            S
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-gold" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {subMessage && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{subMessage}</p>
      )}
    </div>
  );
}

/* ============================================
   SECTION LOADER
   For smaller in-page loading states
   ============================================ */

interface SectionLoaderProps {
  message?: string;
  minHeight?: string;
}

export function SectionLoader({ message = 'Loading...', minHeight = '300px' }: SectionLoaderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight }}
    >
      <Loader2 className="w-8 h-8 animate-spin text-gold mb-3" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

/* ============================================
   INLINE SPINNER
   For buttons, small inline states
   ============================================ */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeMap = {
    sm: 'w-3.5 h-3.5 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-[3px]',
  };
  return (
    <span
      className={`inline-block rounded-full border-current border-t-transparent animate-spin ${sizeMap[size]} ${className}`}
    />
  );
}

/* ============================================
   PAGE SKELETON
   For loading pages with a known layout
   ============================================ */

interface PageSkeletonProps {
  variant?: 'dashboard' | 'list' | 'form';
}

export function PageSkeleton({ variant = 'dashboard' }: PageSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="space-y-6 max-w-lg">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
        <div className="h-11 w-32 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
    </div>
  );
}
