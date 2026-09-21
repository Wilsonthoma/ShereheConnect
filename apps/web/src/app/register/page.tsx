'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { AuthLayout, RoleSelector } from '@/components/auth';
import { authApi, ApiException } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { toast } from '@/lib/toast';
import {
  validateEmail,
  validateFullName,
  validateKenyanPhone,
  validatePassword,
  validateConfirmPassword,
  getPasswordStrength,
  normalizePhone,
} from '@/lib/validation';

type FieldName = 'fullName' | 'email' | 'phone' | 'password' | 'confirmPassword';

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
  const nextParam = searchParams.get('next');

  const [role, setRole] = useState<'ATTENDEE' | 'ORGANIZER'>('ATTENDEE');
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

  useEffect(() => {
    const token = localStorage.getItem('attendee_access_token');
    if (token) {
      // Already logged in — redirect by role
      const userRaw = localStorage.getItem('attendee_user');
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          if (u.role === 'ATTENDEE' || u.emailVerified !== false) {
            router.replace(u.role === 'ORGANIZER' ? '/organizer/dashboard' : '/dashboard');
          }
        } catch {}
      }
    }
  }, [router]);

  /* ---------- Real-time validation ---------- */
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
        const r = validateConfirmPassword(form.password, form.confirmPassword);
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
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

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

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid()) {
      toast.error('Please fix the errors above');
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

      setAuth(res.accessToken, null, {
        id: res.user.id,
        email: res.user.email,
        phone: res.user.phone,
        fullName: res.user.fullName,
        role: res.user.role,
        emailVerified: res.user.emailVerified,
      });

      // Different messaging + redirect based on role
      if (res.user.role === 'ORGANIZER') {
        toast.success(
          'Account created!',
          'Check your email for the 6-digit verification code.',
        );
        setTimeout(() => {
          if (nextParam) {
            router.replace(nextParam);
          } else {
            router.replace(`/verify-otp?email=${encodeURIComponent(res.user.email)}`);
          }
        }, 800);
      } else {
        toast.success(
          'Welcome to ShereheConnect!',
          `You're signed in as ${res.user.fullName.split(' ')[0]}.`,
        );
        setTimeout(() => {
          if (nextParam) {
            router.replace(nextParam);
          } else {
            router.replace('/dashboard');
          }
        }, 800);
      }
    } catch (err) {
      const msg =
        err instanceof ApiException
          ? err.message
          : 'Something went wrong. Please try again.';
      toast.error('Registration failed', msg);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`}
            className="text-gold hover:text-orange font-semibold transition-colors"
          >
            Sign In
          </Link>
        </>
      }
    >
      <RoleSelector value={role} onChange={setRole} />

      {/* Role-specific helper text */}
      <p className="text-center text-[0.7rem] text-white/40 mb-3 -mt-1">
        {role === 'ORGANIZER'
          ? 'Organizers verify their email to keep the platform secure.'
          : 'Attendees can start exploring events right away.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Full Name */}
        <FormField
          type="text"
          placeholder="Full name"
          value={form.fullName}
          onChange={(v) => updateField('fullName', v)}
          onBlur={() => handleBlur('fullName')}
          error={getError('fullName')}
          leftIcon={<User className="w-4 h-4" />}
          disabled={isLoading}
          autoComplete="name"
        />

        {/* Email */}
        <FormField
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(v) => updateField('email', v)}
          onBlur={() => handleBlur('email')}
          error={getError('email')}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={isLoading}
          autoComplete="email"
        />

        {/* Phone */}
        <FormField
          type="tel"
          placeholder="0712 345 678"
          value={form.phone}
          onChange={(v) => updateField('phone', v)}
          onBlur={() => handleBlur('phone')}
          error={getError('phone')}
          leftIcon={<Phone className="w-4 h-4" />}
          disabled={isLoading}
          autoComplete="tel"
        />

        {/* Password */}
        <div>
          <FormField
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={(v) => updateField('password', v)}
            onBlur={() => handleBlur('password')}
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
            disabled={isLoading}
            autoComplete="new-password"
          />
          {form.password.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2 px-1">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
              <span className="text-[0.65rem] text-white/50 font-medium">
                {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <FormField
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(v) => updateField('confirmPassword', v)}
            onBlur={() => handleBlur('confirmPassword')}
            error={getError('confirmPassword')}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-white/50 hover:text-gold transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            disabled={isLoading}
            autoComplete="new-password"
            success={passwordsMatch}
          />
          {passwordsMatch && (
            <p className="mt-1 text-[0.7rem] text-emerald-400 px-1">
              ✓ Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
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
        onClick={() => toast.info('Coming soon', 'Google sign-up will be available shortly.')}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-semibold hover:bg-white/10 hover:border-gold/40 transition-all"
      >
        <span className="text-base">G</span>
        <span>Continue with Google</span>
      </button>
    </AuthLayout>
  );
}

/* ---------- FormField component ---------- */
interface FormFieldProps {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  success?: boolean;
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
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/5 border transition-all ${
          hasError
            ? 'border-red/50 focus-within:border-red'
            : showSuccess
              ? 'border-emerald-500/50 focus-within:border-emerald-500'
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-dark-deep">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
