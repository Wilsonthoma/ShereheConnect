'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi, type BookingRecord } from '@/lib/bookingsApi';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type NormalizedPaymentMethodType = 'PAYBILL' | 'TILL' | 'PHONE';

interface OrganizerPaymentMethodInfo {
  methodType?: string | null;
  shortcode?: string | null;
  accountNumber?: string | null;
  phoneNumber?: string | null;
  displayLabel?: string | null;
}

interface BookingWithPayment extends BookingRecord {
  event?: {
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
  } | null;
}

const MAX_HOLD_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

function normalizeMethodType(raw?: string | null): NormalizedPaymentMethodType {
  const upper = (raw || '').toUpperCase().trim();
  if (upper.includes('TILL') || upper.includes('BUY_GOODS')) {
    return 'TILL';
  }
  if (
    upper.includes('PHONE') ||
    upper.includes('STK') ||
    upper.includes('MOBILE') ||
    upper.includes('P2P')
  ) {
    return 'PHONE';
  }
  return 'PAYBILL';
}

function extractPaymentMethod(
  booking: BookingWithPayment | null,
): {
  type: NormalizedPaymentMethodType;
  numberOrCode: string;
  displayLabel: string | null;
  useBookingRefAsAccount: boolean;
} {
  const org = booking?.event?.organizer;
  const activeMethod: OrganizerPaymentMethodInfo | undefined =
    org?.paymentMethod ??
    (Array.isArray(org?.paymentMethods)
      ? org.paymentMethods.find((m) => Boolean(m))
      : undefined);

  const type = normalizeMethodType(activeMethod?.methodType);
  const envPaybill = process.env.NEXT_PUBLIC_MPESA_PAYBILL?.trim() || '522522';
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
      displayLabel: activeMethod?.displayLabel?.trim() || null,
      useBookingRefAsAccount: false,
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
      displayLabel: activeMethod?.displayLabel?.trim() || null,
      useBookingRefAsAccount: false,
    };
  }

  return {
    type: 'PAYBILL',
    numberOrCode:
      activeMethod?.shortcode?.trim() ||
      activeMethod?.phoneNumber?.trim() ||
      envPaybill,
    displayLabel: activeMethod?.displayLabel?.trim() || null,
    useBookingRefAsAccount: true,
  };
}

