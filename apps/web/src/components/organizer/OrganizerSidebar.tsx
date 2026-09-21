'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Calendar,
  LayoutDashboard,
  Ticket,
  Users,
  BarChart3,
  CreditCard,
  UserCircle,
  Settings,
  Gem,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { getInitials } from '@/lib/auth';

interface OrganizerSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: '/organizer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/organizer/events', label: 'My Events', icon: Calendar },
  { href: '/organizer/attendees', label: 'Attendees', icon: Users },
  { href: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/organizer/payments', label: 'Payments', icon: CreditCard },
  { href: '/organizer/profile', label: 'Profile', icon: UserCircle },
];

const BOTTOM_ITEMS = [
  { href: '/organizer/subscription', label: 'Subscription', icon: Gem },
  { href: '/organizer/settings', label: 'Settings', icon: Settings },
];

export function OrganizerSidebar({ mobileOpen = false, onClose }: OrganizerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const initials = user ? getInitials(user.fullName) : 'U';

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const content = (
    <aside className="flex flex-col h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">

      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md">
            <Calendar className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base text-slate-800 dark:text-slate-100">
              ShereheConnect
            </span>
            <span className="text-[0.6rem] text-gold font-medium tracking-wider uppercase mt-0.5">
              Organizer
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-gold hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main nav */}
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />

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
                  : 'text-slate-600 dark:text-slate-400 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {user?.fullName || 'Organizer'}
            </div>
            <div className="text-xs text-gold mt-0.5">Organizer</div>
          </div>
          <button
            onClick={logout}
            aria-label="Logout"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red hover:bg-red/5 transition-colors shrink-0"
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
          <div className="absolute top-0 left-0 h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
