'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, Users, ShieldCheck, UserX, ChevronLeft, ChevronRight,
  Eye, Ban, CheckCircle2, Mail, X
} from 'lucide-react';
import { adminUsersApi, AdminUserListItem, OnlineUser, UserRole, UserStatus } from '@/lib/usersApi';
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

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [busy, setBusy] = useState<string | null>(null);

  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminUsersApi.list({
        q: q || undefined, role: role || undefined, status: status || undefined, page, limit,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      toast.error('Failed to load users', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q, role, status, page]);

  useEffect(() => {
    const fetchOnline = () => adminUsersApi.listOnline().then(setOnline).catch(() => {});
    fetchOnline();
    const t = setInterval(fetchOnline, 30000);
    return () => clearInterval(t);
  }, []);

  const handleStatusChange = async (id: string, next: UserStatus, reason?: string) => {
    if (next === 'DELETED' && !window.confirm('Delete this user?')) return;
    setBusy(id);
    try {
      await adminUsersApi.updateStatus(id, next, reason);
      toast.success('User updated', `Status set to ${next.toLowerCase()}.`);
      setSuspendUserId(null);
      setSuspendReason('');
      await load();
    } catch (err: any) {
      toast.error('Update failed', err?.message);
    } finally {
      setBusy(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-display text-2xl md:text-3xl text-slate-800 dark:text-slate-100 mb-2">Users</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage all accounts.</p>
      </div>

      {online.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">Online now ({online.length})</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {online.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                {u.profileImageUrl ? <img src={u.profileImageUrl} alt={u.fullName} className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[0.6rem] font-bold">{u.fullName.charAt(0).toUpperCase()}</div>}
                <span className="truncate max-w-[120px]">{u.fullName}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total" value={String(total)} />
        <StatCard icon={<ShieldCheck className="w-5 h-5" />} label="Admins" value={String(items.filter((i) => i.role === 'ADMIN').length)} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Active" value={String(items.filter((i) => i.status === 'ACTIVE').length)} />
        <StatCard icon={<UserX className="w-5 h-5" />} label="Suspended" value={String(items.filter((i) => i.status === 'SUSPENDED').length)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <select value={role} onChange={(e) => { setRole(e.target.value as UserRole | ''); setPage(1); }} className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
          <option value="">All roles</option>
          <option value="ATTENDEE">Attendees</option>
          <option value="ORGANIZER">Organizers</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1); }} className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DELETED">Deleted</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" /></div> : items.length === 0 ? <div className="p-12 text-center"><Users className="w-14 h-14 text-slate-300 mx-auto mb-4" /><h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">No users found</h3></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {u.profileImageUrl ? <img src={u.profileImageUrl} alt={u.fullName} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">{u.fullName.charAt(0).toUpperCase()}</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{u.fullName}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`inline-block px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase ${ROLE_STYLES[u.role]}`}>{u.role}</span></td>
                    <td className="px-4 py-3"><span className={`inline-block px-2.5 py-1 rounded text-[0.65rem] font-bold uppercase ${STATUS_STYLES[u.status]}`}>{u.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/users/${u.id}`} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye className="w-4 h-4" /></Link>
                        {u.status === 'ACTIVE' ? (
                          <button onClick={() => setSuspendUserId(u.id)} disabled={busy === u.id} className="p-2 rounded-lg text-amber-500 hover:bg-amber-50"><Ban className="w-4 h-4" /></button>
                        ) : u.status === 'SUSPENDED' ? (
                          <button onClick={() => handleStatusChange(u.id, 'ACTIVE')} disabled={busy === u.id} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50"><CheckCircle2 className="w-4 h-4" /></button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {suspendUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && setSuspendUserId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-2">Suspend User</h3>
            <select value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-4 text-sm">
              <option value="">Select a reason...</option>
              <option value="Violation of platform terms">Violation of platform terms</option>
              <option value="Fraudulent or misleading KYC documents">Fraudulent or misleading KYC documents</option>
              <option value="Multiple attendee complaints">Multiple attendee complaints</option>
              <option value="Failure to fulfil event obligations">Failure to fulfil event obligations</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSuspendUserId(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleStatusChange(suspendUserId, 'SUSPENDED', suspendReason)} disabled={busy || !suspendReason} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"><div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-3">{icon}</div><p className="text-xs text-slate-500 mb-1">{label}</p><p className="font-bold text-slate-800 dark:text-slate-100">{value}</p></div>;
}