function formatCountdown(remainingMs: number): string {
  const clamped = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [checkingNow, setCheckingNow] = useState(false);

  const copyTimeoutRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

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
      // Clipboard fallback ignored if blocked by browser context
    }
  }, []);

  const fetchLatestBooking = useCallback(
    async (silent = false) => {
      if (!bookingId || inFlightRef.current) return null;
      inFlightRef.current = true;
      if (!silent) setCheckingNow(true);
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
            : isSw
              ? 'Imeshindwa kupakia maelezo ya malipo.'
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
        if (!silent) {
          setError(msg);
        }
        return null;
      } finally {
        inFlightRef.current = false;
        if (!silent) setCheckingNow(false);
      }
    },
    [bookingId, isSw, router],
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
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
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
      if (!Number.isNaN(expMs)) {
        return Math.min(expMs, maxCapMs);
      }
    }
    return maxCapMs;
  }, [booking?.createdAt, booking?.expiresAt]);

  const remainingMs = Math.max(0, holdDeadlineMs - nowMs);
  const isHoldExpired =
    booking?.status === 'EXPIRED' ||
    booking?.status === 'CANCELLED' ||
    (booking?.status === 'PENDING' && remainingMs <= 0);

  useEffect(() => {
    if (!booking) return;

    if (booking.status === 'CONFIRMED') {
      router.replace('/tickets');
      return;
    }

    if (isHoldExpired) {
      return;
    }

    let intervalId: number | null = null;

    const pollOnce = async () => {
      if (document.visibilityState === 'hidden') return;
      const updated = await fetchLatestBooking(true);
      if (updated?.status === 'CONFIRMED') {
        if (intervalId !== null) window.clearInterval(intervalId);
        router.replace('/tickets');
      }
    };

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = window.setInterval(pollOnce, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNowMs(Date.now());
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
  }, [booking, isHoldExpired, fetchLatestBooking, router]);

  const paymentInfo = useMemo(() => extractPaymentMethod(booking), [booking]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-10 transition-colors">
        <div className="container-fluid max-w-2xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isSw
              ? 'Inapakia ukurasa wa malipo...'
              : 'Loading payment instructions...'}
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
            {error ||
              (isSw ? 'Uhifadhi haujapatikana.' : 'Booking not found.')}
          </div>
          <Link
            href="/events"
            className="inline-block text-sm font-semibold text-[#29ABE2] hover:text-[#1A8CC4]"
          >
            {isSw ? 'Rudi kwenye matukio' : 'Back to events'}
          </Link>
        </div>
      </main>
    );
  }

  const eventSlug = booking.event?.slug || '';
  const backToEventHref = eventSlug
    ? `/events/${encodeURIComponent(eventSlug)}`
    : '/events';

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#2B2B2B] py-8 transition-colors">
      <div className="container-fluid max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1A8CC4] dark:text-[#29ABE2]">
              {isSw ? 'Hatua ya Malipo' : 'Complete Ticket Payment'}
            </p>
            <h1
              style={{ fontFamily: "'Kaushan Script', cursive" }}
              className="text-3xl text-slate-900 dark:text-white"
            >
              {booking.event?.title ||
                (isSw ? 'Malipo ya Tiketi' : 'Event Ticket Payment')}
            </h1>
          </div>
          <Link
            href={backToEventHref}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#29ABE2]"
          >
            {isSw ? '← Rudi kwenye tukio' : '← Back to event'}
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#3A3A3A] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3.5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSw
                  ? 'Nambari ya Kumbukumbu (Unique Code)'
                  : 'Unique Booking Reference'}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#1A8CC4] dark:text-[#29ABE2]">
                  {booking.bookingReference}
                </span>
                <button
                  type="button"
                  onClick={() => copyValue('ref', booking.bookingReference)}
                  className="rounded-md border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-[#29ABE2]"
                >
                  {copiedField === 'ref'
                    ? isSw
                      ? 'Imenakiliwa'
                      : 'Copied'
                    : isSw
                      ? 'Nakili'
                      : 'Copy'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHoldExpired
                  ? isSw
                    ? 'Hali ya Nafasi'
                    : 'Hold Status'
                  : isSw
                    ? 'Muda Uliobaki (Max 15 min)'
                    : 'Hold Countdown (Max 15 min)'}
              </p>
              {isHoldExpired ? (
                <span className="mt-1 inline-block rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400">
                  {isSw
                    ? 'Muda Umeisha • Nafasi Imeachiliwa'
                    : 'Expired • Hold Released'}
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
                {isSw ? 'Kifurushi' : 'Tier'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {booking.ticketTier.name}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-[#2B2B2B] p-3">
              <span className="text-slate-500 dark:text-slate-400 block">
                {isSw ? 'Idadi' : 'Quantity'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {booking.quantity}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-[#2B2B2B] p-3 col-span-2 sm:col-span-1">
              <span className="text-slate-500 dark:text-slate-400 block">
                {isSw ? 'Kiasi cha Kulipa' : 'Total Amount'}
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {formatKes(booking.totalAmountKes)}
              </span>
            </div>
          </div>

          {isHoldExpired ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 space-y-3 text-xs text-red-700 dark:text-red-300">
              <p className="font-semibold text-sm">
                {isSw
                  ? 'Muda wa kushikilia tiketi umekwisha na nafasi zimeachiliwa.'
                  : 'Your reservation hold expired and the held ticket capacity has been released.'}
              </p>
              <p>
                {isSw
                  ? 'Malipo hayakukamilika ndani ya muda uliowekwa. Unaweza kurudi kwenye ukurasa wa tukio na kuhifadhi tena kama nafasi zipo.'
                  : 'Payment was not completed before the hold timer expired. Return to the event page to place a new reservation if availability remains.'}
              </p>
              <Link
                href={backToEventHref}
                className="btn-coddy inline-flex items-center justify-center px-4 py-2 text-xs"
              >
                {isSw ? 'Hifadhi Tena' : 'Reserve Again'}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#29ABE2]/40 bg-[#E0F2FE]/50 dark:bg-[#2B2B2B] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {paymentInfo.type === 'PAYBILL' &&
                      (isSw
                        ? 'Maagizo ya Malipo: Paybill'
                        : 'Payment Instructions: Paybill')}
                    {paymentInfo.type === 'TILL' &&
                      (isSw
                        ? 'Maagizo ya Malipo: Till Number (Buy Goods)'
                        : 'Payment Instructions: Till Number (Buy Goods)')}
                    {paymentInfo.type === 'PHONE' &&
                      (isSw
                        ? 'Maagizo ya Malipo: Nambari ya Simu'
                        : 'Payment Instructions: Phone / Mobile Money')}
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
                        {paymentInfo.type === 'PAYBILL' &&
                          (isSw
                            ? 'Business / Paybill Number'
                            : 'Paybill Business Number')}
                        {paymentInfo.type === 'TILL' &&
                          (isSw ? 'Till Number' : 'Till Number')}
                        {paymentInfo.type === 'PHONE' &&
                          (isSw
                            ? 'Recipient Phone Number'
                            : 'Recipient Phone Number')}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {paymentInfo.numberOrCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyValue('target', paymentInfo.numberOrCode)
                      }
                      className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-[#29ABE2]"
                    >
                      {copiedField === 'target'
                        ? isSw
                          ? 'Imenakiliwa'
                          : 'Copied'
                        : isSw
                          ? 'Nakili'
                          : 'Copy'}
                    </button>
                  </div>

                  {paymentInfo.type === 'PAYBILL' && (
                    <div className="flex items-center justify-between rounded-lg bg-white dark:bg-[#3A3A3A] px-3 py-2 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {isSw
                            ? 'Account Number (Tumia Nambari Hii)'
                            : 'Account Number (Enter Exact Code)'}
                        </span>
                        <span className="font-mono text-sm font-bold text-[#1A8CC4] dark:text-[#29ABE2]">
                          {booking.bookingReference}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyValue('account', booking.bookingReference)
                        }
                        className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-[#29ABE2]"
                      >
                        {copiedField === 'account'
                          ? isSw
                            ? 'Imenakiliwa'
                            : 'Copied'
                          : isSw
                            ? 'Nakili'
                            : 'Copy'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-[#3A3A3A] px-3 py-2 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {isSw ? 'Kiasi (KES)' : 'Amount (KES)'}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {booking.totalAmountKes}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyValue('amount', String(booking.totalAmountKes))
                      }
                      className="rounded-md border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-[#29ABE2]"
                    >
                      {copiedField === 'amount'
                        ? isSw
                          ? 'Imenakiliwa'
                          : 'Copied'
                        : isSw
                          ? 'Nakili'
                          : 'Copy'}
                    </button>
                  </div>
                </div>

                {paymentInfo.type === 'PAYBILL' && (
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-200">
                    <li>
                      {isSw
                        ? 'Fungua M-Pesa → Lipa na M-Pesa → Paybill.'
                        : 'Open M-Pesa → Lipa na M-Pesa → Paybill.'}
                    </li>
                    <li>
                      {isSw
                        ? `Weka Business Number: ${paymentInfo.numberOrCode}`
                        : `Enter Business Number: ${paymentInfo.numberOrCode}`}
                    </li>
                    <li>
                      {isSw
                        ? `Weka Account Number: ${booking.bookingReference}`
                        : `Enter Account Number: ${booking.bookingReference}`}
                    </li>
                    <li>
                      {isSw
                        ? `Weka Kiasi: ${formatKes(booking.totalAmountKes)} na uweke PIN yako.`
                        : `Enter Amount: ${formatKes(booking.totalAmountKes)} and enter your PIN.`}
                    </li>
                  </ol>
                )}

                {paymentInfo.type === 'TILL' && (
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-200">
                    <li>
                      {isSw
                        ? 'Fungua M-Pesa → Lipa na M-Pesa → Buy Goods and Services.'
                        : 'Open M-Pesa → Lipa na M-Pesa → Buy Goods and Services.'}
                    </li>
                    <li>
                      {isSw
                        ? `Weka Till Number: ${paymentInfo.numberOrCode}`
                        : `Enter Till Number: ${paymentInfo.numberOrCode}`}
                    </li>
                    <li>
                      {isSw
                        ? `Weka Kiasi: ${formatKes(booking.totalAmountKes)} na uweke PIN yako.`
                        : `Enter Amount: ${formatKes(booking.totalAmountKes)} and enter your PIN.`}
                    </li>
                    <li>
                      {isSw
                        ? `Mfumo utathibitisha malipo yako kiotomatiki kwa kulinganisha nambari ya kumbukumbu (${booking.bookingReference}).`
                        : `The system validates your payment automatically against reference ${booking.bookingReference}.`}
                    </li>
                  </ol>
                )}

                {paymentInfo.type === 'PHONE' && (
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-200">
                    <li>
                      {isSw
                        ? 'Fungua M-Pesa → Send Money.'
                        : 'Open M-Pesa → Send Money.'}
                    </li>
                    <li>
                      {isSw
                        ? `Weka Nambari ya Simu: ${paymentInfo.numberOrCode}`
                        : `Enter Phone Number: ${paymentInfo.numberOrCode}`}
                    </li>
                    <li>
                      {isSw
                        ? `Weka Kiasi: ${formatKes(booking.totalAmountKes)} na uweke PIN yako.`
                        : `Enter Amount: ${formatKes(booking.totalAmountKes)} and enter your PIN.`}
                    </li>
                    <li>
                      {isSw
                        ? `Mfumo utathibitisha malipo yako kiotomatiki kwa kulinganisha nambari ya kumbukumbu (${booking.bookingReference}).`
                        : `The system validates your payment automatically against reference ${booking.bookingReference}.`}
                    </li>
                  </ol>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#2B2B2B] px-4 py-3 text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  {isSw
                    ? 'Tunahakiki malipo yako kiotomatiki... Ukithibitishwa utapelekwa kwenye /tickets.'
                    : 'Validating payment automatically against your reference code... You will be redirected to /tickets once confirmed.'}
                </span>
                <button
                  type="button"
                  onClick={() => fetchLatestBooking(false)}
                  disabled={checkingNow}
                  className="font-semibold text-[#1A8CC4] dark:text-[#29ABE2] hover:underline disabled:opacity-50"
                >
                  {checkingNow
                    ? isSw
                      ? 'Inakagua...'
                      : 'Checking...'
                    : isSw
                      ? 'Kagua Sasa'
                      : 'Check Now'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}