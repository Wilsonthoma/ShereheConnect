'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import {
  organizerApi,
  OrganizerProfile,
  OrganizerType,
  PaymentMethodType,
  KycDocument,
} from '@/lib/organizerApi';
import { toast } from '@/lib/toast';
import { DocumentUploader } from '@/components/ui/DocumentUploader';

const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Kakamega', 'Nyeri', 'Meru', 'Machakos', 'Kisii',
];

const TYPES: { value: OrganizerType; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'NGO', label: 'NGO' },
];

const PAYMENT_TYPES: { value: PaymentMethodType; label: string }[] = [
  { value: 'PAYBILL', label: 'M-Pesa Paybill' },
  { value: 'TILL', label: 'M-Pesa Till' },
  { value: 'POCHI', label: 'M-Pesa Pochi la Biashara' },
  { value: 'SEND_MONEY', label: 'Send Money (Personal)' },
];

// Correct 11-character Kenyan KRA PIN: 1 Letter, 9 Digits, 1 Letter.
const KRA_PIN_REGEX = /^[A-Z]\d{9}[A-Z]$/i;
const KENYAN_PHONE_REGEX = /^(?:\+?254|0)(7\d{8}|1\d{8})$/;

export default function OrganizerOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);

  const [step, setStep] = useState(1);

  const [business, setBusiness] = useState({
    businessName: '',
    organizerType: 'INDIVIDUAL' as OrganizerType,
    county: 'Nairobi',
    bio: '',
    phone: '',
    kraPin: '',
  });

  const [documents, setDocuments] = useState<KycDocument[]>([]);

  const [payment, setPayment] = useState({
    methodType: 'PAYBILL' as PaymentMethodType,
    shortcode: '',
    accountNumber: '',
    phoneNumber: '',
    displayLabel: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    organizerApi
      .getProfile()
      .then((p) => {
        setProfile(p);
        setBusiness({
          businessName: p.businessName ?? '',
          organizerType: p.organizerType ?? 'INDIVIDUAL',
          county: p.county ?? 'Nairobi',
          bio: p.bio ?? '',
          phone: p.phone ?? '',
          kraPin: p.kraPin ?? '',
        });
        if (p.kycDocuments && Array.isArray(p.kycDocuments)) {
          setDocuments(p.kycDocuments);
        }
      })
      .catch(() => {}) // Removed toast error for load
      .finally(() => setLoading(false));
  }, []);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!business.businessName.trim()) e.businessName = 'Required';
    
    if (!business.phone.trim()) e.phone = 'Required';
    else if (!KENYAN_PHONE_REGEX.test(business.phone.trim()))
      e.phone = 'Invalid format';

    if (!business.kraPin.trim()) e.kraPin = 'Required';
    else if (!KRA_PIN_REGEX.test(business.kraPin.trim()))
      e.kraPin = 'Invalid PIN format';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const required = ['BUSINESS_PERMIT', 'NATIONAL_ID'];
    const missing = required.filter(
      (t) => !documents.some((d) => d.type === t),
    );
    if (missing.length > 0) {
      e.kycDocuments = 'Please upload all required documents.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (
      (payment.methodType === 'PAYBILL' || payment.methodType === 'TILL') &&
      !payment.shortcode.trim()
    )
      e.shortcode = 'Required';

    if (payment.methodType === 'PAYBILL' && !payment.accountNumber.trim()) {
      e.accountNumber = 'Required';
    }

    if (
      (payment.methodType === 'POCHI' || payment.methodType === 'SEND_MONEY') &&
      !payment.phoneNumber.trim()
    ) {
      e.phoneNumber = 'Required';
    } else if (
      (payment.methodType === 'POCHI' || payment.methodType === 'SEND_MONEY') &&
      payment.phoneNumber &&
      !KENYAN_PHONE_REGEX.test(payment.phoneNumber.trim())
    ) {
      e.phoneNumber = 'Invalid format';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await organizerApi.submitProfile({
        businessName: business.businessName.trim(),
        organizerType: business.organizerType,
        county: business.county,
        bio: business.bio.trim() || undefined,
        phone: business.phone.trim(),
        kraPin: business.kraPin.trim().toUpperCase(),
        kycDocuments: documents,
      });
      await organizerApi.addPaymentMethod({
        methodType: payment.methodType,
        shortcode: payment.shortcode.trim() || undefined,
        accountNumber: payment.accountNumber.trim() || undefined,
        phoneNumber: payment.phoneNumber.trim() || undefined,
        displayLabel: payment.displayLabel.trim() || undefined,
      });
      
      // Simple success toast
      toast.success('Submitted for review');
      router.push('/organizer/profile');
    } catch (err: any) {
      // Simple error toast
      toast.error('Failed to submit', err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (profile?.kycStatus === 'VERIFIED') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="heading-display text-2xl text-slate-800 dark:text-slate-100 mb-2">
            You&apos;re verified
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Your organizer account is approved. You can start creating events.
          </p>
          <a
            href="/organizer/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const STEPS = ['Business', 'Documents', 'Payment', 'Review'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-1">
          Organizer Onboarding
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Submit your business info, documents, and payment method for verification.
        </p>
      </div>

      {profile?.kycStatus === 'NEEDS_REVISION' && profile.kycNotes && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-700 dark:text-red-300 mb-1">Admin Feedback</p>
            <p className="text-sm text-red-600 dark:text-red-400">{profile.kycNotes}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${step >= n ? 'bg-brand-gradient text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {n}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step >= n ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                {label}
              </span>
              {n < STEPS.length && (
                <div className={`flex-1 h-0.5 ${step > n ? 'bg-brand-gradient' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5">
        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-gold" />
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Business Information</h2>
            </div>

            <Field label="Business / Organizer Name *" error={errors.businessName}>
              <input
                type="text"
                value={business.businessName}
                onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                className={inputCls(!!errors.businessName)}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Organizer Type *">
                <select
                  value={business.organizerType}
                  onChange={(e) => setBusiness({ ...business, organizerType: e.target.value as OrganizerType })}
                  className={inputCls(false)}
                >
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>

              <Field label="County *" error={errors.county}>
                <select
                  value={business.county}
                  onChange={(e) => setBusiness({ ...business, county: e.target.value })}
                  className={inputCls(!!errors.county)}
                >
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone *" error={errors.phone}>
                <input
                  type="text"
                  placeholder="0712345678"
                  value={business.phone}
                  onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                  className={inputCls(!!errors.phone)}
                />
                <p className="text-[0.65rem] text-slate-400 mt-1">e.g. 0712345678</p>
              </Field>

              <Field label="KRA PIN *" error={errors.kraPin}>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="A012345678K"
                    value={business.kraPin}
                    onChange={(e) => setBusiness({ ...business, kraPin: e.target.value.toUpperCase() })}
                    className={inputCls(!!errors.kraPin) + ' pl-9 uppercase'}
                  />
                </div>
                <p className="text-[0.65rem] text-slate-400 mt-1">e.g. A012345678K</p>
              </Field>
            </div>

            <Field label="Bio (Optional)">
              <textarea
                rows={3}
                value={business.bio}
                onChange={(e) => setBusiness({ ...business, bio: e.target.value })}
                className={inputCls(false) + ' resize-none'}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-gold" />
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">KYC Documents</h2>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Upload clear copies of your documents (JPG, PNG, or PDF).
            </p>

            <DocumentUploader
              docType="BUSINESS_PERMIT"
              label="Business Permit"
              required
              hint="Valid business permit or registration."
              value={documents}
              onChange={setDocuments}
            />

            <DocumentUploader
              docType="NATIONAL_ID"
              label="National ID / Passport"
              required
              hint="Front side showing your photo and ID number."
              value={documents}
              onChange={setDocuments}
            />

            {errors.kycDocuments && <p className="text-xs text-red-500 mt-2">{errors.kycDocuments}</p>}
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-gold" />
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Payment Method</h2>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Where should attendee payments go? Admin will review this before it becomes active.
            </p>

            <Field label="Method Type *">
              <select
                value={payment.methodType}
                onChange={(e) => setPayment({ ...payment, methodType: e.target.value as PaymentMethodType })}
                className={inputCls(false)}
              >
                {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>

            {(payment.methodType === 'PAYBILL' || payment.methodType === 'TILL') && (
              <Field 
                label={payment.methodType === 'PAYBILL' ? 'Business Number *' : 'Till Number *'} 
                error={errors.shortcode}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={payment.methodType === 'PAYBILL' ? 'e.g. 400200' : 'e.g. 5030201'}
                  value={payment.shortcode}
                  onChange={(e) => setPayment({ ...payment, shortcode: e.target.value.replace(/[^0-9]/g, '') })}
                  className={inputCls(!!errors.shortcode)}
                />
              </Field>
            )}

            {payment.methodType === 'PAYBILL' && (
              <Field label="Account Number *" error={errors.accountNumber}>
                <input
                  type="text"
                  placeholder="e.g. Your Business Name"
                  value={payment.accountNumber}
                  onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })}
                  className={inputCls(!!errors.accountNumber)}
                />
              </Field>
            )}

            {(payment.methodType === 'POCHI' || payment.methodType === 'SEND_MONEY') && (
              <Field label="Phone Number *" error={errors.phoneNumber}>
                <input
                  type="text"
                  placeholder="0712345678"
                  value={payment.phoneNumber}
                  onChange={(e) => setPayment({ ...payment, phoneNumber: e.target.value })}
                  className={inputCls(!!errors.phoneNumber)}
                />
              </Field>
            )}

            <Field label="Display Label (Optional)">
              <input
                type="text"
                placeholder="e.g. Main M-Pesa"
                value={payment.displayLabel}
                onChange={(e) => setPayment({ ...payment, displayLabel: e.target.value })}
                className={inputCls(false)}
              />
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-gold" />
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Review & Submit</h2>
            </div>

            <div className="space-y-4 text-sm">
              <ReviewBlock title="Business">
                <p><strong>Name:</strong> {business.businessName}</p>
                <p><strong>Type:</strong> {business.organizerType}</p>
                <p><strong>Phone:</strong> {business.phone}</p>
                <p><strong>KRA PIN:</strong> <span className="font-mono">{business.kraPin}</span></p>
              </ReviewBlock>

              <ReviewBlock title="Documents">
                <ul className="space-y-1">
                  {documents.map((d, i) => (
                    <li key={i}><strong>{d.type.replace('_', ' ')}:</strong> {d.fileName}</li>
                  ))}
                </ul>
              </ReviewBlock>

              <ReviewBlock title="Payment">
                <p><strong>Method:</strong> {payment.methodType}</p>
                {payment.shortcode && <p><strong>Shortcode:</strong> {payment.shortcode}</p>}
                {payment.accountNumber && <p><strong>Account:</strong> {payment.accountNumber}</p>}
                {payment.phoneNumber && <p><strong>Phone:</strong> {payment.phoneNumber}</p>}
              </ReviewBlock>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between gap-3 pt-2">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {step < 4 ? (
          <button
            onClick={goNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[0.7rem] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
      <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">{title}</p>
      <div className="text-slate-700 dark:text-slate-300 space-y-1">{children}</div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-colors border ${
    hasError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-gold'
  }`;
}
