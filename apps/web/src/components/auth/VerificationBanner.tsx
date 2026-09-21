'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, X } from 'lucide-react';
import { getUser } from '@/lib/auth';

const DISMISS_KEY = 'sherehe-verify-banner-dismissed';

export function VerificationBanner() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    // Only show for organizers (or any user with emailVerified === false)
    const needsVerification = user.emailVerified === false;
    if (!needsVerification) return;

    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed === '1') return;

    setEmail(user.email);
    setShow(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50">
      <div className="container-fluid py-3 flex items-start md:items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 md:mt-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-amber-900 dark:text-amber-200">
            Verify your email
          </span>
          <span className="text-amber-800 dark:text-amber-300/80 ml-2">
            We sent a 6-digit code to <strong>{email}</strong>. Verify to activate
            your organizer account.
          </span>
        </div>
        <Link
          href={`/verify-otp?email=${encodeURIComponent(email)}`}
          className="shrink-0 px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
        >
          Verify now
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
