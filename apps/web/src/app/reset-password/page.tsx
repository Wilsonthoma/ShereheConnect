'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, XCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { extendedAuthApi, ApiException } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push('/login'), 2500);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" showBackButton backHref="/login">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red" />
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-orange transition-colors font-semibold"
          >
            Request new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout title="Password Reset" showBackButton backHref="/login">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            Your password has been reset successfully.
          </p>
          <p className="text-xs text-white/50 mb-6">Redirecting to login...</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-orange transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to login now
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) { setError('Please fill in both fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      await extendedAuthApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Choose a strong password for your account"
      showBackButton
      backHref="/login"
    >
      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red/10 border border-red/30">
          <AlertCircle className="w-4 h-4 text-red shrink-0 mt-0.5" />
          <p className="text-xs text-red">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus-within:border-gold focus-within:bg-white/8 transition-all">
          <Lock className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40 min-w-0"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-white/50 hover:text-gold transition-colors shrink-0"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus-within:border-gold focus-within:bg-white/8 transition-all">
          <Lock className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40 min-w-0"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="text-white/50 hover:text-gold transition-colors shrink-0"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:transform-none transition-all"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-white/50">
        <Link href="/login" className="text-gold hover:text-orange font-semibold transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-dark-deep"><div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
