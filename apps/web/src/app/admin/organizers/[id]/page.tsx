'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileText, 
  Image as ImageIcon, Eye, X, ShieldCheck 
} from 'lucide-react';
import { adminOrganizersApi } from '@/lib/adminOrganizersApi';
import { toast } from '@/lib/toast';

export default function AdminOrganizerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  
  const [showActions, setShowActions] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; type: string; fileName: string } | null>(null);
  
  // Suspension Modal State
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const load = () => {
    setLoading(true);
    adminOrganizersApi
      .detail(id)
      .then((res) => {
        setData(res);
        setNotes(res.kycNotes || '');
      })
      .catch((err) => toast.error('Failed to load', err?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handleKyc = async (status: string, reason?: string) => {
    if (status === 'REJECTED' && !notes.trim()) {
      return toast.error('Reason required', 'Please enter a reason in the notes box.');
    }
    if (status === 'SUSPENDED' && !reason) {
      return toast.error('Reason required', 'Please select a reason for suspension.');
    }
    
    setBusy(true);
    try {
      await adminOrganizersApi.reviewKyc(id, status, reason || notes);
      toast.success('KYC Updated', `Status set to ${status.replace('_', ' ')}.`);
      setShowActions(false);
      setSuspendModalOpen(false);
      setSuspendReason('');
      await load();
    } catch (err: any) {
      toast.error('Action failed', err?.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePayment = async (paymentId: string) => {
    setBusy(true);
    try {
      await adminOrganizersApi.approvePaymentMethod(paymentId);
      toast.success('Payment method approved');
      await load();
    } catch (err: any) {
      toast.error('Action failed', err?.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-spin text-gold">Loading...</div>;
  if (!data) return <div className="p-20 text-center">Not found</div>;

  const isVerified = data.kycStatus === 'VERIFIED';
  const isSuspended = data.kycStatus === 'SUSPENDED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => router.push('/admin/organizers')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-gold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to list
      </button>

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">{data.businessName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{data.user?.email} · {data.phone} · KRA PIN: <span className="font-mono">{data.kraPin}</span></p>
        </div>
        {isVerified && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" /> Verified Organizer
          </span>
        )}
      </div>

      {isSuspended && (
        <div className="bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-900/50 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-800 dark:text-red-300 mb-1">Account Suspended</p>
            <p className="text-sm text-red-700 dark:text-red-400">{data.suspensionReason || 'No reason provided.'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">KYC Documents</h2>
            {(!data.kycDocuments || data.kycDocuments.length === 0) ? (
              <p className="text-sm text-slate-500">No documents uploaded</p>
            ) : (
              <ul className="space-y-3">
                {data.kycDocuments.map((doc: any, i: number) => {
                  const isPdf = doc.url.toLowerCase().endsWith('.pdf');
                  return (
                    <li key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group">
                      {isPdf ? <FileText className="w-6 h-6 text-red-500 shrink-0" /> : <ImageIcon className="w-6 h-6 text-blue-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{doc.type.replace('_', ' ')}</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                          {doc.fileName}
                        </p>
                      </div>
                      <button 
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-400 hover:text-gold hover:bg-gold/10 transition-colors shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">Payment Methods</h2>
            {data.paymentMethods.map((pm: any) => (
              <div key={pm.id} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-xl mb-2">
                <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{pm.methodType}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pm.shortcode || pm.phoneNumber || pm.accountNumber}</p>
                </div>
                {pm.isActive ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded">Approved</span>
                ) : (
                  <button onClick={() => handlePayment(pm.id)} disabled={busy} className="text-xs font-bold text-white bg-gold px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-2xl border p-6 ${isVerified && !showActions ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">KYC Status</h2>
            
            {isVerified && !showActions ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-300 mb-1">All Verified</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mb-4">
                  This organizer is fully approved.
                </p>
                <button
                  onClick={() => setShowActions(true)}
                  className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors underline decoration-slate-300 dark:decoration-slate-600 underline-offset-4"
                >
                  Revoke, Suspend, or Change Status
                </button>
              </div>
            ) : (
              <>
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                  Current Status: <span className="text-slate-800 dark:text-slate-100">{data.kycStatus.replace('_', ' ')}</span>
                </p>
                
                <textarea
                  placeholder="Reason / feedback (required for rejection)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm mb-4 h-20 resize-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-gold"
                />

                <div className="flex flex-col gap-2">
                  {data.kycStatus !== 'VERIFIED' && (
                    <>
                      <button onClick={() => handleKyc('VERIFIED')} disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white disabled:opacity-50 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve KYC
                      </button>
                      <button onClick={() => handleKyc('NEEDS_REVISION')} disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500 hover:text-white disabled:opacity-50 transition-colors">
                        <AlertTriangle className="w-3.5 h-3.5" /> Request Changes
                      </button>
                    </>
                  )}
                  
                  <button onClick={() => handleKyc('REJECTED')} disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Reject KYC
                  </button>
                  
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                    <button onClick={() => setSuspendModalOpen(true)} disabled={busy} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 disabled:opacity-50 transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5" /> Suspend Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Suspension Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && setSuspendModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">Suspend Account</h3>
            <p className="text-sm text-slate-500 mb-4">
              You are about to suspend <strong>{data.businessName}</strong>.
            </p>

            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Reason for Suspension *
            </label>
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
              <button onClick={() => handleKyc('SUSPENDED', suspendReason)} disabled={busy || !suspendReason} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {busy ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal Viewer */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setPreviewDoc(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{previewDoc.type.replace('_', ' ')}</h3>
                <p className="text-xs text-slate-500">{previewDoc.fileName}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[50vh]">
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-lg border-0" title={previewDoc.fileName} />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.fileName} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
