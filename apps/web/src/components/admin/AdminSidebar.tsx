'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  LayoutDashboard,
  Users,
  BadgeCheck,
  PartyPopper,
  CreditCard,
  Scale,
  Gem,
  BarChart3,
  MessageSquare,
  ScrollText,
  Settings,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { getInitials } from '@/lib/auth';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/kyc', label: 'KYC Queue', icon: BadgeCheck },
  { href: '/admin/events', label: 'Events', icon: PartyPopper },
  { href: '/admin/organizers', label: 'Organizers', icon: Calendar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/disputes', label: 'Disputes', icon: Scale },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Gem },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/support', label: 'Support', icon: MessageSquare },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

const BOTTOM_ITEMS = [
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const initials = user ? getInitials(user.fullName) : 'A';

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const content = (
    <aside className="flex flex-col h-full w-72 bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md">
            <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base text-white tracking-wide">
              ShereheConnect
            </span>
            <span className="text-[0.6rem] text-red font-bold tracking-wider uppercase mt-0.5">
              Admin
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red hover:bg-white/5"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="h-px bg-slate-800 my-3" />

        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">
              {user?.fullName || 'Administrator'}
            </div>
            <div className="text-xs text-red font-medium mt-0.5">Administrator</div>
          </div>
          <button
            onClick={logout}
            aria-label="Logout"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red hover:bg-red/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-40">
        {content}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute top-0 left-0 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
