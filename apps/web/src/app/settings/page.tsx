'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth';
import { getToken, clearAuth, getUser } from '@/lib/auth';
import { api, ApiException } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function SettingsContent() {
  const router = useRouter();
  const { t } = useLanguage();

  // Translation helper with English fallback
  const tr = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  const [user, setUser] = useState<any>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setUser(getUser());
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!currentPassword)
      e.currentPassword = tr(
        'settings.errors.currentRequired',
        'Current password is required',
      );

    if (!newPassword)
      e.newPassword = tr(
        'settings.errors.newRequired',
        'New password is required',
      );
    else if (newPassword.length < 8)
      e.newPassword = tr(
        'settings.errors.minLength',
        'Must be at least 8 characters',
      );

    if (!confirmPassword)
      e.confirmPassword = tr(
        'settings.errors.confirmRequired',
        'Please confirm',
      );
    else if (newPassword !== confirmPassword)
      e.confirmPassword = tr(
        'settings.errors.mismatch',
        'Passwords do not match',
      );
    else if (currentPassword === newPassword)
      e.newPassword = tr(
        'settings.errors.sameAsCurrent',
        'Must differ from current password',
      );

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isLoading) return;

    setIsLoading(true);
    try {
      const token = getToken();
      await api.post(
        '/auth/change-password',
        { currentPassword, newPassword },
        token,
      );

      toast.success(
        tr('settings.success.title', 'Password changed'),
        tr(
          'settings.success.body',
          'Your password has been updated.',
        ),
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg =
        err instanceof ApiException
          ? err.message
          : tr(
              'settings.errors.changeFailed',
              'Could not change password.',
            );
      toast.error(
        tr('settings.error.title', 'Password change failed'),
        msg,
      );
      if (msg.toLowerCase().includes('current')) {
        setErrors({ currentPassword: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    toast.info(
      tr('settings.logout.toast.title', 'Signed out'),
      tr('settings.logout.toast.body', 'See you soon!'),
    );
    setTimeout(() => router.replace('/'), 400);
  };

  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 py-10 md:py-16 transition-colors">
      <div className="container-md max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tr('settings.backToDashboard', 'Back to dashboard')}</span>
        </Link>

        {/* Header */}
        <h1 className="heading-display heading-md text-brand-gradient mb-3">
          {tr('settings.title', 'Settings')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 transition-colors">
          {tr(
            'settings.subtitle',
            'Manage your account security and preferences.',
          )}
        </p>

        {/* ============================================
            CHANGE PASSWORD
        ============================================ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 transition-colors">
                {tr('settings.changePassword.title', 'Change Password')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                {tr(
                  'settings.changePassword.subtitle',
                  'Update your account password',
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label={tr('settings.currentPassword.label', 'Current Password')}
              value={currentPassword}
              onChange={(v) => {
                setCurrentPassword(v);
                setErrors((e) => ({ ...e, currentPassword: '' }));
              }}
              show={showCurrent}
              toggle={() => setShowCurrent(!showCurrent)}
              error={errors.currentPassword}
              disabled={isLoading}
              autoComplete="current-password"
            />

            <PasswordField
              label={tr('settings.newPassword.label', 'New Password')}
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                setErrors((e) => ({ ...e, newPassword: '' }));
              }}
              show={showNew}
              toggle={() => setShowNew(!showNew)}
              error={errors.newPassword}
              disabled={isLoading}
              autoComplete="new-password"
              placeholder={tr(
                'settings.newPassword.placeholder',
                'Min 8 characters',
              )}
            />

            <PasswordField
              label={tr(
                'settings.confirmPassword.label',
                'Confirm New Password',
              )}
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                setErrors((e) => ({ ...e, confirmPassword: '' }));
              }}
              show={showConfirm}
              toggle={() => setShowConfirm(!showConfirm)}
              error={errors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
              success={
                confirmPassword.length > 0 &&
                newPassword === confirmPassword
              }
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {tr('settings.updating', 'Updating...')}
                </>
              ) : (
                tr('settings.updatePassword', 'Update Password')
              )}
            </button>
          </form>
        </div>

        {/* ============================================
            ACCOUNT INFO
        ============================================ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-6 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 transition-colors">
                {tr('settings.accountInfo.title', 'Account Info')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                {tr(
                  'settings.accountInfo.subtitle',
                  'Your current account details',
                )}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <span className="text-slate-500 dark:text-slate-400">
                {tr('settings.accountInfo.email', 'Email')}
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {user?.email || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <span className="text-slate-500 dark:text-slate-400">
                {tr('settings.accountInfo.phone', 'Phone')}
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {user?.phone || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <span className="text-slate-500 dark:text-slate-400">
                {tr('settings.accountInfo.role', 'Role')}
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                {user?.role?.toLowerCase() || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">
                {tr(
                  'settings.accountInfo.emailVerified',
                  'Email verified',
                )}
              </span>
              <span
                className={`font-medium ${
                  user?.emailVerified
                    ? 'text-emerald-500'
                    : 'text-amber-500'
                }`}
              >
                {user?.emailVerified
                  ? tr('settings.accountInfo.verified', '✓ Yes')
                  : tr(
                      'settings.accountInfo.notVerified',
                      '⚠ Not verified',
                    )}
              </span>
            </div>
          </div>

          <Link
            href="/profile"
            className="mt-6 inline-flex text-sm text-gold hover:text-orange font-semibold transition-colors"
          >
            {tr('settings.accountInfo.editProfile', 'Edit profile →')}
          </Link>
        </div>

        {/* ============================================
            SIGN OUT
        ============================================ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-500/20 p-6 md:p-8 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 transition-colors">
                {tr('settings.signOut.title', 'Sign Out')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                {tr(
                  'settings.signOut.subtitle',
                  'End your session on this device',
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-500/10 text-red-500 text-sm font-semibold hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            {tr('settings.signOut.button', 'Sign Out')}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ============================================
   PasswordField
   ============================================ */
function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  error,
  success,
  disabled,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const { t } = useLanguage();

  const tr = (key: string, fallback: string): string => {
    const v = t(key as any);
    return v === key ? fallback : v;
  };

  const hasError = !!error;
  const showSuccess = success && !hasError;

  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 transition-colors">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border transition-all ${
          hasError
            ? 'border-red-500/60 focus-within:border-red-500'
            : showSuccess
            ? 'border-emerald-500/50 focus-within:border-emerald-500'
            : 'border-slate-200 dark:border-slate-700 focus-within:border-gold'
        }`}
      >
        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={placeholder || '••••••••'}
          className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-w-0"
        />
        <button
          type="button"
          onClick={toggle}
          className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors shrink-0"
          tabIndex={-1}
          aria-label={
            show
              ? tr('settings.hidePassword', 'Hide password')
              : tr('settings.showPassword', 'Show password')
          }
        >
          {show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {hasError && (
        <p className="mt-1 text-[0.7rem] text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {showSuccess && (
        <p className="mt-1 text-[0.7rem] text-emerald-500 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {tr('settings.passwordsMatch', 'Passwords match')}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}