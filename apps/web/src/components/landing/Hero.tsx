'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button, Typewriter } from '../ui';
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const KenyaRouteGlobe = dynamic(
  () => import('../ui/KenyaRouteGlobe').then((mod) => mod.KenyaRouteGlobe),
  { ssr: false },
);

function readIsDarkTheme(): boolean {
  if (typeof document === 'undefined') return true;
  const html = document.documentElement;
  const body = document.body;
  const attr =
    html.getAttribute('data-theme') ||
    html.getAttribute('data-color-mode') ||
    body?.getAttribute('data-theme') ||
    body?.getAttribute('data-color-mode');

  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  if (html.classList.contains('dark') || body?.classList.contains('dark')) {
    return true;
  }
  if (html.classList.contains('light') || body?.classList.contains('light')) {
    return false;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

export function Hero() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [isDark, setIsDark] = useState<boolean>(() => readIsDarkTheme());

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateTheme = () => setIsDark(readIsDarkTheme());
    updateTheme();

    if (typeof document === 'undefined') return;

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-color-mode'],
    });
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'data-color-mode'],
      });
    }

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', updateTheme);

    return () => {
      observer.disconnect();
      media?.removeEventListener('change', updateTheme);
    };
  }, []);

  const step = (delayMs: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 650ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 650ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/events?q=${encodeURIComponent(trimmed)}` : '/events');
  };

  return (
    <section className="relative min-h-[calc(100svh-4rem)] sm:min-h-[calc(100vh-4.375rem)] flex items-center overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#2B2B2B] text-slate-900 dark:text-white transition-colors duration-300">
      {/* 3D map of Kenya: subtle on mobile, balanced on tablet, prominent on desktop */}
      <div
        className="absolute inset-0 w-full h-full z-[1] opacity-25 sm:opacity-75 lg:opacity-100"
        style={step(200)}
      >
        <KenyaRouteGlobe
          className="w-full h-full"
          theme={isDark ? 'dark' : 'light'}
        />
      </div>

      {/* Smooth left-to-right fade so text remains legible while blending into the map */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] hidden dark:block"
        style={{
          background:
            'linear-gradient(to right, rgba(43,43,43,0.98) 0%, rgba(43,43,43,0.94) 26%, rgba(43,43,43,0.78) 38%, rgba(43,43,43,0.46) 48%, rgba(43,43,43,0.16) 58%, rgba(43,43,43,0) 68%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] block dark:hidden"
        style={{
          background:
            'linear-gradient(to right, rgba(248,250,252,0.98) 0%, rgba(248,250,252,0.94) 28%, rgba(248,250,252,0.8) 40%, rgba(248,250,252,0.48) 50%, rgba(248,250,252,0.16) 60%, rgba(248,250,252,0) 72%)',
        }}
      />

      {/* Soft edge vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] hidden dark:block"
        style={{
          background:
            'radial-gradient(ellipse at 72% 50%, rgba(43,43,43,0) 45%, rgba(43,43,43,0.55) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] block dark:hidden"
        style={{
          background:
            'radial-gradient(ellipse at 72% 50%, rgba(248,250,252,0) 48%, rgba(248,250,252,0.45) 100%)',
        }}
      />

      {/* Bottom Theme Blend */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 sm:h-24 z-[3] hero-bottom-blend" />

      {/* Foreground Content & Typewriter */}
      <div className="pointer-events-none relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-16 lg:py-20">
        <div className="max-w-xl lg:max-w-2xl flex flex-col justify-center text-left">
          <div
            className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/[0.06] dark:bg-[#3A3A3A] backdrop-blur-md border border-slate-900/10 dark:border-slate-600 mb-3 sm:mb-6 w-fit max-w-full"
            style={step(0)}
          >
            <span className="w-2 h-2 rounded-full bg-coddy-blue animate-pulse shrink-0" />
            <p             className="text-[11px] sm:text-sm font-medium text-slate-800 dark:text-white">
              {t('hero.tagline.prefix')}{' '}
              <Typewriter
                words={[
                  'festivals.',
                  'conferences.',
                  'concerts.',
                  'workshops.',
                  'experiences.',
                ]}
                className="text-coddy-blue font-bold"
              />
            </p>
          </div>

          <h1
            className="heading-display text-[1.85rem] leading-[1.06] min-[390px]:text-[2.1rem] sm:text-5xl lg:text-6xl text-slate-900 dark:text-white mb-3 sm:mb-5 sm:leading-[1.12] tracking-tight drop-shadow-sm"
            style={step(120)}
          >
            {t('hero.title.line1')}
            <br />
            <span className="text-brand-gradient">{t('hero.title.line2')}</span>
          </h1>

          <p
            className="text-xs sm:text-lg text-slate-600 dark:text-white/75 max-w-lg mb-4 sm:mb-8 leading-relaxed"
            style={step(240)}
          >
            {t('hero.subtitle')}
          </p>

          <form
            onSubmit={handleSearch}
            className="pointer-events-auto w-full max-w-xl mb-4 sm:mb-8"
            style={step(360)}
          >
            <div className="bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 ring-1 ring-slate-900/10 dark:ring-white/20 focus-within:ring-coddy-blue/70 transition">
              <Search className="ml-2.5 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-white/55 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('hero.search.placeholder')}
                aria-label={t('hero.search.placeholder')}
                className="flex-1 bg-transparent outline-none text-xs sm:text-sm py-2 sm:py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/45 min-w-0"
              />
              <Link
                href="/events"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-white/75 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 transition shrink-0"
              >
                <MapPin className="w-4 h-4 text-coddy-blue" />
                <span className="hidden lg:inline">{t('hero.search.nearMe')}</span>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-xl px-4 sm:px-5 shrink-0"
              >
                {t('hero.search.button')}
              </Button>
            </div>
          </form>

          <div
            className="pointer-events-auto flex flex-col sm:flex-row gap-3 justify-start"
            style={step(480)}
          >
            <Link href="/events" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-2xl px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
              >
                {t('hero.cta.browse')}
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="outline-light"
                size="lg"
                className="rounded-2xl px-6 sm:px-8 py-3.5 sm:py-4 border-slate-300 dark:border-white/20 text-slate-800 dark:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 w-full sm:w-auto"
              >
                {t('hero.cta.organizer')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}