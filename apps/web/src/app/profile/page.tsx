'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  ArrowLeft,
  Save,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth';
import { getToken, getUser, setAuth } from '@/lib/auth';
import { api, ApiException } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  validateFullName,
  validateKenyanPhone,
} from '@/lib/validation';

function ProfileContent() {
  const router = useRouter();
  const { t } = useLanguage();

  // Translation helper with English fallback
  const tr = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const u = getUser();
    if (u) {
      setForm({
        fullName: u.fullName || '',
        phone: u.phone || '',
        email: u.email || '',
      });
    }
    setLoading(false);
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const nameRes = validateFullName(form.fullName);
    if (!nameRes.valid) e.fullName = nameRes.error || '';
    const phoneRes = validateKenyanPhone(form.phone);
    if (!phoneRes.valid) e.phone = phoneRes.error || '';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (saving) return;

    setSaving(true);
    try {
      const token = getToken();
      // NOTE: Backend endpoint for profile update doesn't exist yet.
      // This is a placeholder call — will 404 until we build it.
      await api.patch(
        '/auth/profile',
        {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
        },
        token,
      );

      const existing = getUser();
      if (existing) {
        setAuth(token || '', null, {
          ...existing,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
        });
      }

      toast.success(
        tr('profile.success.title', 'Profile updated'),
        tr('profile.success.body', 'Your changes have been saved.'),
      );
    } catch (err) {
      const msg =
        err instanceof ApiException
          ? err.message
          : tr(
              'profile.error.notAvailable',
              'Profile update is not available yet.',
            );
      toast.info(tr('profile.error.comingSoon', 'Coming soon'), msg);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <main className="min-h-screen bg-light dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // ============================================
  // MAIN
  // ============================================
  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 py-10 md:py-16 transition-colors">
      <div className="container-md max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tr('profile.backToDashboard', 'Back to dashboard')}</span>
        </Link>

        {/* Header */}
        <h1 className="heading-display heading-md text-brand-gradient mb-3">
          {tr('profile.title', 'My Profile')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 transition-colors">
          {tr('profile.subtitle', 'Update your personal information.')}
        </p>

        <form
          onSubmit={handleSave}
          className="
            bg-white dark:bg-slate-900
            rounded-2xl
            border border-slate-200 dark:border-slate-800
            p-6 md:p-8
            space-y-5
            transition-colors
          "
        >
          {/* ============================================
              EMAIL (read-only)
          ============================================ */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 transition-colors">
              {tr('profile.email.label', 'Email Address')}
            </label>
            <div
              className="
                flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                bg-slate-50 dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                opacity-70
                transition-colors
              "
            >
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="email"
                value={form.email}
                disabled
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 min-w-0"
              />
            </div>
            <p className="mt-1 text-[0.7rem] text-slate-400 dark:text-slate-500 transition-colors">
              {tr(
                'profile.email.hint',
                'Contact support to change your email.',
              )}
            </p>
          </div>

          {/* ============================================
              FULL NAME
          ============================================ */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 transition-colors">
              {tr('profile.fullName.label', 'Full Name')}
            </label>
            <div
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border transition-all ${
                errors.fullName
                  ? 'border-red-500/60'
                  : 'border-slate-200 dark:border-slate-700 focus-within:border-gold'
              }`}
            >
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => {
                  setForm({ ...form, fullName: e.target.value });
                  setErrors({ ...errors, fullName: '' });
                }}
                autoComplete="name"
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 min-w-0"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-[0.7rem] text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* ============================================
              PHONE
          ============================================ */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 transition-colors">
              {tr('profile.phone.label', 'Phone Number')}
            </label>
            <div
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border transition-all ${
                errors.phone
                  ? 'border-red-500/60'
                  : 'border-slate-200 dark:border-slate-700 focus-within:border-gold'
              }`}
            >
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  setErrors({ ...errors, phone: '' });
                }}
                autoComplete="tel"
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 min-w-0"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-[0.7rem] text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* ============================================
              ACTIONS
          ============================================ */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex items-center justify-center gap-2
                px-6 py-3 rounded-xl
                bg-brand-gradient text-white text-sm font-bold
                hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                transition-all
              "
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {tr('profile.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {tr('profile.save', 'Save Changes')}
                </>
              )}
            </button>

            <Link
              href="/settings"
              className="
                inline-flex items-center justify-center gap-2
                px-6 py-3 rounded-xl
                border border-slate-200 dark:border-slate-700
                text-slate-900 dark:text-slate-100
                text-sm font-semibold
                hover:border-gold hover:text-gold
                transition-all
              "
            >
              <ShieldCheck className="w-4 h-4" />
              {tr('profile.securitySettings', 'Security Settings')}
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}