'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  XCircle,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { extendedAuthApi, ApiException } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const token = searchParams.get('token');

  // Translation helper with English fallback
  const tr = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push('/login'), 2500);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  // ============================================
  // INVALID / MISSING TOKEN
  // ============================================
  if (!token) {
    return (
      <AuthLayout
        title={tr('auth.reset.invalidTitle', 'Invalid Link')}
        showBackButton
        backHref="/login"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed mb-6">
            {tr(
              'auth.reset.invalidBody',
              'This password reset link is missing or invalid. Please request a new one.',
            )}
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-orange transition-colors font-semibold"
          >
            {tr('auth.reset.requestNew', 'Request new link')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ============================================
  // SUCCESS STATE
  // ============================================
  if (success) {
    return (
      <AuthLayout
        title={tr('auth.reset.successTitle', 'Password Reset')}
        showBackButton
        backHref="/login"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed mb-4">
            {tr(
              'auth.reset.successBody',
              'Your password has been reset successfully.',
            )}
          </p>
          <p className="text-xs text-slate-400 dark:text-white/50 mb-6">
            {tr('auth.reset.redirecting', 'Redirecting to login...')}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-orange transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            {tr('auth.reset.goToLogin', 'Go to login now')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError(tr('auth.reset.error.fillBoth', 'Please fill in both fields'));
      return;
    }
    if (password.length < 8) {
      setError(
        tr(
          'auth.reset.error.minLength',
          'Password must be at least 8 characters',
        ),
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(tr('auth.reset.error.mismatch', 'Passwords do not match'));
      return;
    }

    setIsLoading(true);
    try {
      await extendedAuthApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : tr('auth.reset.error.generic', 'Something went wrong'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // FORM STATE
  // ============================================
  return (
    <AuthLayout
      title={tr('auth.reset.title', 'Set New Password')}
      subtitle={tr(
        'auth.reset.subtitle',
        'Choose a strong password for your account',
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

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* New Password */}
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
          <Lock className="w-4 h-4 text-slate-500 dark:text-white/40 shrink-0" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={tr('auth.reset.password.placeholder', 'New password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isLoading}
            className="
              flex-1 bg-transparent outline-none text-sm
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-white/40
              min-w-0
            "
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-500 dark:text-white/50 hover:text-gold transition-colors shrink-0"
            aria-label={
              showPassword
                ? tr('auth.reset.hidePassword', 'Hide password')
                : tr('auth.reset.showPassword', 'Show password')
            }
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Confirm Password */}
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
          <Lock className="w-4 h-4 text-slate-500 dark:text-white/40 shrink-0" />
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder={tr(
              'auth.reset.confirmPassword.placeholder',
              'Confirm new password',
            )}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isLoading}
            className="
              flex-1 bg-transparent outline-none text-sm
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-white/40
              min-w-0
            "
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="text-slate-500 dark:text-white/50 hover:text-gold transition-colors shrink-0"
            aria-label={
              showConfirm
                ? tr('auth.reset.hidePassword', 'Hide password')
                : tr('auth.reset.showPassword', 'Show password')
            }
          >
            {showConfirm ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full mt-3 py-3 rounded-xl
            bg-brand-gradient text-white text-sm font-bold
            hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
            disabled:opacity-60 disabled:transform-none
            transition-all
          "
        >
          {isLoading
            ? tr('auth.reset.submitting', 'Resetting...')
            : tr('auth.reset.submit', 'Reset Password')}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500 dark:text-white/50">
        <Link
          href="/login"
          className="text-gold hover:text-orange font-semibold transition-colors"
        >
          {tr('auth.reset.backToLogin', 'Back to login')}
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark-deep">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}