'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import {
  getUser,
  getInitials,
  isLoggedIn,
  clearAuth,
} from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Language } from '@/lib/i18n/translations';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
];

type OpenPanel = 'menu' | 'language' | 'notifications' | 'account' | null;
type MobileSection =
  | 'language'
  | 'myEvents'
  | 'account'
  | 'company'
  | 'help'
  | 'organizers'
  | null;

export function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MobileSection>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLandingPage = pathname === '/';

  /* ---------- Auth sync ---------- */
  useEffect(() => {
    const sync = () => {
      setLoggedIn(isLoggedIn());
      setUser(getUser());
    };
    sync();
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  /* ---------- Outside click closes desktop panels ---------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ---------- Close on route change ---------- */
  useEffect(() => {
    setOpenPanel(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, [pathname]);

  /* ---------- Body scroll lock when mobile panel open ---------- */
  useEffect(() => {
    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } else {
      const top = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      if (top) {
        window.scrollTo(0, parseInt(top || '0', 10) * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
    };
  }, [mobileOpen]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenPanel(null), 300);
  }, [cancelClose]);

  const openMenu = (panel: OpenPanel) => {
    cancelClose();
    setOpenPanel(panel);
  };

  const toggleMobileSection = (section: MobileSection) => {
    setMobileSection((prev) => (prev === section ? null : section));
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  const initials = user ? getInitials(user.fullName) : 'U';

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  /* ============================================
     MEGA MENU COLUMNS
     ============================================ */
  type MegaColumn = {
    heading: string;
    items: { href: string; label: string }[];
  };

  const guestMenuColumns: MegaColumn[] = [
    ...(isLandingPage
      ? [
          {
            heading: t('nav.forOrganizers'),
            items: [
              { href: '/organizers', label: t('nav.whySherehe') },
              { href: '/organizers#pricing', label: t('nav.pricing') },
              { href: '/organizers#features', label: t('nav.features') },
              { href: '/register', label: t('nav.getStarted') },
            ],
          },
        ]
      : []),
    {
      heading: t('nav.company'),
      items: [
        { href: '/about', label: t('nav.aboutUs') },
        { href: '/contact', label: t('nav.contactUs') },
        { href: '/blog', label: t('nav.blog') },
        { href: '/careers', label: t('nav.careers') },
      ],
    },
    {
      heading: t('nav.help'),
      items: [
        { href: '/help', label: t('nav.helpCenter') },
        { href: '/faq', label: t('nav.faqs') },
        { href: '/privacy', label: t('nav.privacy') },
        { href: '/terms', label: t('nav.terms') },
      ],
    },
  ];

  const userMenuColumns: MegaColumn[] = [
    ...(isLandingPage
      ? [
          {
            heading: t('nav.forOrganizers'),
            items: [
              { href: '/organizers', label: t('nav.whySherehe') },
              { href: '/organizers#pricing', label: t('nav.pricing') },
              { href: '/organizers#features', label: t('nav.features') },
            ],
          },
        ]
      : []),
    {
      heading: t('nav.company'),
      items: [
        { href: '/about', label: t('nav.aboutUs') },
        { href: '/contact', label: t('nav.contactUs') },
        { href: '/blog', label: t('nav.blog') },
        { href: '/careers', label: t('nav.careers') },
      ],
    },
    {
      heading: t('nav.help'),
      items: [
        { href: '/help', label: t('nav.helpCenter') },
        { href: '/faq', label: t('nav.faqs') },
        { href: '/privacy', label: t('nav.privacy') },
        { href: '/terms', label: t('nav.terms') },
      ],
    },
  ];

  const columns = loggedIn ? userMenuColumns : guestMenuColumns;

  /* ============================================
     MEGA PANEL RENDERER (desktop)
     ============================================ */
  const renderMegaPanel = () => {
    if (openPanel === 'menu') {
      return (
        <div className="container-fluid py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {columns.map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-gold transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (openPanel === 'language') {
      return (
        <div className="container-fluid py-6">
          <div className="max-w-md mx-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4 text-center">
              {t('nav.chooseLanguage')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpenPanel(null);
                  }}
                  className={`flex items-center justify-center px-5 py-4 rounded-xl font-semibold transition-all ${
                    language === lang.code
                      ? 'bg-gold/10 text-gold'
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-gold'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (openPanel === 'notifications') {
      return (
        <div className="container-fluid py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gold">
                {t('nav.notifications')}
              </h4>
              <button className="text-xs font-semibold text-gold hover:underline">
                {t('nav.markAllRead')}
              </button>
            </div>
            <div className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
              {t('nav.noNotifications')}
            </div>
          </div>
        </div>
      );
    }

    if (openPanel === 'account') {
      if (!loggedIn) {
        return (
          <div className="container-fluid py-6">
            <div className="max-w-md mx-auto text-center">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {t('nav.welcome')}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                {t('nav.loginPrompt')}
              </p>
              <Link
                href="/login"
                onClick={() => setOpenPanel(null)}
                className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-brand-gradient text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                {t('nav.login')}
              </Link>
            </div>
          </div>
        );
      }

      return (
        <div className="container-fluid py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
                {t('nav.myEvents')}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/tickets"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-gold transition-colors"
                  >
                    {t('nav.myTickets')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/bookings"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-gold transition-colors"
                  >
                    {t('nav.myBookings')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/bookings?status=past"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-gold transition-colors"
                  >
                    {t('nav.pastEvents')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-4">
                {t('nav.account')}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-gold transition-colors"
                  >
                    {t('nav.dashboard')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-gold transition-colors"
                  >
                    {t('nav.myProfile')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-gold transition-colors"
                  >
                    {t('nav.settings')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  /* ============================================
     RENDER
     ============================================ */
  const NAV_HEIGHT = 'h-16 md:h-[70px]';

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        bg-white dark:bg-slate-950
        border-b border-slate-200 dark:border-slate-800
        shadow-sm dark:shadow-lg
        transition-colors
      "
    >
      <div ref={navRef} className="relative">
        <div className="container-fluid">
          <div
            className={`relative flex items-center justify-between ${NAV_HEIGHT} gap-3`}
          >
            {/* ==================== LEFT ZONE ==================== */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 shrink-0 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <span
                    className="text-white text-lg font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    S
                  </span>
                </div>
                <span className="font-display text-base sm:text-lg lg:text-xl text-slate-900 dark:text-white tracking-wide">
                  ShereheConnect
                </span>
              </Link>

              {/* Menu trigger */}
              <button
                onMouseEnter={() => openMenu('menu')}
                onMouseLeave={scheduleClose}
                onClick={() =>
                  setOpenPanel(openPanel === 'menu' ? null : 'menu')
                }
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                  openPanel === 'menu'
                    ? 'text-gold bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{t('nav.menu')}</span>
                <span
                  className={`text-xs transition-transform duration-200 ${
                    openPanel === 'menu' ? 'rotate-180' : ''
                  }`}
                >
                  ▾
                </span>
              </button>

              {/* Language trigger */}
              <button
                onMouseEnter={() => openMenu('language')}
                onMouseLeave={scheduleClose}
                onClick={() =>
                  setOpenPanel(openPanel === 'language' ? null : 'language')
                }
                className={`hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                  openPanel === 'language'
                    ? 'text-gold bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>
                  {LANGUAGES.find((l) => l.code === language)?.label ||
                    'English'}
                </span>
                <span
                  className={`text-xs transition-transform duration-200 ${
                    openPanel === 'language' ? 'rotate-180' : ''
                  }`}
                >
                  ▾
                </span>
              </button>
            </div>

            {/* ==================== CENTER ZONE (absolute) ==================== */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center pointer-events-none">
              <Link
                href="/events"
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap pointer-events-auto ${
                  isActive('/events')
                    ? 'text-gold bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t('nav.events')}
              </Link>
            </div>

            {/* ==================== RIGHT ZONE ==================== */}
            <div className="flex items-center justify-end gap-1.5 md:gap-2 min-w-0 shrink-0">
              <ThemeToggle />

              {!isLandingPage && (
                <button
                  onMouseEnter={() => openMenu('notifications')}
                  onMouseLeave={scheduleClose}
                  onClick={() =>
                    setOpenPanel(
                      openPanel === 'notifications' ? null : 'notifications',
                    )
                  }
                  aria-label={t('nav.notifications')}
                  className={`hidden md:flex relative w-10 h-10 rounded-full items-center justify-center transition-all ${
                    openPanel === 'notifications'
                      ? 'text-gold bg-slate-100 dark:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
                </button>
              )}

              {!loggedIn ? (
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center justify-center px-4 lg:px-5 py-2 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all shrink-0"
                >
                  {t('nav.login')}
                </Link>
              ) : (
                <button
                  onMouseEnter={() => openMenu('account')}
                  onMouseLeave={scheduleClose}
                  onClick={() =>
                    setOpenPanel(openPanel === 'account' ? null : 'account')
                  }
                  className={`hidden md:flex items-center gap-2 px-2 lg:px-3 py-2 rounded-full border transition-all shrink-0 ${
                    openPanel === 'account'
                      ? 'border-gold bg-slate-100 dark:bg-slate-800 text-gold'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-gold/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </span>
                  <span className="hidden xl:inline text-sm font-semibold">
                    {user?.fullName?.split(' ')[0] || t('nav.account')}
                  </span>
                  <span
                    className={`text-xs transition-transform duration-200 ${
                      openPanel === 'account' ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
              >
                {mobileOpen ? (
                  <span className="text-xl font-bold leading-none">×</span>
                ) : (
                  <span className="text-xl font-bold leading-none">☰</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================== DESKTOP MEGA PANEL ==================== */}
        {openPanel && (
          <div
            className="hidden md:block absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl z-40 animate-fade-in-up"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            {renderMegaPanel()}
          </div>
        )}

        {/* ==================== MOBILE PANEL ==================== */}
        {mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[calc(100vh-64px)] overflow-y-auto z-40">
            <div className="container-fluid py-2">
              {/* Language */}
              <MobileAccordion
                label={`${t('nav.language')} · ${
                  LANGUAGES.find((l) => l.code === language)?.label ||
                  'English'
                }`}
                open={mobileSection === 'language'}
                onToggle={() => toggleMobileSection('language')}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setMobileSection(null);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      language === lang.code
                        ? 'text-gold bg-gold/5'
                        : 'text-slate-600 dark:text-slate-300 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <span className="text-gold">✓</span>
                    )}
                  </button>
                ))}
              </MobileAccordion>

              {/* Events */}
              <Link
                href="/events"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800 text-sm font-bold uppercase tracking-wider transition-colors ${
                  isActive('/events')
                    ? 'text-gold'
                    : 'text-slate-800 dark:text-slate-100 hover:text-gold'
                }`}
              >
                <span>{t('nav.events')}</span>
              </Link>

              {/* Logged-in: My Events */}
              {loggedIn && (
                <MobileAccordion
                  label={t('nav.myEvents')}
                  open={mobileSection === 'myEvents'}
                  onToggle={() => toggleMobileSection('myEvents')}
                >
                  <MobileLink
                    href="/tickets"
                    label={t('nav.myTickets')}
                    isActive={isActive('/tickets')}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileLink
                    href="/bookings"
                    label={t('nav.myBookings')}
                    isActive={isActive('/bookings')}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileLink
                    href="/bookings?status=past"
                    label={t('nav.pastEvents')}
                    isActive={false}
                    onClick={() => setMobileOpen(false)}
                  />
                </MobileAccordion>
              )}

              {/* Logged-in: Account */}
              {loggedIn && (
                <MobileAccordion
                  label={t('nav.account')}
                  open={mobileSection === 'account'}
                  onToggle={() => toggleMobileSection('account')}
                >
                  <MobileLink
                    href="/dashboard"
                    label={t('nav.dashboard')}
                    isActive={isActive('/dashboard')}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileLink
                    href="/profile"
                    label={t('nav.myProfile')}
                    isActive={isActive('/profile')}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileLink
                    href="/settings"
                    label={t('nav.settings')}
                    isActive={isActive('/settings')}
                    onClick={() => setMobileOpen(false)}
                  />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-3 rounded-lg text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/5 transition-all"
                  >
                    {t('nav.logout')}
                  </button>
                </MobileAccordion>
              )}

              {/* Notifications */}
              {!isLandingPage && (
                <Link
                  href="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800 text-sm font-bold uppercase tracking-wider transition-colors ${
                    isActive('/notifications')
                      ? 'text-gold'
                      : 'text-slate-800 dark:text-slate-100 hover:text-gold'
                  }`}
                >
                  <span>{t('nav.notifications')}</span>
                </Link>
              )}

              {/* Company */}
              <MobileAccordion
                label={t('nav.company')}
                open={mobileSection === 'company'}
                onToggle={() => toggleMobileSection('company')}
              >
                <MobileLink
                  href="/about"
                  label={t('nav.aboutUs')}
                  isActive={isActive('/about')}
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  href="/contact"
                  label={t('nav.contactUs')}
                  isActive={isActive('/contact')}
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  href="/blog"
                  label={t('nav.blog')}
                  isActive={isActive('/blog')}
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  href="/careers"
                  label={t('nav.careers')}
                  isActive={isActive('/careers')}
                  onClick={() => setMobileOpen(false)}
                />
              </MobileAccordion>

              {/* Help */}
              <MobileAccordion
                label={t('nav.help')}
                open={mobileSection === 'help'}
                onToggle={() => toggleMobileSection('help')}
              >
                <MobileLink
                  href="/help"
                  label={t('nav.helpCenter')}
                  isActive={isActive('/help')}
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  href="/faq"
                  label={t('nav.faqs')}
                  isActive={isActive('/faq')}
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  href="/privacy"
                  label={t('nav.privacy')}
                  isActive={isActive('/privacy')}
                  onClick={() => setMobileOpen(false)}
                />
                <MobileLink
                  href="/terms"
                  label={t('nav.terms')}
                  isActive={isActive('/terms')}
                  onClick={() => setMobileOpen(false)}
                />
              </MobileAccordion>

              {/* For Organizers — landing + guest only */}
              {isLandingPage && !loggedIn && (
                <MobileAccordion
                  label={t('nav.forOrganizers')}
                  open={mobileSection === 'organizers'}
                  onToggle={() => toggleMobileSection('organizers')}
                >
                  <MobileLink
                    href="/organizers"
                    label={t('nav.whySherehe')}
                    isActive={isActive('/organizers')}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileLink
                    href="/organizers#pricing"
                    label={t('nav.pricing')}
                    isActive={false}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileLink
                    href="/organizers#features"
                    label={t('nav.features')}
                    isActive={false}
                    onClick={() => setMobileOpen(false)}
                  />
                  <MobileLink
                    href="/register"
                    label={t('nav.getStarted')}
                    isActive={isActive('/register')}
                    onClick={() => setMobileOpen(false)}
                  />
                </MobileAccordion>
              )}

              {/* Login CTA — guest */}
              {!loggedIn && (
                <div className="py-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  >
                    {t('nav.login')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ============================================
   MobileAccordion — full-width collapsible
   ============================================ */
function MobileAccordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 hover:text-gold transition-colors"
      >
        <span>{label}</span>
        <span
          className={`text-xs transition-transform duration-200 ${
            open ? 'rotate-180 text-gold' : 'text-slate-400'
          }`}
        >
          ▾
        </span>
      </button>
      {open && <div className="pb-3 space-y-0.5">{children}</div>}
    </div>
  );
}

/* ============================================
   MobileLink — flat link inside accordion
   ============================================ */
function MobileLink({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
        isActive
          ? 'text-gold bg-gold/5'
          : 'text-slate-600 dark:text-slate-300 hover:text-gold hover:bg-slate-100 dark:hover:bg-slate-900'
      }`}
    >
      {label}
    </Link>
  );
}