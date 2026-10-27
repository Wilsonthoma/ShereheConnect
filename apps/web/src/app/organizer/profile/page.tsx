'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import {
  organizerApi,
  OrganizerProfile,
  PaymentMethodType,
} from '@/lib/organizerApi';
import { toast } from '@/lib/toast';

const KYC_STYLES: Record<
  string,
  { bg: string; icon: React.ReactNode; label: string }
> = {
  PENDING: {
    bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    icon: <Clock className="w-4 h-4" />,
    label: 'Pending review',
  },
  VERIFIED: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Verified',
  },
  NEEDS_REVISION: {
    bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Needs revision',
  },
  REJECTED: {
    bg: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Rejected',
  },
};

const DOC_LABELS: Record<string, string> = {
  BUSINESS_PERMIT: 'Business Permit',
  NATIONAL_ID: 'National ID',
  OTHER: 'Other',
};

export default function OrganizerProfilePage() {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [payment, setPayment] = useState({
    methodType: 'PAYBILL' as PaymentMethodType,
    shortcode: '',
    accountNumber: '',
    phoneNumber: '',
    displayLabel: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const p = await organizerApi.getProfile();
      setProfile(p);
    } catch (err: any) {
      toast.error('Failed to load profile', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await organizerApi.addPaymentMethod({
        methodType: payment.methodType,
        shortcode: payment.shortcode.trim() || undefined,
        accountNumber: payment.accountNumber.trim() || undefined,
        phoneNumber: payment.phoneNumber.trim() || undefined,
        displayLabel: payment.displayLabel.trim() || undefined,
      });
      toast.success('Payment method added', 'Awaiting admin approval.');
      setShowAddForm(false);
      setPayment({
        methodType: 'PAYBILL',
        shortcode: '',
        accountNumber: '',
        phoneNumber: '',
        displayLabel: '',
      });
      await load();
    } catch (err: any) {
      toast.error('Failed to add', err?.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this payment method?')) return;
    setBusy(id);
    try {
      await organizerApi.deletePaymentMethod(id);
      toast.success('Removed');
      await load();
    } catch (err: any) {
      toast.error('Delete failed', err?.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Profile not found.</p>
        <Link
          href="/organizer/onboarding"
          className="mt-4 inline-block text-gold hover:text-orange font-semibold text-sm"
        >
          Start onboarding →
        </Link>
      </div>
    );
  }

  const kyc = KYC_STYLES[profile.kycStatus] ?? KYC_STYLES.PENDING;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your business info, KYC documents, and payment methods.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className={`px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-bold uppercase ${kyc.bg}`}
          >
            {kyc.icon} {kyc.label}
          </div>
          {profile.kycStatus === 'NEEDS_REVISION' && profile.kycNotes && (
            <p className="text-sm text-red-600 dark:text-red-400 max-w-md">
              {profile.kycNotes}
            </p>
          )}
        </div>
        {profile.kycStatus !== 'VERIFIED' && (
          <Link
            href="/organizer/onboarding"
            className="text-sm font-semibold text-gold hover:text-orange transition-colors"
          >
            {profile.kycStatus === 'PENDING'
              ? 'Update submission →'
              : 'Resubmit →'}
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-gold" />
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            Business Information
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Row label="Business Name" value={profile.businessName} />
          <Row label="Type" value={profile.organizerType} />
          <Row label="County" value={profile.county} />
          <Row label="Phone" value={profile.phone ?? '—'} />
          <Row
            label="KRA PIN"
            value={profile.kraPin ?? '—'}
            mono={!!profile.kraPin}
          />
          {profile.bio && (
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Bio
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                {profile.bio}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-gold" />
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            KYC Documents
          </h2>
        </div>
        {!profile.kycDocuments || profile.kycDocuments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No documents uploaded.
          </p>
        ) : (
          <ul className="space-y-2">
            {profile.kycDocuments.map((doc, i) => {
              const isPdf = doc.url.toLowerCase().endsWith('.pdf');
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {isPdf ? (
                      <FileText className="w-4 h-4 text-red-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {DOC_LABELS[doc.type] ?? doc.type}
                    </p>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate hover:text-gold transition-colors block"
                    >
                      {doc.fileName}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gold" />
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              Payment Methods
            </h2>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        {profile.paymentMethods.length === 0 && !showAddForm && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No payment methods yet.
          </p>
        )}

        {profile.paymentMethods.length > 0 && (
          <div className="space-y-2 mb-4">
            {profile.paymentMethods.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {m.methodType}
                    {m.displayLabel && (
                      <span className="text-slate-500 font-normal">
                        {' '}
                        · {m.displayLabel}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.shortcode && <>Shortcode: {m.shortcode} </>}
                    {m.accountNumber && <>· Account: {m.accountNumber} </>}
                    {m.phoneNumber && <>· Phone: {m.phoneNumber}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.isActive ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Approved
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Pending
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={busy === m.id}
                    className="p-1.5 rounded text-red-500 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <select
              value={payment.methodType}
              onChange={(e) =>
                setPayment({
                  ...payment,
                  methodType: e.target.value as PaymentMethodType,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              <option value="PAYBILL">M-Pesa Paybill</option>
              <option value="TILL">M-Pesa Till</option>
              <option value="POCHI">Pochi la Biashara</option>
              <option value="SEND_MONEY">Send Money</option>
            </select>

            {(payment.methodType === 'PAYBILL' ||
              payment.methodType === 'TILL') && (
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder={payment.methodType === 'PAYBILL' ? 'Business Number' : 'Till Number'}
                value={payment.shortcode}
                onChange={(e) =>
                  setPayment({
                    ...payment,
                    shortcode: e.target.value.replace(/[^0-9]/g, ''),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            )}
            {payment.methodType === 'PAYBILL' && (
              <input
                type="text"
                maxLength={50}
                placeholder="Account Number (e.g. Business Name)"
                value={payment.accountNumber}
                onChange={(e) =>
                  setPayment({ ...payment, accountNumber: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            )}
            {(payment.methodType === 'POCHI' ||
              payment.methodType === 'SEND_MONEY') && (
              <input
                type="text"
                inputMode="tel"
                placeholder="0712345678"
                value={payment.phoneNumber}
                onChange={(e) =>
                  setPayment({ ...payment, phoneNumber: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            )}
            <input
              type="text"
              maxLength={100}
              placeholder="Display label (optional)"
              value={payment.displayLabel}
              onChange={(e) =>
                setPayment({ ...payment, displayLabel: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 px-3 py-2 rounded-lg bg-brand-gradient text-white text-sm font-semibold disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add method'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p
        className={`font-semibold text-slate-800 dark:text-slate-100 ${
          mono ? 'font-mono tracking-wider' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
