'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
import { Button, FullPageLoader } from '@/components/ui';
import { getToken, getUser, setAuth } from '@/lib/auth';
import { api, ApiException } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  validateFullName,
  validateKenyanPhone,
} from '@/lib/validation';

type TranslateFn = (key: string) => string;

function translateWithFallback(
  t: TranslateFn,
  key: string,
  fallback: string,
): string {
  const value = t(key);
  return value === key ? fallback : value;
}

interface ProfileFormValues {
  fullName: string;
  phone: string;
  email: string;
}

interface ProfileFormErrors {
  fullName?: string;
  phone?: string;
}

const ProtectedRoute = dynamic(
  () => import('@/components/auth').then((mod) => mod.ProtectedRoute),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-light dark:bg-slate-950 py-10 md:py-16">
        <div className="container-md max-w-2xl space-y-6 animate-pulse">
          <div className="h-6 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    ),
  },
);

interface ProfileDetailsFormProps {
  form: ProfileFormValues;
  errors: ProfileFormErrors;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

function ProfileDetailsFormImpl({
  form,
  errors,
  saving,
  onSave,
  onFullNameChange,
  onPhoneChange,
}: ProfileDetailsFormProps) {
  const { t } = useLanguage();
  const tr = (key: string, fallback: string): string =>
    translateWithFallback(t as TranslateFn, key, fallback);

  return (
    <form
      onSubmit={onSave}
      className="
        bg-white dark:bg-slate-900
        rounded-2xl
        border border-slate-200 dark:border-slate-800
        p-6 md:p-8
        space-y-5
        transition-colors
      "
    >
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
          {tr('profile.email.hint', 'Contact support to change your email.')}
        </p>
      </div>

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
            onChange={(e) => onFullNameChange(e.target.value)}
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
            onChange={(e) => onPhoneChange(e.target.value)}
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

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={saving}
          disabled={saving}
          className="gap-2 px-6 py-3 rounded-xl bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none text-sm font-bold"
        >
          {!saving && <Save className="w-4 h-4" />}
          {saving
            ? tr('profile.saving', 'Saving...')
            : tr('profile.save', 'Save Changes')}
        </Button>

        <Link href="/settings" className="inline-flex">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2 px-6 py-3 rounded-xl border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold hover:border-gold hover:text-gold"
          >
            <ShieldCheck className="w-4 h-4" />
            {tr('profile.securitySettings', 'Security Settings')}
          </Button>
        </Link>
      </div>
    </form>
  );
}

const ProfileDetailsForm = dynamic(
  () => Promise.resolve(ProfileDetailsFormImpl),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 h-80 animate-pulse" />
    ),
  },
);

function ProfileContent() {
  const { t } = useLanguage();

  const tr = (key: string, fallback: string): string =>
    translateWithFallback(t as TranslateFn, key, fallback);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormValues>({
    fullName: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});

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
    const nextErrors: ProfileFormErrors = {};
    const nameRes = validateFullName(form.fullName);
    if (!nameRes.valid && nameRes.error) nextErrors.fullName = nameRes.error;
    const phoneRes = validateKenyanPhone(form.phone);
    if (!phoneRes.valid && phoneRes.error) nextErrors.phone = phoneRes.error;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !validate()) return;

    setSaving(true);
    try {
      const token = getToken();
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

  if (loading) {
    return <FullPageLoader message="Loading profile..." />;
  }

  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 py-10 md:py-16 transition-colors">
      <div className="container-md max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tr('profile.backToDashboard', 'Back to dashboard')}</span>
        </Link>

        <h1 className="heading-display heading-md text-brand-gradient mb-3">
          {tr('profile.title', 'My Profile')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 transition-colors">
          {tr('profile.subtitle', 'Update your personal information.')}
        </p>

        <ProfileDetailsForm
          form={form}
          errors={errors}
          saving={saving}
          onSave={handleSave}
          onFullNameChange={(fullName) => {
            setForm((prev) => ({ ...prev, fullName }));
            if (errors.fullName) {
              setErrors((prev) => ({ ...prev, fullName: undefined }));
            }
          }}
          onPhoneChange={(phone) => {
            setForm((prev) => ({ ...prev, phone }));
            if (errors.phone) {
              setErrors((prev) => ({ ...prev, phone: undefined }));
            }
          }}
        />
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