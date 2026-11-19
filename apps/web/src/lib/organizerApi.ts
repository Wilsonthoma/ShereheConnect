import { api } from './api';
import { getToken } from './auth';

export type OrganizerType = 'INDIVIDUAL' | 'BUSINESS' | 'NGO';
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REVISION';
export type PaymentMethodType = 'PAYBILL' | 'TILL' | 'POCHI' | 'SEND_MONEY';
export type KycDocType = 'BUSINESS_PERMIT' | 'NATIONAL_ID' | 'OTHER';

export interface KycDocument {
  type: KycDocType;
  url: string;
  fileName: string;
}

export interface OrganizerPaymentMethod {
  id: string;
  methodType: PaymentMethodType;
  shortcode: string | null;
  accountNumber: string | null;
  phoneNumber: string | null;
  displayLabel: string | null;
  c2bRegistered: boolean;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  businessName: string;
  bio: string | null;
  logoUrl: string | null;
  phone: string | null;
  kraPin: string | null;
  organizerType: OrganizerType;
  county: string;
  kycStatus: KycStatus;
  kycNotes: string | null;
  kycReviewedAt: string | null;
  kycDocuments: KycDocument[] | null;
  averageRating: string | number;
  completedEvents: number;
  disputeCount: number;
  createdAt: string;
  updatedAt: string;
  submitted: boolean;
  paymentMethods: OrganizerPaymentMethod[];
  activeSubscription: any | null;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  priceKes: number;
  billingInterval: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  maxEventsPerMonth: number | null;
  maxAttendeesEvent: number | null;
}

export interface SubscriptionOverview {
  activeSubscription: {
    id: string;
    currentPeriodEnd: string;
    plan: SubscriptionPlan;
  } | null;
  eventsThisMonth: number;
  plans: SubscriptionPlan[];
}

export interface SubmitProfileInput {
  businessName: string;
  organizerType: OrganizerType;
  county: string;
  bio?: string;
  logoUrl?: string;
  phone: string;
  kraPin: string;
  kycDocuments: KycDocument[];
  paymentMethod: AddPaymentMethodInput;
}

export interface AddPaymentMethodInput {
  methodType: PaymentMethodType;
  shortcode?: string;
  accountNumber?: string;
  phoneNumber?: string;
  displayLabel?: string;
}

export interface InitiateSubscriptionStkPushInput {
  planCode: string;
  phoneNumber: string;
}

export interface InitiateSubscriptionStkPushResponse {
  message?: string;
  checkoutRequestId?: string;
  CheckoutRequestID?: string;
  merchantRequestId?: string;
  MerchantRequestID?: string;
  customerMessage?: string;
  CustomerMessage?: string;
  responseCode?: string;
  ResponseCode?: string;
  responseDescription?: string;
  ResponseDescription?: string;
}

export function normalizeKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
  if ((digits.startsWith('7') || digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1')))) {
    return `254${digits}`;
  }
  return digits;
}

export function isValidKenyanMpesaPhone(phone: string): boolean {
  const normalized = normalizeKenyanPhone(phone);
  return /^254[17]\d{8}$/.test(normalized);
}

function token(): string | null {
  return getToken();
}

export const organizerApi = {
  getProfile: () =>
    api.get<OrganizerProfile>('/organizer/profile', token()),

  getVerificationStatus: () =>
    api.get<{ kycStatus: KycStatus }>('/organizer/profile/status', token()),

  getSubscription: () =>
    api.get<SubscriptionOverview>('/organizer/subscription', token()),

  submitProfile: (dto: SubmitProfileInput) =>
    api.post<OrganizerProfile>('/organizer/profile/submit', dto, token()),

  listPaymentMethods: () =>
    api.get<OrganizerPaymentMethod[]>('/organizer/payment-methods', token()),

  addPaymentMethod: (dto: AddPaymentMethodInput) =>
    api.post<OrganizerPaymentMethod>('/organizer/payment-methods', dto, token()),

  deletePaymentMethod: (id: string) =>
    api.delete<{ success: boolean }>(
      `/organizer/payment-methods/${id}`,
      token(),
    ),

  initiateSubscriptionStkPush: (dto: InitiateSubscriptionStkPushInput) =>
    api.post<InitiateSubscriptionStkPushResponse>(
      '/payments/subscriptions/stk-push',
      {
        planCode: dto.planCode,
        phoneNumber: normalizeKenyanPhone(dto.phoneNumber),
      },
      token(),
    ),
};