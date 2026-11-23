'use client';

import { useCallback, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  ArrowLeft,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { getUser, getToken, clearAuth } from '@/lib/auth';
import { Button, FullPageLoader } from '@/components/ui';

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/organizers', label: 'KYC Requests', icon: Building2 },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
];

const NotificationBellLazy = dynamic(
  () =>
    import('@/components/shared/NotificationBell').then((mod) => ({
      default: mod.NotificationBell,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
    ),
  },
);

interface AdminSidebarProps {
  pathname: string;
  onLogout: () => void;
}

function AdminSidebarImpl({ pathname, onLogout }: AdminSidebarProps) {
  return (
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
          href="/admin/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-500"
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

const AdminSidebar = dynamic(() => Promise.resolve(AdminSidebarImpl), {
  ssr: false,
  loading: () => (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-3">
      <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800/70 animate-pulse"
        />
      ))}
    </aside>
  ),
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = getToken();
  const user = getUser();
  const ready = Boolean(token && user && user.role === 'ADMIN');

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user || user.role !== 'ADMIN') {
      router.replace('/login?next=/admin/dashboard');
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    clearAuth();
    router.replace('/login');
  }, [router]);

  if (!ready) {
    return <FullPageLoader message="Checking admin access..." />;
  }

  return (
    <div className="min-h-screen bg-light dark:bg-slate-950 flex">
      <AdminSidebar pathname={pathname} onLogout={handleLogout} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 flex items-center justify-end px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <NotificationBellLazy />
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}