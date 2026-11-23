'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui';
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
    const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && (parsed.email || parsed.id || parsed.name)) {
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

export function CTABand() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [user, setUser] = useState<SessionUser | null>(() => readCachedSessionUser());

  // ============================================
  // AUTH SESSION SYNC (STORAGE, CUSTOM EVENT & API)
  // ============================================
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

  // ============================================
  // PINNED SCROLL-DRIVEN PROGRESS
  // ============================================
  const SCROLL_ROOM_VH = 120;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
    let target = 0;
    let current = 0;
    let animating = false;

    const computeTarget = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      if (scrollable <= 0) return 0;
      const scrolled = -rect.top;
      return Math.max(0, Math.min(1, scrolled / scrollable));
    };

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.0003) {
        current = target;
        animating = false;
      } else {
        current += diff * 0.06;
        animating = true;
      }
      setProgress(current);
      if (animating) rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = computeTarget();
      if (!animating) {
        animating = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    target = computeTarget();
    current = target;
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // ============================================
  // SEQUENTIAL REVEAL PER ELEMENT
  // ============================================
  const getReveal = (
    start: number,
    duration = 0.3,
    axis: 'y' | 'scale' | 'none' = 'y',
  ) => {
    const end = start + duration;
    const local = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const eased = 1 - Math.pow(1 - local, 5);

    if (axis === 'y') {
      return {
        opacity: eased,
        transform: `translateY(${28 * (1 - eased)}px)`,
      };
    }
    if (axis === 'scale') {
      return {
        opacity: eased,
        transform: `scale(${0.94 + 0.06 * eased})`,
      };
    }
    return { opacity: eased };
  };

  const headingReveal = getReveal(0.0, 0.3, 'y');
  const subtextReveal = getReveal(0.2, 0.3, 'y');
  const buttonsReveal = getReveal(0.45, 0.35, 'scale');

  const isSignedIn = Boolean(user);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `calc(100vh + ${SCROLL_ROOM_VH}vh)` }}
    >
      <section className="sticky top-0 h-screen h-[100dvh] flex items-center bg-gradient-to-b from-slate-50 via-sky-50/60 to-white dark:from-slate-950 dark:via-[#14161b] dark:to-[#111318] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300 border-t border-slate-200/70 dark:border-white/10">
        {/* Ambient glow — uniform across light & dark themes */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-30 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(circle at 15% 30%, rgba(245,158,11,0.10), transparent 40%), radial-gradient(circle at 85% 70%, rgba(56,189,248,0.10), transparent 40%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          {/* HEADING */}
          <h2
            className="heading-display text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 text-slate-900 dark:text-white leading-[1.12] tracking-tight transition-colors"
            style={headingReveal}
          >
            {t('cta.heading.line1')}
            <br />
            {t('cta.heading.line2a')}{' '}
            <span className="text-brand-gradient">
              {t('cta.heading.line2b')}
            </span>
            ?
          </h2>

          {/* SUBTEXT */}
          <p
            className="text-sm sm:text-base md:text-lg mb-7 sm:mb-10 max-w-2xl mx-auto leading-relaxed text-slate-600 dark:text-slate-400 transition-colors"
            style={subtextReveal}
          >
            {t('cta.subtitle')}
          </p>

          {/* AUTH-AWARE BUTTONS */}
          <div
            className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto"
            style={buttonsReveal}
          >
            {isSignedIn ? (
              <>
                <Link href="/events" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" fullWidth>
                    {t('cta.browse')} →
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth>
                    {user?.name ? `${user.name} · Dashboard` : 'Go to Dashboard'}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" fullWidth>
                    {t('cta.getStarted')} →
                  </Button>
                </Link>
                <Link href="/events" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth>
                    {t('cta.browse')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}