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

type FieldName = 'email' | 'password';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    email: false,
    password: false,
  });
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

    if (!isFormValid()) return;
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password);
      setAuth(res.accessToken, null, {
        id: res.user.id,
        email: res.user.email,
        phone: res.user.phone,
        fullName: res.user.fullName,
        role: res.user.role,
      });
      toast.success('Welcome back!', `Signed in as ${res.user.fullName}`);
      setTimeout(() => {
        router.replace(nextParam || getHomeRoute(res.user.role));
      }, 600);
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.message : 'Something went wrong. Please try again.';
      toast.error('Login failed', msg);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to continue to your account"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href={`/register${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`}
            className="text-gold hover:text-orange font-semibold transition-colors"
          >
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <FormField
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((p) => ({ ...p, email: true }))}
          error={getError('email')}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          disabled={isLoading}
        />

        <FormField
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((p) => ({ ...p, password: true }))}
          error={getError('password')}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-white/50 hover:text-gold transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          autoComplete="current-password"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-white/60 cursor-pointer">
            <input type="checkbox" className="w-3.5 h-3.5 accent-gold cursor-pointer rounded" />
            <span>Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-gold hover:text-orange transition-colors font-medium">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[#0f172a]/85 text-white/40">OR</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => toast.info('Coming soon', 'Google sign-in will be available shortly.')}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 hover:border-gold/40 transition-all"
      >
        <span className="text-base">G</span>
        <span>Continue with Google</span>
      </button>
    </AuthLayout>
  );
}

interface FormFieldProps {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoComplete?: string;
  disabled?: boolean;
}

function FormField({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  leftIcon,
  rightIcon,
  autoComplete,
  disabled,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div>
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/5 border transition-all ${
          hasError
            ? 'border-red/50 focus-within:border-red'
            : 'border-white/15 focus-within:border-gold focus-within:bg-white/8'
        }`}
      >
        {leftIcon && (
          <span className={`shrink-0 ${hasError ? 'text-red/70' : 'text-white/40'}`}>
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40 min-w-0"
        />
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </div>
      {hasError && <p className="mt-1 text-[0.7rem] text-red px-1">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dark-deep">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
