'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Eye, ShieldCheck, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { adminOrganizersApi } from '@/lib/adminOrganizersApi';
import { FullPageLoader } from '@/components/ui';
import { toast } from '@/lib/toast';

const KYC_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  VERIFIED: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  NEEDS_REVISION: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300',
  REJECTED: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
};

const KYC_ICONS: Record<string, any> = {
  PENDING: Clock,
  VERIFIED: ShieldCheck,
  NEEDS_REVISION: AlertTriangle,
  REJECTED: XCircle,
};

export default function AdminOrganizersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminOrganizersApi
      .list()
      .then(setItems)
      .catch((err) => toast.error('Failed to load', err?.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">
          Organizers
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review KYC, business info, and payment methods.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <FullPageLoader message="Loading organizers..." />
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">No organizers found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Business</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">KYC Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Payment</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => {
                  const Icon = KYC_ICONS[o.kycStatus] || Clock;
                  const kycClass = KYC_STYLES[o.kycStatus] || KYC_STYLES.PENDING;
                  return (
                    <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{o.businessName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{o.user?.email} · {o.county}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase ${kycClass}`}>
                          <Icon className="w-3 h-3" /> {o.kycStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${o.paymentMethods?.some((p:any)=>p.isActive) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {o.paymentMethods?.some((p:any)=>p.isActive) ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/organizers/${o.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
