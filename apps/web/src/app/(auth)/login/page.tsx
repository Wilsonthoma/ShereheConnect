'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { authApi, ApiException } from '@/lib/api';
import { setAuth, getHomeRoute } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { validateEmail, validatePassword } from '@/lib/validation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type FieldName = 'email' | 'password';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const nextParam = searchParams.get('next');

  const tr = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('attendee_access_token');
    const userRaw = localStorage.getItem('attendee_user');
    if (token && userRaw) {
      try {
        const u = JSON.parse(userRaw);
        router.replace(nextParam || getHomeRoute(u.role));
      } catch {}
    }
  }, [router, nextParam]);

  const errors = useMemo(() => {
    const e: Record<FieldName, string> = { email: '', password: '' };
    const emailRes = validateEmail(email);
    if (!emailRes.valid) e.email = emailRes.error || '';
    const passRes = validatePassword(password);
    if (!passRes.valid) e.password = passRes.error || '';
    return e;
  }, [email, password]);

  const getError = (field: FieldName): string => (touched[field] ? errors[field] : '');
  const isFormValid = (): boolean => !errors.email && !errors.password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      
      setAuth(res.accessToken, null, {
        id: res.user.id,
        email: res.user.email,
        phone: res.user.phone,
        fullName: res.user.fullName,
        role: res.user.role,
        emailVerified: res.user.emailVerified,
      });

      if (res.user.role === 'ORGANIZER' && res.user.emailVerified === false) {
        toast.info(tr('auth.login.verifyEmail', 'Verify your email'), tr('auth.login.verifyEmailBody', 'Enter the 6-digit code we sent you.'));
        router.replace(`/verify-otp?email=${encodeURIComponent(res.user.email)}`);
        return;
      }

      toast.success(
        tr('auth.login.welcomeToast', 'Welcome back!'),
        `${tr('auth.login.signedInAs', 'Signed in as')} ${res.user.fullName}`,
      );

      setTimeout(() => {
        router.replace(nextParam || getHomeRoute(res.user.role));
      }, 600);
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : tr('auth.login.error.generic', 'Something went wrong.');
      toast.error(tr('auth.login.error.title', 'Login failed'), msg);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={tr('auth.login.title', 'Welcome Back')}
      subtitle={tr('auth.login.subtitle', 'Log in to continue to your account')}
      footer={
        <>
          {tr('auth.login.noAccount', "Don't have an account?")}{' '}
          <Link href={`/register${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`} className="text-gold hover:text-orange font-semibold transition-colors">
            {tr('auth.login.signUp', 'Sign Up')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <FormField type="email" placeholder={tr('auth.login.email.placeholder', 'you@example.com')} value={email} onChange={setEmail} onBlur={() => setTouched((p) => ({ ...p, email: true }))} error={getError('email')} leftIcon={<Mail className="w-4 h-4" />} autoComplete="email" disabled={isLoading} />
        <FormField type={showPassword ? 'text' : 'password'} placeholder={tr('auth.login.password.placeholder', 'Enter your password')} value={password} onChange={setPassword} onBlur={() => setTouched((p) => ({ ...p, password: true }))} error={getError('password')} leftIcon={<Lock className="w-4 h-4" />} rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 dark:text-white/50 hover:text-gold transition-colors" tabIndex={-1}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} autoComplete="current-password" disabled={isLoading} />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-600 dark:text-white/60 cursor-pointer transition-colors">
            <input type="checkbox" className="w-3.5 h-3.5 accent-gold cursor-pointer rounded" />
            <span>{tr('auth.login.rememberMe', 'Remember me')}</span>
          </label>
          <Link href="/forgot-password" className="text-gold hover:text-orange transition-colors font-medium">
            {tr('auth.login.forgotPassword', 'Forgot password?')}
          </Link>
        </div>

        <button type="submit" disabled={isLoading} className="w-full mt-2 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
          {isLoading ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{tr('auth.login.submitting', 'Logging in...')}</>) : (tr('auth.login.submit', 'Log In'))}
        </button>
      </form>
    </AuthLayout>
  );
}

function FormField({ type = 'text', placeholder, value, onChange, onBlur, error, leftIcon, rightIcon, autoComplete, disabled }: any) {
  const hasError = !!error;
  return (
    <div>
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all ${hasError ? 'border-red-500/60 focus-within:border-red-500 bg-slate-100 dark:bg-white/5' : 'border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 focus-within:border-gold focus-within:bg-white dark:focus-within:bg-white/8'}`}>
        {leftIcon && <span className={`shrink-0 ${hasError ? 'text-red-500/70' : 'text-slate-500 dark:text-white/40'}`}>{leftIcon}</span>}
        <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} autoComplete={autoComplete} disabled={disabled} className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 min-w-0" />
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </div>
      {hasError && <p className="mt-1 text-[0.7rem] text-red-500 px-1">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark-deep"><div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}