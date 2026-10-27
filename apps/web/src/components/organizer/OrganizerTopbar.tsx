'use client';

import { Menu, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/lib/useAuth';
import { NotificationBell } from '@/components/shared/NotificationBell';

interface OrganizerTopbarProps {
  onOpenSidebar?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/organizer/dashboard': 'Dashboard',
  '/organizer/events': 'My Events',
  '/organizer/events/new': 'Create Event',
  '/organizer/attendees': 'Attendees',
  '/organizer/analytics': 'Analytics',
  '/organizer/payments': 'Payments',
  '/organizer/profile': 'Profile',
  '/organizer/subscription': 'Subscription',
  '/organizer/settings': 'Settings',
};

export function OrganizerTopbar({ onOpenSidebar }: OrganizerTopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getTitle = () => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    const base = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k));
    return base ? PAGE_TITLES[base] : 'Organizer';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 gap-4">

        {/* Left: mobile menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-gold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
            {getTitle()}
          </h1>
        </div>

        {/* Right: search, theme, notifications */}
        <div className="flex items-center gap-1 md:gap-2">

          {/* Search (desktop) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus-within:border-gold/50 rounded-full px-3 py-1.5 w-56 lg:w-72 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 min-w-0"
            />
          </div>

          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
