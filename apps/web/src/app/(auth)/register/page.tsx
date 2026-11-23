'use client';

import { useState, useEffect, useMemo, Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Ticket,
  CalendarPlus,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth';
import { FullPageLoader } from '@/components/ui';
import { authApi, ApiException } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  validateEmail,
  validateFullName,
  validateKenyanPhone,
  validatePassword,
  validateConfirmPassword,
  getPasswordStrength,
  normalizePhone,
} from '@/lib/validation';

type FieldName =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const nextParam = searchParams.get('next');

  const tr = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  // null = Step 1 ("Who would you like to sign up as?"), 'ATTENDEE' | 'ORGANIZER' = Step 2 (Form)
  const [role, setRole] = useState<'ATTENDEE' | 'ORGANIZER' | null>(null);

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ---------- Already logged in → redirect (original logic) ---------- */
  useEffect(() => {
    if (!isLoggedIn()) return;
    const userRaw = localStorage.getItem('attendee_user');
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u.role === 'ATTENDEE' || u.emailVerified !== false) {
          router.replace(
            u.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard',
          );
        }
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  const validators: Record<FieldName, () => string> = useMemo(
    () => ({
      fullName: () => {
        const r = validateFullName(form.fullName);
        return r.valid ? '' : r.error || '';
      },
      email: () => {
        const r = validateEmail(form.email);
        return r.valid ? '' : r.error || '';
      },
      phone: () => {
        const r = validateKenyanPhone(form.phone);
        return r.valid ? '' : r.error || '';
      },
      password: () => {
        const r = validatePassword(form.password);
        return r.valid ? '' : r.error || '';
      },
      confirmPassword: () => {
        const r = validateConfirmPassword(
          form.password,
          form.confirmPassword,
        );
        return r.valid ? '' : r.error || '';
      },
    }),
    [form],
  );

  const getError = (field: FieldName): string => {
    if (!touched[field]) return '';
    return validators[field]();
  };

  const passwordStrength = getPasswordStrength(form.password);
  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  const updateField = (field: FieldName, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isFormValid = (): boolean => {
    return (
      validateFullName(form.fullName).valid &&
      validateEmail(form.email).valid &&
      validateKenyanPhone(form.phone).valid &&
      validatePassword(form.password).valid &&
      validateConfirmPassword(form.password, form.confirmPassword).valid
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid()) {
      toast.error(
        tr('auth.register.error.fixErrors', 'Please fix the errors above'),
      );
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await authApi.register({
        email: form.email.trim().toLowerCase(),
        phone: normalizePhone(form.phone),
        password: form.password,
        fullName: form.fullName.trim(),
        role,
      });

      toast.success(
        tr('auth.register.success.title', 'Account created!'),
        'Check your email for the verification code.',
      );
      router.replace(`/verify-otp?email=${encodeURIComponent(res.user.email)}`);
    } catch (err) {
      const msg =
        err instanceof ApiException
          ? err.message
          : tr(
              'auth.register.error.generic',
              'Something went wrong. Please try again.',
            );
      toast.error(tr('auth.register.error.title', 'Registration failed'), msg);
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      {tr('auth.register.haveAccount', 'Already have an account?')}{' '}
      <Link
        href={`/login${
          nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''
        }`}
        className="text-gold hover:text-orange font-semibold transition-colors"
      >
        {tr('auth.register.signIn', 'Sign In')}
      </Link>
    </>
  );

  /* ---------- STEP 1: Role Selection Screen ---------- */
  if (!role) {
    return (
      <AuthLayout
        title={tr(
          'auth.roleGate.title',
          'Who would you like to sign up as?',
        )}
        footer={footer}
      >
        <p className="text-center text-xs text-slate-600 dark:text-white/60 mb-5 -mt-1">
          {tr(
            'auth.roleGate.subtitle',
            'Select your account type to continue to registration.',
          )}
        </p>

        <div className="space-y-3.5">
          {/* ATTENDEE CARD */}
          <button
            type="button"
            onClick={() => setRole('ATTENDEE')}
            className="w-full text-left group p-4 rounded-2xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 hover:border-gold dark:hover:border-gold hover:bg-amber-50/50 dark:hover:bg-gold/10 transition-all duration-200 flex items-start gap-3.5 shadow-sm cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-gold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-gold transition-colors">
                  {tr('auth.role.attendee.title', 'Attendee')}
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 dark:text-white/60 mt-1 leading-relaxed">
                {tr(
                  'auth.role.attendee.desc',
                  'Discover local events, book tickets with M-Pesa, and manage your passes.',
                )}
              </p>
            </div>
          </button>

          {/* ORGANIZER CARD */}
          <button
            type="button"
            onClick={() => setRole('ORGANIZER')}
            className="w-full text-left group p-4 rounded-2xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 hover:border-orange dark:hover:border-orange hover:bg-orange-50/50 dark:hover:bg-orange/10 transition-all duration-200 flex items-start gap-3.5 shadow-sm cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-500/15 text-orange flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange transition-colors">
                  {tr('auth.role.organizer.title', 'Organizer')}
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <p className="text-xs text-slate-600 dark:text-white/60 mt-1 leading-relaxed">
                {tr(
                  'auth.role.organizer.desc',
                  'Create events, manage ticket tiers, scan attendees, and track payouts.',
                )}
              </p>
            </div>
          </button>
        </div>
      </AuthLayout>
    );
  }

  /* ---------- STEP 2: Selected Role Registration Form ---------- */
  return (
    <AuthLayout
      title={
        role === 'ORGANIZER'
          ? tr('auth.register.organizerTitle', 'Create Organizer Account')
          : tr('auth.register.attendeeTitle', 'Create Attendee Account')
      }
      footer={footer}
    >
      <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
        <span className="text-xs font-semibold text-slate-700 dark:text-white/80">
          {role === 'ORGANIZER'
            ? tr('auth.register.badge.organizer', 'Role: Event Organizer')
            : tr('auth.register.badge.attendee', 'Role: Attendee')}
        </span>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setRole(null)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:text-orange transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {tr('auth.register.changeRole', 'Change')}
        </button>
      </div>

      <p className="text-center text-[0.7rem] text-slate-500 dark:text-white/40 mb-3 transition-colors">
        {role === 'ORGANIZER'
          ? tr(
              'auth.register.helper.organizer',
              'Organizers verify their email to keep the platform secure.',
            )
          : tr(
              'auth.register.helper.attendee',
              'Attendees can start exploring events right away.',
            )}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <FormField
          type="text"
          placeholder={tr('auth.register.fullName.placeholder', 'Full name')}
          value={form.fullName}
          onChange={(v: string) => updateField('fullName', v)}
          onBlur={() => handleBlur('fullName')}
          error={getError('fullName')}
          leftIcon={<User className="w-4 h-4" />}
          disabled={isLoading}
          autoComplete="name"
        />
        <FormField
          type="email"
          placeholder={tr(
            'auth.register.email.placeholder',
            'you@example.com',
          )}
          value={form.email}
          onChange={(v: string) => updateField('email', v)}
          onBlur={() => handleBlur('email')}
          error={getError('email')}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={isLoading}
          autoComplete="email"
        />
        <FormField
          type="tel"
          placeholder={tr(
            'auth.register.phone.placeholder',
            '0712 345 678',
          )}
          value={form.phone}
          onChange={(v: string) => updateField('phone', v)}
          onBlur={() => handleBlur('phone')}
          error={getError('phone')}
          leftIcon={<Phone className="w-4 h-4" />}
          disabled={isLoading}
          autoComplete="tel"
        />

        <div>
          <FormField
            type={showPassword ? 'text' : 'password'}
            placeholder={tr(
              'auth.register.password.placeholder',
              'Password (min 8 characters)',
            )}
            value={form.password}
            onChange={(v: string) => updateField('password', v)}
            onBlur={() => handleBlur('password')}
            error={getError('password')}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 dark:text-white/50 hover:text-gold transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            disabled={isLoading}
            autoComplete="new-password"
          />
          {form.password.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2 px-1">
              <div className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
              <span className="text-[0.65rem] text-slate-500 dark:text-white/50 font-medium">
                {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        <div>
          <FormField
            type={showConfirm ? 'text' : 'password'}
            placeholder={tr(
              'auth.register.confirmPassword.placeholder',
              'Confirm password',
            )}
            value={form.confirmPassword}
            onChange={(v: string) => updateField('confirmPassword', v)}
            onBlur={() => handleBlur('confirmPassword')}
            error={getError('confirmPassword')}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-slate-500 dark:text-white/50 hover:text-gold transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            disabled={isLoading}
            autoComplete="new-password"
            success={passwordsMatch}
          />
          {passwordsMatch && (
            <p className="mt-1 text-[0.7rem] text-emerald-500 px-1">
              ✓ {tr('auth.register.passwordsMatch', 'Passwords match')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {tr('auth.register.submitting', 'Creating account...')}
            </>
          ) : (
            tr('auth.register.submit', 'Create Account')
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

interface FormFieldProps {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  success?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
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
  success,
  leftIcon,
  rightIcon,
  autoComplete,
  disabled,
}: FormFieldProps) {
  const hasError = !!error;
  const showSuccess = success && !hasError;
  return (
    <div>
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all ${
          hasError
            ? 'border-red-500/60 focus-within:border-red-500 bg-slate-100 dark:bg-white/5'
            : showSuccess
            ? 'border-emerald-500/50 focus-within:border-emerald-500 bg-slate-100 dark:bg-white/5'
            : 'border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 focus-within:border-gold focus-within:bg-white dark:focus-within:bg-white/8'
        }`}
      >
        {leftIcon && (
          <span
            className={`shrink-0 ${
              hasError ? 'text-red-500/70' : 'text-slate-500 dark:text-white/40'
            }`}
          >
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
          className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 min-w-0"
        />
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </div>
      {hasError && (
        <p className="mt-1 text-[0.7rem] text-red-500 px-1">{error}</p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<FullPageLoader message="Loading registration..." />}
    >
      <RegisterForm />
    </Suspense>
  );
}