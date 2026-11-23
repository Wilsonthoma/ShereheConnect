import { api } from './api';
import { getToken } from './auth';
import {
  isValidKenyanMpesaPhone,
  normalizeKenyanPhone,
  SubscriptionPlanCode,
} from './paymentsApi';

export { isValidKenyanMpesaPhone, normalizeKenyanPhone };

export type OrganizerType = 'INDIVIDUAL' | 'BUSINESS' | 'NGO';
export type KycStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'NEEDS_REVISION';
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
  activeSubscription: {
    id: string;
    status: string;
  } | null;
}

export interface SubscriptionPlan {
  id: string;
  code: SubscriptionPlanCode;
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
  planCode: SubscriptionPlanCode;
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