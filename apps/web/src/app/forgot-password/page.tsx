'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { extendedAuthApi, ApiException } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function ForgotPasswordForm() {
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // ============================================
  // Local translation helper with English fallback.
  // Works even before you add auth.forgot.* keys
  // to translations.ts.
  // ============================================
  const tr = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(tr('auth.forgot.error.emailRequired', 'Please enter your email'));
      return;
    }

    setIsLoading(true);
    try {
      await extendedAuthApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : tr('auth.forgot.error.generic', 'Something went wrong'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // SENT STATE
  // ============================================
  if (sent) {
    return (
      <AuthLayout
        title={tr('auth.forgot.sentTitle', 'Check Your Email')}
        showBackButton
        backHref="/login"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>

          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed mb-6">
            {tr('auth.forgot.sentBody', 'If')}{' '}
            <span className="text-gold font-semibold">{email}</span>{' '}
            {tr(
              'auth.forgot.sentBodyRest',
              "is registered with us, we've sent a password reset link. Check your inbox and spam folder.",
            )}
          </p>

          <p className="text-xs text-slate-400 dark:text-white/50 mb-6">
            {tr('auth.forgot.expires', 'The link expires in 1 hour.')}
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-orange transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            {tr('auth.forgot.backToLogin', 'Back to login')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ============================================
  // FORM STATE
  // ============================================
  return (
    <AuthLayout
      title={tr('auth.forgot.title', 'Forgot Password?')}
      subtitle={tr(
        'auth.forgot.subtitle',
        'Enter your email to receive a reset link',
      )}
      showBackButton
      backHref="/login"
    >
      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="
            flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl
            bg-slate-100 dark:bg-white/5
            border border-slate-300 dark:border-white/15
            focus-within:border-gold
            focus-within:bg-white dark:focus-within:bg-white/8
            transition-all
          "
        >
          <Mail className="w-4 h-4 text-slate-500 dark:text-white/40 shrink-0" />
          <input
            type="email"
            placeholder={tr('auth.forgot.email.placeholder', 'you@example.com')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isLoading}
            className="
              flex-1 bg-transparent outline-none text-sm
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-white/40
              min-w-0
            "
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full mt-2 py-3 rounded-xl
            bg-brand-gradient text-white text-sm font-bold
            hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
            disabled:opacity-60 disabled:transform-none
            transition-all
          "
        >
          {isLoading
            ? tr('auth.forgot.sending', 'Sending...')
            : tr('auth.forgot.submit', 'Send Reset Link')}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500 dark:text-white/50">
        {tr('auth.forgot.remembered', 'Remembered it?')}{' '}
        <Link
          href="/login"
          className="text-gold hover:text-orange font-semibold transition-colors"
        >
          {tr('auth.forgot.backToLogin', 'Back to login')}
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark-deep">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}