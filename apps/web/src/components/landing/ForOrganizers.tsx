'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, ScrollFlipbook } from '../ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

function readCachedSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;

  const storageKeys = ['user', 'auth_user', 'currentUser', 'sherehe_user'];
  for (const key of storageKeys) {
    const raw =
      window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        (parsed.email || parsed.id || parsed.name)
      ) {
        return parsed as SessionUser;
      }
    } catch {
      // Ignore malformed JSON entries
    }
  }

  const token =
    window.localStorage.getItem('token') ||
    window.localStorage.getItem('auth_token') ||
    window.localStorage.getItem('accessToken') ||
    window.sessionStorage.getItem('token');

  return token ? { id: 'authenticated' } : null;
}

const BOOK_PAGES = [
  {
    src: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    alt: 'Football match stadium action',
    title: 'Nairobi Derby & Cup Clash',
    category: 'Football',
    venue: 'Nyayo National Stadium',
    date: '15 Mar 2026',
    price: 1000,
    href: '/events/nairobi-derby-cup-clash',
  },
  {
    src: 'https://images.unsplash.com/photo-1497271679421-ce9c3d6a31da?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    alt: 'Cultural traditions and heritage celebration',
    title: 'Coastal Heritage & Traditions Gala',
    category: 'Traditions',
    venue: 'Fort Jesus Grounds',
    date: '22 Apr 2026',
    price: 1500,
    href: '/events/coastal-heritage-traditions-gala',
  },
  {
    src: 'https://plus.unsplash.com/premium_photo-1664790560098-1fac17eb495e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    alt: 'Harusi wedding celebration and reception',
    title: 'Grand Harusi & Garden Reception',
    category: 'Harusi',
    venue: 'Karen Country Gardens',
    date: '10 May 2026',
    price: 2500,
    href: '/events/grand-harusi-garden-reception',
  },
  {
    src: 'https://images.unsplash.com/photo-1505147634308-9b83c4cb46b4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    alt: 'Live outdoor gathering and festival moments',
    title: 'Rift Valley Cultural Showcase',
    category: 'Culture',
    venue: 'Lake Nakuru Arena',
    date: '5 Jun 2026',
    price: 1200,
    href: '/events/rift-valley-cultural-showcase',
  },
  {
    src: 'https://images.unsplash.com/photo-1608009232260-9b527a5bb9bd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    alt: 'Community event and live gathering',
    title: 'Kisumu Lakeside Fest',
    category: 'Community',
    venue: 'Impala Grounds',
    date: '20 Jun 2026',
    price: 800,
    href: '/events/kisumu-lakeside-fest',
  },
];

export function ForOrganizers() {
  const { t } = useLanguage();
  const [user, setUser] = useState<SessionUser | null>(() =>
    readCachedSessionUser(),
  );

  useEffect(() => {
    const syncSession = () => {
      setUser(readCachedSessionUser());
    };

    syncSession();

    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const resolved =
          data.user && typeof data.user === 'object'
            ? (data.user as SessionUser)
            : data.email || data.id || data.name
              ? (data as SessionUser)
              : null;
        if (resolved) {
          setUser(resolved);
        }
      })
      .catch(() => {
        // Fallback to cached local/session storage state
      });

    window.addEventListener('storage', syncSession);
    window.addEventListener('auth-change', syncSession);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('auth-change', syncSession);
    };
  }, []);

  const benefits = [
    t('org.benefit1'),
    t('org.benefit2'),
    t('org.benefit3'),
    t('org.benefit4'),
  ];

  const isSignedIn = Boolean(user);

  return (
    <section className="relative bg-slate-50 dark:bg-[#2B2B2B] text-slate-900 dark:text-white transition-colors duration-300 overflow-x-clip border-t border-slate-200/70 dark:border-slate-700">
      {/* Subtle theme-matched ambient accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 45% 45% at 72% 50%, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0) 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-8 lg:gap-12 items-start">
          {/* Left: Sticky Organizer Pitch */}
          <div className="lg:sticky lg:top-24 py-10 sm:py-14 lg:min-h-screen lg:flex lg:flex-col lg:justify-center order-2 lg:order-1 min-w-0">
            <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl text-brand-gradient mb-4 sm:mb-6 leading-[1.12] tracking-tight">
              {t('org.heading.line1')}
              <br />
              {t('org.heading.line2')}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-xl">
              {t('org.subtitle')}
            </p>

            <ul className="space-y-3 sm:space-y-3.5 mb-8">
              {benefits.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-slate-800 dark:text-slate-200"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.45)]" />
                  <span className="font-medium text-sm sm:text-base leading-snug">
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            {!isSignedIn && (
              <Link href="/register" className="inline-block w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto rounded-2xl"
                >
                  {t('org.cta')} →
                </Button>
              </Link>
            )}
          </div>

          {/* Right: Full-track ScrollFlipbook */}
          <div className="relative order-1 lg:order-2 min-w-0 w-full">
            <ScrollFlipbook images={BOOK_PAGES} vhPerPaper={170} />
          </div>
        </div>
      </div>
    </section>
  );
}