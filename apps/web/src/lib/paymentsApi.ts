import { api } from './api';
import { getToken } from './auth';

// --- Types ---
export type SubscriptionPlanCode = 'STARTER' | 'PRO' | 'BUSINESS' | (string & {});

export interface InitiateSubscriptionStkPush {
  planCode: SubscriptionPlanCode;
  phoneNumber: string;
}

export interface StkPushResponse {
  paymentId: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  customerMessage: string;
  amountKes: number;
  plan: {
    code: SubscriptionPlanCode;
    name: string;
    priceKes?: number;
  };
}

export interface PaymentStatusResponse {
  id: string;
  checkoutRequestId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'MISMATCHED';
  amountKes: number;
  mpesaReceipt: string | null;
  failureReason: string | null;
  processedAt: string | null;
  subscription: any | null;
}

// --- API Functions ---
export const paymentsApi = {
  initiateSubscriptionStkPush: async (
    data: InitiateSubscriptionStkPush,
  ): Promise<StkPushResponse> => {
    return api.post<StkPushResponse>(
      '/payments/subscriptions/stk-push',
      {
        ...data,
        phoneNumber: normalizeKenyanPhone(data.phoneNumber),
      },
      getToken(),
    );
  },

  checkPaymentStatus: async (
    checkoutRequestId: string,
  ): Promise<PaymentStatusResponse> => {
    return api.get<PaymentStatusResponse>(
      `/payments/subscriptions/status/${checkoutRequestId}`,
      getToken(),
    );
  },
};

// --- Validation Helpers ---

/**
 * Normalizes various Kenyan phone formats to 254XXXXXXXXX
 * Handles: 0712345678, 0112345678, +254712345678, 254712345678
 */
export function normalizeKenyanPhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+254')) return cleaned.slice(1);
  if (cleaned.startsWith('254')) return cleaned;
  if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
    return `254${cleaned.slice(1)}`;
  }

  // If user just types 712345678 or 112345678
  if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
    return `254${cleaned}`;
  }

  return cleaned;
}

export function isValidKenyanMpesaPhone(phone: string): boolean {
  const normalized = normalizeKenyanPhone(phone);
  // Must start with 254 and be followed by 7 or 1, then 8 digits
  return /^254[17]\d{8}$/.test(normalized);
}