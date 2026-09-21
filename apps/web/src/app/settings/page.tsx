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
import { Navbar, Footer } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth';
import { getToken, clearAuth, getHomeRoute, getUser } from '@/lib/auth';
import { api, ApiException } from '@/lib/api';
import { toast } from '@/lib/toast';

function SettingsContent() {
  const router = useRouter();
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
    if (!currentPassword) e.currentPassword = 'Current password is required';
    if (!newPassword) e.newPassword = 'New password is required';
    else if (newPassword.length < 8) e.newPassword = 'Must be at least 8 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm';
    else if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    else if (currentPassword === newPassword) e.newPassword = 'Must differ from current password';
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
      toast.success('Password changed', 'Your password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.message : 'Could not change password.';
      toast.error('Password change failed', msg);
      if (msg.toLowerCase().includes('current')) {
        setErrors({ currentPassword: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    toast.info('Signed out', 'See you soon!');
    setTimeout(() => router.replace('/'), 400);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light dark:bg-slate-950 py-10 md:py-16">
        <div className="container-md max-w-2xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray hover:text-gold transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to dashboard</span>
          </Link>

          <h1 className="heading-display heading-md text-brand-gradient mb-3">
            Settings
          </h1>
          <p className="text-gray mb-8">
            Manage your account security and preferences.
          </p>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-dark dark:text-slate-100">
                  Change Password
                </h2>
                <p className="text-xs text-gray">
                  Update your account password
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={(v) => { setCurrentPassword(v); setErrors((e) => ({ ...e, currentPassword: '' })); }}
                show={showCurrent}
                toggle={() => setShowCurrent(!showCurrent)}
                error={errors.currentPassword}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, newPassword: '' })); }}
                show={showNew}
                toggle={() => setShowNew(!showNew)}
                error={errors.newPassword}
                disabled={isLoading}
                autoComplete="new-password"
                placeholder="Min 8 characters"
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
                show={showConfirm}
                toggle={() => setShowConfirm(!showConfirm)}
                error={errors.confirmPassword}
                disabled={isLoading}
                autoComplete="new-password"
                success={confirmPassword.length > 0 && newPassword === confirmPassword}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>

          {/* Account Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-800 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-dark dark:text-slate-100">
                  Account Info
                </h2>
                <p className="text-xs text-gray">
                  Your current account details
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border dark:border-slate-800">
                <span className="text-gray">Email</span>
                <span className="font-medium text-dark dark:text-slate-100">
                  {user?.email || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border dark:border-slate-800">
                <span className="text-gray">Phone</span>
                <span className="font-medium text-dark dark:text-slate-100">
                  {user?.phone || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border dark:border-slate-800">
                <span className="text-gray">Role</span>
                <span className="font-medium text-dark dark:text-slate-100 capitalize">
                  {user?.role?.toLowerCase() || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray">Email verified</span>
                <span className={`font-medium ${user?.emailVerified ? 'text-success' : 'text-warning'}`}>
                  {user?.emailVerified ? '✓ Yes' : '⚠ Not verified'}
                </span>
              </div>
            </div>

            <Link
              href="/profile"
              className="mt-6 inline-flex text-sm text-gold hover:text-orange font-semibold transition-colors"
            >
              Edit profile →
            </Link>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red/20 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-dark dark:text-slate-100">
                  Sign Out
                </h2>
                <p className="text-xs text-gray">
                  End your session on this device
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red/10 text-red text-sm font-semibold hover:bg-red hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

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
  const hasError = !!error;
  const showSuccess = success && !hasError;

  return (
    <div>
      <label className="text-xs font-semibold text-gray-dark dark:text-slate-400 block mb-1.5">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border transition-all ${
          hasError
            ? 'border-red/50 focus-within:border-red'
            : showSuccess
              ? 'border-emerald-500/50 focus-within:border-emerald-500'
              : 'border-border dark:border-slate-700 focus-within:border-gold'
        }`}
      >
        <Lock className="w-4 h-4 text-gray shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={placeholder || '••••••••'}
          className="flex-1 bg-transparent outline-none text-sm text-dark dark:text-slate-100 placeholder:text-gray-light min-w-0"
        />
        <button
          type="button"
          onClick={toggle}
          className="text-gray hover:text-gold transition-colors shrink-0"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hasError && (
        <p className="mt-1 text-[0.7rem] text-red flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {showSuccess && (
        <p className="mt-1 text-[0.7rem] text-success flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Passwords match
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
