'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { extendedAuthApi, ApiException } from '@/lib/api';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email'); return; }

    setIsLoading(true);
    try {
      await extendedAuthApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check Your Email" showBackButton backHref="/login">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-6">
            If <span className="text-gold font-semibold">{email}</span> is registered with us, we&apos;ve sent a password reset link. Check your inbox and spam folder.
          </p>
          <p className="text-xs text-white/50 mb-6">
            The link expires in 1 hour.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gold hover:text-orange transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email to receive a reset link"
      showBackButton
      backHref="/login"
    >
      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red/10 border border-red/30">
          <AlertCircle className="w-4 h-4 text-red shrink-0 mt-0.5" />
          <p className="text-xs text-red">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus-within:border-gold focus-within:bg-white/8 transition-all">
          <Mail className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40 min-w-0"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:transform-none transition-all"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-white/50">
        Remembered it?{' '}
        <Link href="/login" className="text-gold hover:text-orange font-semibold transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-dark-deep"><div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
