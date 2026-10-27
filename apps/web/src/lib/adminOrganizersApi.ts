import { api } from './api';
import { getToken } from './auth';
import type { OrganizerProfile } from './organizerApi';

export const adminOrganizersApi = {
  list: () =>
    api.get<(OrganizerProfile & { user: any })[]>('/admin/organizers', getToken()),

  detail: (id: string) =>
    api.get<OrganizerProfile & { user: any }>(`/admin/organizers/${id}`, getToken()),

  reviewKyc: (id: string, kycStatus: string, notes?: string) =>
    api.patch(`/admin/organizers/${id}/kyc`, { kycStatus, notes }, getToken()),

  approvePaymentMethod: (id: string) =>
    api.patch(`/admin/organizers/payment-methods/${id}/approve`, {}, getToken()),
};
