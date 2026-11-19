'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Loader2, Smartphone, X, XCircle } from 'lucide-react';
import {
  StkPushResponse,
  PaymentStatusResponse,
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
  const [error, setError] = useState<string | null>(null);

  const [stkResponse, setStkResponse] = useState<StkPushResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (plan) {
      setError(null);
      setStkResponse(null);
      setPaymentStatus(null);
      if (initialPhone && isValidKenyanMpesaPhone(initialPhone)) {
        setPhoneNumber(normalizeKenyanPhone(initialPhone));
      } else {
        setPhoneNumber('254708374149');
      }
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [plan, initialPhone]);

  // FAST POLLING: Check status every 1.5 seconds
  useEffect(() => {
    if (stkResponse?.checkoutRequestId && !paymentStatus) {
      pollingInterval.current = setInterval(async () => {
        try {
          const statusRes = await paymentsApi.checkPaymentStatus(stkResponse.checkoutRequestId);

          if (statusRes.status === 'SUCCESS' || statusRes.status === 'FAILED' || statusRes.status === 'MISMATCHED') {
            setPaymentStatus(statusRes);
            if (pollingInterval.current) clearInterval(pollingInterval.current);

            if (statusRes.status === 'SUCCESS') {
              toast.success('Payment Successful!', `Receipt: ${statusRes.mpesaReceipt}`);

              // INSTANT UPDATE: Refresh dashboard and close modal immediately
              await onRefreshSubscription();
              onClose();
            } else {
              toast.error('Payment Failed', statusRes.failureReason || 'The transaction failed.');
            }
          }
        } catch (err) {
          // Silent catch
        }
      }, 1500); // 1.5 seconds for instant feel
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [stkResponse, paymentStatus, onRefreshSubscription, onClose]);

  if (!plan) return null;

  const handleSendStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidKenyanMpesaPhone(phoneNumber)) {
      setError('Enter a valid M-Pesa phone number.');
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 transition-colors">

        {/* Header */}
        <div className="relative flex flex-col items-center text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <Smartphone className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pay with M-Pesa</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {plan.name} ({plan.code}) • KES {plan.priceKes.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSendStkPush} className="mt-5 space-y-4 text-center">
          {!stkResponse ? (
            <>
              {/* Input State */}
              <div className="flex flex-col items-center">
                <label className="mb-1.5 block text-center text-sm font-medium text-slate-700 dark:text-slate-200">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-center text-sm text-slate-900 focus:border-gold focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white transition-colors"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-bold text-white hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 transition-all"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Sending prompt...' : `Send STK Push (KES ${plan.priceKes.toLocaleString()})`}
              </button>
            </>
          ) : (
            <div className="space-y-5">
              {/* Polling State */}
              {!paymentStatus ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl animate-pulse" />
                    <Smartphone className="h-12 w-12 text-gold animate-bounce relative z-10" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Check Your Phone</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] text-center">
                    Enter your M-Pesa PIN to complete the payment for <strong>KES {plan.priceKes.toLocaleString()}</strong>.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying instantly...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Success State (Fallback if something goes wrong with instant close) */}
                  {paymentStatus.status === 'SUCCESS' && (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Payment Successful</h4>
                    </div>
                  )}

                  {/* Failed State */}
                  {(paymentStatus.status === 'FAILED' || paymentStatus.status === 'MISMATCHED') && (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Payment Failed</h4>
                      <p className="text-sm text-red-500 mb-4 text-center">{paymentStatus.failureReason}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setStkResponse(null);
                          setPaymentStatus(null);
                        }}
                        className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}