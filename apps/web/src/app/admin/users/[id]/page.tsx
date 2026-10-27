'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, ShieldCheck, Ban, CheckCircle2, 
  LogOut, Trash2, AlertCircle, Laptop
} from 'lucide-react';
import { adminUsersApi, AdminUserDetail, UserStatus } from '@/lib/usersApi';
import { toast } from '@/lib/toast';

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300',
  ORGANIZER: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  ATTENDEE: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  SUSPENDED: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  DELETED: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300',
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Suspension Modal State
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminUsersApi.detail(id);
      setUser(data);
    } catch (err: any) {
      toast.error('Failed to load user', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatus = async (next: UserStatus, reason?: string) => {
    if (next === 'DELETED' && !window.confirm('Soft-delete this user?')) return;
    
    setBusy('status');
    try {
      await adminUsersApi.updateStatus(id, next, reason);
      toast.success('Status updated');
      setSuspendModalOpen(false);
      setSuspendReason('');
      await load();
    } catch (err: any) {
      toast.error('Update failed', err?.message);
    } finally {
      setBusy(null);
    }
  };

  const handleVerifyEmail = async () => {
    setBusy('verify');
    try {
      await adminUsersApi.verifyEmail(id);
      toast.success('Email verified');
      await load();
    } catch (err: any) {
      toast.error('Verify failed', err?.message);
    } finally {
      setBusy(null);
    }
  };

  const handleRevokeSessions = async () => {
    if (!window.confirm('Force logout this user from all devices?')) return;
    setBusy('sessions');
    try {
      const res = await adminUsersApi.revokeSessions(id);
      toast.success('Sessions revoked', `${res.revoked} session(s) ended.`);
      await load();
    } catch (err: any) {
      toast.error('Failed', err?.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <p className="text-slate-500">User not found.</p>
        <button
          onClick={() => router.push('/admin/users')}
          className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-orange font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/users')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.fullName} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xl font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            {user.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 truncate">
              {user.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded text-[0.65rem] font-bold uppercase ${ROLE_STYLES[user.role]}`}>
                {user.role}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[0.65rem] font-bold uppercase ${STATUS_STYLES[user.status]}`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Main */}
        <div className="space-y-6 min-w-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">Contact</h2>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-gold shrink-0" /> {user.email}
              </p>
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-gold shrink-0" /> {user.phone}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Active Sessions</h2>
              <button
                onClick={handleRevokeSessions}
                disabled={busy === 'sessions'}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" /> Force logout all
              </button>
            </div>
            {!user.loginSessions || user.loginSessions.length === 0 ? (
              <p className="text-sm text-slate-500">No active sessions.</p>
            ) : (
              <ul className="space-y-2">
                {user.loginSessions.map((s: any) => (
                  <li key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{s.deviceLabel || s.userAgent || 'Unknown device'}</p>
                      <p className="text-xs text-slate-500">{s.ipAddress || '—'} · last active {new Date(s.lastActiveAt).toLocaleString('en-KE')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar actions */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">Actions</h3>

            {!user.emailVerified && (
              <button onClick={handleVerifyEmail} disabled={busy === 'verify'} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 transition-all">
                <ShieldCheck className="w-4 h-4" /> Verify Email
              </button>
            )}

            {user.status === 'ACTIVE' && (
              <button onClick={() => setSuspendModalOpen(true)} disabled={busy === 'status'} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm font-semibold hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-colors">
                <Ban className="w-4 h-4" /> Suspend User
              </button>
            )}

            {user.status === 'SUSPENDED' && (
              <button onClick={() => handleStatus('ACTIVE')} disabled={busy === 'status'} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-500 hover:text-white disabled:opacity-50 transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Reactivate
              </button>
            )}

            {user.status !== 'DELETED' && (
              <button onClick={() => handleStatus('DELETED')} disabled={busy === 'status'} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete User
              </button>
            )}

            <Link href="/admin/users" className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Back to list
            </Link>
          </div>
        </aside>
      </div>

      {/* Suspension Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && setSuspendModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Suspend User</h3>
            <p className="text-sm text-slate-500 mb-4">You are about to suspend <strong>{user.fullName}</strong>.</p>

            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Reason for Suspension *</label>
            <select
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold text-sm mb-4"
            >
              <option value="">Select a reason...</option>
              <option value="Violation of platform terms">Violation of platform terms</option>
              <option value="Fraudulent or misleading KYC documents">Fraudulent or misleading KYC documents</option>
              <option value="Multiple attendee complaints">Multiple attendee complaints</option>
              <option value="Failure to fulfil event obligations">Failure to fulfil event obligations</option>
            </select>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setSuspendModalOpen(false)} disabled={busy} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleStatus('SUSPENDED', suspendReason)} disabled={busy || !suspendReason} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {busy ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
