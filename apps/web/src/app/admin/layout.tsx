'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { getUser, getToken, clearAuth } from '@/lib/auth';
import { NotificationBell } from '@/components/shared/NotificationBell';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/organizers', label: 'KYC Requests', icon: Building2 },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user || user.role !== 'ADMIN') {
      router.replace('/login?next=/admin/dashboard');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-light dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md">
              <span
                className="text-white text-base font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                S
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base text-slate-900 dark:text-white">
                Admin
              </span>
              <span className="text-[0.6rem] text-gold uppercase tracking-wider mt-0.5">
                ShereheConnect
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-gold/10 text-gold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-gold'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 flex items-center justify-end px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <NotificationBell />
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
