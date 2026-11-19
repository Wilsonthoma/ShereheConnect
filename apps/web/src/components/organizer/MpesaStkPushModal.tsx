'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, Smartphone, X } from 'lucide-react';
import {
  InitiateSubscriptionStkPushResponse,
  isValidKenyanMpesaPhone,
  normalizeKenyanPhone,
  paymentsApi,
} from '@/lib/paymentsApi';
import { SubscriptionPlan } from '@/lib/organizerApi';
import { toast } from '@/lib/toast';

interface MpesaStkPushModalProps {
  plan: SubscriptionPlan | null;
  initialPhone?: string | null;
  onClose: () => void;
  onRefreshSubscription: () => Promise<void> | void;
}

export function MpesaStkPushModal({
  plan,
  initialPhone,
  onClose,
  onRefreshSubscription,
}: MpesaStkPushModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('254708374149');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stkResponse, setStkResponse] =
    useState<InitiateSubscriptionStkPushResponse | null>(null);

  useEffect(() => {
    if (plan) {
      setError(null);
      setStkResponse(null);
      if (initialPhone && isValidKenyanMpesaPhone(initialPhone)) {
        setPhoneNumber(normalizeKenyanPhone(initialPhone));
      } else {
        setPhoneNumber('254708374149');
      }
    }
  }, [plan, initialPhone]);

  if (!plan) return null;

  const checkoutRequestId =
    stkResponse?.checkoutRequestId || stkResponse?.CheckoutRequestID || null;
  const customerMessage =
    stkResponse?.customerMessage ||
    stkResponse?.CustomerMessage ||
    stkResponse?.message ||
    'STK Push sent to your phone. Enter your M-Pesa PIN to complete payment.';

  const handleSendStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidKenyanMpesaPhone(phoneNumber)) {
      setError('Enter a valid Safaricom/Airtel number (e.g. 254708374149 or 0708374149).');
      return;
    }

    const formattedPhone = normalizeKenyanPhone(phoneNumber);
    setSubmitting(true);

    try {
      const response = await paymentsApi.initiateSubscriptionStkPush({
        planCode: plan.code,
        phoneNumber: formattedPhone,
      });
      setStkResponse(response);
      toast.success('M-Pesa prompt sent', `Check ${formattedPhone} to enter your PIN.`);
    } catch (err: any) {
      const message = err?.message || 'Failed to initiate M-Pesa STK Push.';
      setError(message);
      toast.error('STK Push failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshSubscription();
      toast.success('Subscription refreshed');
    } catch (err: any) {
      toast.error('Could not refresh subscription', err?.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stk-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="stk-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Pay with M-Pesa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {plan.name} ({plan.code}) • KES {plan.priceKes.toLocaleString()} /{' '}
                {plan.billingInterval.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSendStkPush} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="mpesa-phone-input"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              M-Pesa Phone Number
            </label>
            <input
              id="mpesa-phone-input"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="254708374149"
              disabled={submitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Normalized format:{' '}
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {normalizeKenyanPhone(phoneNumber) || '—'}
              </span>
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {stkResponse && (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="flex items-start gap-2 font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{customerMessage}</span>
              </div>
              {checkoutRequestId && (
                <p className="font-mono text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Request ID: {checkoutRequestId}
                </p>
              )}
              <p className="text-emerald-800/90 dark:text-emerald-300/90">
                After entering your PIN on your phone, click below to check your updated plan status.
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/60 disabled:opacity-60 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking status...' : 'Refresh subscription status'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Sending prompt...' : `Send STK Push (KES ${plan.priceKes.toLocaleString()})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}