'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from '@/lib/toast';

type NormalizedPaymentMethodType = 'PAYBILL' | 'TILL' | 'PHONE';

interface OrganizerPaymentMethodInfo {
  methodType?: string | null;
  shortcode?: string | null;
  accountNumber?: string | null;
  phoneNumber?: string | null;
  displayLabel?: string | null;
}

interface BookingWithPayment extends Omit<BookingRecord, 'event'> {
  user?: {
    phone?: string | null;
  } | null;
  event?: Partial<BookingRecord['event']> & {
    id?: string;
    title?: string;
    slug?: string;
    startsAt?: string;
    venueName?: string | null;
    organizer?: {
      id?: string;
      businessName?: string | null;
      paymentMethod?: OrganizerPaymentMethodInfo | null;
      paymentMethods?: OrganizerPaymentMethodInfo[] | null;
    } | null;
  };
}

const MAX_HOLD_MS = 5 * 60 * 1000; // 5-minute reservation hold
const POLL_INTERVAL_MS = 3000;

function normalizeMethodType(raw?: string | null): NormalizedPaymentMethodType {
  const upper = (raw || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
  if (upper.includes('TILL') || upper.includes('BUY_GOODS')) return 'TILL';
  if (
    upper.includes('PHONE') ||
    upper.includes('POCHI') ||
    upper.includes('SEND_MONEY') ||
    upper.includes('STK') ||
    upper.includes('MOBILE') ||
    upper.includes('P2P')
  ) {
    return 'PHONE';
  }
  return 'PAYBILL';
}

function extractPaymentMethod(booking: BookingWithPayment | null) {
  const org = booking?.event?.organizer;
  const activeMethod =
    org?.paymentMethod ??
    (Array.isArray(org?.paymentMethods)
      ? org.paymentMethods.find((m) => Boolean(m))
      : undefined);

  const type = normalizeMethodType(activeMethod?.methodType);
  const envPaybill = process.env.NEXT_PUBLIC_MPESA_PAYBILL?.trim() || '400200';
  const envTill = process.env.NEXT_PUBLIC_MPESA_TILL?.trim() || '';
  const envPhone = process.env.NEXT_PUBLIC_MPESA_PHONE?.trim() || '';

  if (type === 'TILL') {
    return {
      type,
      numberOrCode:
        activeMethod?.shortcode?.trim() ||
        activeMethod?.accountNumber?.trim() ||
        envTill ||
        envPaybill,
      accountNumber: null,
      displayLabel: activeMethod?.displayLabel?.trim() || null,
    };
  }

  if (type === 'PHONE') {
    return {
      type,
      numberOrCode:
        activeMethod?.phoneNumber?.trim() ||
        activeMethod?.shortcode?.trim() ||
        envPhone ||
        envPaybill,
      accountNumber: null,
      displayLabel: activeMethod?.displayLabel?.trim() || null,
    };
  }

  return {
    type: 'PAYBILL' as const,
    numberOrCode:
      activeMethod?.shortcode?.trim() ||
      activeMethod?.phoneNumber?.trim() ||
      envPaybill,
    accountNumber:
      activeMethod?.accountNumber?.trim() ||
      booking?.user?.phone?.trim() ||
      booking?.attendee?.phone?.trim() ||
      booking?.bookingReference ||
      '',
    displayLabel: activeMethod?.displayLabel?.trim() || null,
  };
}

function getSafaricomSteps(type: NormalizedPaymentMethodType): string[] {
  if (type === 'TILL') {
    return [
      'Dial *334# or open the M-Pesa app.',
      'Select Lipa na M-Pesa -> Buy Goods and Services.',
      'Enter the Till Number and exact KES Amount, then enter your M-Pesa PIN.',
    ];
  }
  if (type === 'PHONE') {
    return [
      'Dial *334# or open the M-Pesa app.',
      'Select Send Money (or Pochi la Biashara if indicated by the label).',
      'Enter the Phone Number and exact KES Amount, then enter your M-Pesa PIN.',
    ];
  }
  return [
    'Dial *334# or open the M-Pesa app.',
    'Select Lipa na M-Pesa -> Pay Bill.',
    'Enter the Paybill Business Number, Account Number, and exact KES Amount, then enter your M-Pesa PIN.',
  ];
}

function formatCountdown(remainingMs: number): string {
  const clamped = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface SmsVerificationCardProps {
  smsText: string;
  verifying: boolean;
  errorMsg: string | null;
  onSmsChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function MpesaSmsVerificationCardImpl({
  smsText,
  verifying,
  errorMsg,
  onSmsChange,
  onSubmit,
}: SmsVerificationCardProps) {
  return (
    <div className="bg-white dark:bg-[#3A3A3A] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-900 dark:text-white">
          Paste M-Pesa Confirmation SMS
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          After paying on your phone, copy the M-Pesa confirmation message and
          paste it below to extract and verify your payment.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          rows={3}
          value={smsText}
          onChange={(e) => onSmsChange(e.target.value)}
          placeholder="Paste your M-Pesa confirmation SMS here..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#2B2B2B] p-3 text-sm text-slate-900 dark:text-white focus:border-[#29ABE2] focus:outline-none resize-none"
          required
        />

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={verifying}
          disabled={verifying || !smsText.trim()}
          className="w-full gap-2 py-3 bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none font-bold rounded-xl"
        >
          {!verifying && <ShieldCheck className="w-5 h-5" />}
          {verifying
            ? 'Verifying Message...'
            : 'Verify Payment & Proceed to Tickets'}
        </Button>
      </form>
    </div>
  );
}

const MpesaSmsVerificationCard = dynamic(
  () => Promise.resolve(MpesaSmsVerificationCardImpl),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-[#3A3A3A] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 h-48 animate-pulse" />
    ),
  },
);

export default function BookingPaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bookingId = params?.id ?? '';
  const { language } = useLanguage();
  const isSw = language === 'sw';
  const localeTag = isSw ? 'sw-KE' : 'en-KE';

  const [booking, setBooking] = useState<BookingWithPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [smsText, setSmsText] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    'Transaction & booking complete — proceed to your tickets page.',
  );

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(localeTag),
    [localeTag],
  );
  const formatKes = useCallback(
    (amount: number) => `KES ${numberFormatter.format(Math.max(0, amount))}`,
    [numberFormatter],
  );

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const copyValue = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedField((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Clipboard access denied or unavailable
    }
  }, []);

  const fetchLatestBooking = useCallback(
    async (silent = false) => {
      if (!bookingId) return null;
      try {
        const latest = (await bookingsApi.getBookingById(
          bookingId,
        )) as BookingWithPayment;
        setBooking(latest);
        setError(null);
        return latest;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load booking payment details.';
        if (
          msg.toLowerCase().includes('unauthorized') ||
          msg.toLowerCase().includes('401')
        ) {
          router.replace(
            `/login?next=${encodeURIComponent(`/bookings/${bookingId}/pay`)}`,
          );
          return null;
        }
        if (!silent) setError(msg);
        return null;
      }
    },
    [bookingId, router],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchLatestBooking(false).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchLatestBooking]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const holdDeadlineMs = useMemo(() => {
    const createdMs = booking?.createdAt
      ? new Date(booking.createdAt).getTime()
      : Date.now();
    const maxCapMs = Number.isNaN(createdMs)
      ? Date.now() + MAX_HOLD_MS
      : createdMs + MAX_HOLD_MS;
    if (booking?.expiresAt) {
      const expMs = new Date(booking.expiresAt).getTime();
      if (!Number.isNaN(expMs)) return Math.min(expMs, maxCapMs);
    }
    return maxCapMs;
  }, [booking?.createdAt, booking?.expiresAt]);

  const remainingMs = Math.max(0, holdDeadlineMs - nowMs);
  const isHoldExpired =
    booking?.status === 'EXPIRED' ||
    booking?.status === 'CANCELLED' ||
    (booking?.status === 'PENDING' && remainingMs <= 0);

  // Poll when tab is visible; pause when hidden; redirect to /tickets on confirmation
  useEffect(() => {
    if (!booking || success) return;
    if (booking.status === 'CONFIRMED') {
      setSuccess(true);
      const timer = window.setTimeout(() => {
        router.replace(`/tickets?bookingId=${encodeURIComponent(bookingId)}`);
      }, 1500);
      return () => window.clearTimeout(timer);
    }
    if (isHoldExpired) return;

    let intervalId: number | null = null;

    const pollOnce = async () => {
      if (document.visibilityState === 'hidden') return;
      const updated = await fetchLatestBooking(true);
      if (updated?.status === 'CONFIRMED') {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
        setSuccess(true);
        window.setTimeout(() => {
          router.replace(`/tickets?bookingId=${encodeURIComponent(bookingId)}`);
        }, 1500);
      }
    };

    const startPolling = () => {
      if (intervalId === null) {
        intervalId = window.setInterval(pollOnce, POLL_INTERVAL_MS);
      }
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void pollOnce();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') {
      startPolling();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [booking, bookingId, isHoldExpired, fetchLatestBooking, router, success]);

  const handleVerifySms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim() || isHoldExpired) return;
    setVerifying(true);
    setErrorMsg(null);

    try {
      const res = await bookingsApi.verifyMpesaSms(bookingId, smsText);
      const nextMsg =
        res.message ||
        'Transaction & booking complete — proceed to your tickets page.';
      setSuccessMessage(nextMsg);
      setSuccess(true);
      toast.success('Transaction & booking complete', nextMsg);
      window.setTimeout(() => {
        router.push(
          res.redirectTo || `/tickets?bookingId=${encodeURIComponent(bookingId)}`,
        );
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to verify M-Pesa message. Please check the text and try again.';
      setErrorMsg(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleSmsChange = useCallback((value: string) => {
    setSmsText(value);
    setErrorMsg((prev) => (prev ? null : prev));
  }, []);

  const paymentInfo = useMemo(() => extractPaymentMethod(booking), [booking]);
  const safaricomSteps = useMemo(
    () => getSafaricomSteps(paymentInfo.type),
    [paymentInfo.type],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-10 transition-colors">
        <div className="container-fluid max-w-2xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading payment instructions...
          </p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-10 space-y-4 transition-colors">
        <div className="container-fluid max-w-2xl space-y-4">
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            {error || 'Booking not found.'}
          </div>
          <Link
            href="/events"
            className="inline-block text-sm font-semibold text-[#29ABE2] hover:text-[#1A8CC4]"
          >
            Back to events
          </Link>
        </div>
      </main>
    );
  }

  const backToEventHref = booking.event?.slug
    ? `/events/${encodeURIComponent(booking.event.slug)}`
    : '/events';

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-12 px-4 transition-colors flex justify-center items-center">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center space-y-4 max-w-md w-full">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
            Transaction &amp; Booking Complete
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {successMessage}
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-8 transition-colors">
      <div className="container-fluid max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1A8CC4] dark:text-[#29ABE2]">
              Complete Ticket Payment
            </p>
            <h1
              style={{ fontFamily: "'Kaushan Script', cursive" }}
              className="text-3xl text-slate-900 dark:text-white"
            >
              {booking.event?.title || 'Event Ticket Payment'}
            </h1>
          </div>
          <Link
            href={backToEventHref}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#29ABE2]"
          >
            ← Back to event
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3.5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reservation Status
              </p>
              <span className="mt-1 inline-block rounded-full bg-slate-100 dark:bg-[#2B2B2B] px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                {booking.status}
              </span>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hold Countdown (5 min limit)
              </p>
              {isHoldExpired ? (
                <span className="mt-1 inline-block rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                  Expired • Hold Released
                </span>
              ) : (
                <span className="mt-1 inline-block font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
                  {formatCountdown(remainingMs)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-[#2B2B2B] p-3">
              <span className="text-slate-500 dark:text-slate-400 block">
                Tier
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {booking.ticketTier.name}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-[#2B2B2B] p-3">
              <span className="text-slate-500 dark:text-slate-400 block">
                Quantity
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {booking.quantity}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-[#2B2B2B] p-3 col-span-2 sm:col-span-1">
              <span className="text-slate-500 dark:text-slate-400 block">
                Total Amount
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {formatKes(booking.totalAmountKes)}
              </span>
            </div>
          </div>

          {isHoldExpired ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 space-y-3 text-xs text-red-700 dark:text-red-300">
              <p className="font-semibold text-sm">
                Your 5-minute reservation expired and the held ticket capacity
                has been released.
              </p>
              <Link href={backToEventHref} className="inline-block">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-full px-5 py-2 text-xs"
                >
                  Reserve Again
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#29ABE2]/40 bg-[#E0F2FE]/50 dark:bg-[#2B2B2B] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pay via {paymentInfo.type}
                  </h2>
                  {paymentInfo.displayLabel && (
                    <span className="rounded-full bg-[#29ABE2]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#1A8CC4] dark:text-[#29ABE2]">
                      {paymentInfo.displayLabel}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-[#3A3A3A] px-3 py-2 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {paymentInfo.type === 'PAYBILL'
                          ? 'Paybill Business Number'
                          : paymentInfo.type === 'TILL'
                            ? 'Till Number'
                            : 'Phone Number'}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {paymentInfo.numberOrCode}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyValue('target', paymentInfo.numberOrCode)}
                      className="rounded-md px-2.5 py-1 h-auto text-[11px] font-semibold"
                    >
                      {copiedField === 'target' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>

                  {paymentInfo.type === 'PAYBILL' && paymentInfo.accountNumber && (
                    <div className="flex items-center justify-between rounded-lg bg-white dark:bg-[#3A3A3A] px-3 py-2 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          Account Number
                        </span>
                        <span className="font-mono text-sm font-bold text-[#1A8CC4] dark:text-[#29ABE2]">
                          {paymentInfo.accountNumber}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyValue('account', paymentInfo.accountNumber || '')
                        }
                        className="rounded-md px-2.5 py-1 h-auto text-[11px] font-semibold"
                      >
                        {copiedField === 'account' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-[#3A3A3A] px-3 py-2 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Amount (KES)
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {booking.totalAmountKes}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyValue('amount', String(booking.totalAmountKes))
                      }
                      className="rounded-md px-2.5 py-1 h-auto text-[11px] font-semibold"
                    >
                      {copiedField === 'amount' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  {safaricomSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <MpesaSmsVerificationCard
                smsText={smsText}
                verifying={verifying}
                errorMsg={errorMsg}
                onSmsChange={handleSmsChange}
                onSubmit={handleVerifySms}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}