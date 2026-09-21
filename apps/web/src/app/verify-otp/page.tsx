'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { VerifyOtpInput } from '@/components/ui';
import { otpApi, ApiException } from '@/lib/api';
import { toast } from '@/lib/toast';
import { getHomeRoute } from '@/lib/auth';

const RESEND_COOLDOWN = 60;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* -------- Resend cooldown timer -------- */
  useEffect(() => {
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  /* -------- Redirect if no email -------- */
  useEffect(() => {
    if (!email) router.replace('/login');
  }, [email, router]);

  /* -------- Auto-verify when 6 digits entered -------- */
  useEffect(() => {
    if (otp.length === 6 && !isVerifying && !verified) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await otpApi.verifyOtp(email, otp);
      setVerified(true);
      toast.success('Email verified!', 'Your account is now active.');

      setTimeout(() => {
        // Fetch user from localStorage to determine home route
        try {
          const u = JSON.parse(localStorage.getItem('attendee_user') || '{}');
          router.replace(u.role ? getHomeRoute(u.role) : '/dashboard');
        } catch {
          router.replace('/dashboard');
        }
      }, 1200);
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.message : 'Verification failed. Try again.';
      setError(msg);
      toast.error('Verification failed', msg);
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const res = await otpApi.resendOtp(email);
      if (res.alreadyVerified) {
        toast.info('Already verified', 'Redirecting to your dashboard...');
        setTimeout(() => {
          try {
            const u = JSON.parse(localStorage.getItem('attendee_user') || '{}');
            router.replace(u.role ? getHomeRoute(u.role) : '/dashboard');
          } catch {
            router.replace('/dashboard');
          }
        }, 800);
        return;
      }
      toast.success('New code sent!', `Check ${email} for the 6-digit code.`);
      setCooldown(RESEND_COOLDOWN);
      setOtp('');
      setError('');
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : 'Could not resend code.';
      toast.error('Resend failed', msg);
    } finally {
      setIsResending(false);
    }
  };

  if (verified) {
    return (
      <AuthLayout title="Email Verified!" showBackButton={false}>
        <div className="text-center py-6">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-success/20 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-3">
            Your email has been verified successfully.
          </p>
          <p className="text-xs text-white/50">Taking you to your dashboard...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Check Your Email"
      showBackButton
      backHref="/login"
    >
      <div className="text-center mb-5">
        <p className="text-sm text-white/60 mb-1">
          We sent a 6-digit code to
        </p>
        <p className="text-sm font-semibold text-gold break-all">{email}</p>
      </div>

      <div className="mb-5">
        <VerifyOtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v);
            if (error) setError('');
          }}
          disabled={isVerifying}
          error={!!error}
        />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red/10 border border-red/30">
          <AlertCircle className="w-4 h-4 text-red shrink-0 mt-0.5" />
          <p className="text-xs text-red">{error}</p>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={otp.length !== 6 || isVerifying}
        className="w-full py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
      >
        {isVerifying ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Email'
        )}
      </button>

      <div className="mt-5 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-white/50 mb-2">Didn&apos;t receive the code?</p>
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-orange disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {isResending
            ? 'Sending...'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend code'}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-white/40">
        <Link href="/login" className="hover:text-gold transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dark-deep">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
