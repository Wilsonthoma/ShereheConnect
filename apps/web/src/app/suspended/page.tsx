'use client';

import { AlertOctagon, LogOut, Mail } from 'lucide-react';
import { clearAuth, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SuspendedPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setUserName(user.fullName);
      if (user.suspensionReason) setReason(user.suspensionReason);
    }
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-red-950/50 flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
        
        {userName && (
          <p className="text-sm text-slate-400 mb-4">
            Hello, <span className="font-semibold text-white">{userName}</span>
          </p>
        )}

        {reason && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-[0.65rem] text-red-400 uppercase tracking-wider font-bold mb-1">
              Reason for suspension
            </p>
            <p className="text-sm text-red-200 font-medium">{reason}</p>
          </div>
        )}

        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
          Your account has been suspended by an administrator. You cannot access the platform, create events, or manage your profile until this is resolved.
        </p>
        
        <div className="space-y-3">
          <a href="mailto:support@shereheconnect.com" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-gradient text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all">
            <Mail className="w-4 h-4" /> Contact Support
          </a>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 text-slate-400 font-semibold hover:text-white hover:bg-slate-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
