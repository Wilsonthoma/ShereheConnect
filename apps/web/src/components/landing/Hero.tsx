'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Typewriter } from '../ui';
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CobeGlobe } from '../ui/CobeGlobe';

export function Hero() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Staggered entrance helper
  const step = (delayMs: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#2B2B2B]">
      {/* ============================================
          BACKGROUND GRADIENTS & GLOWS
      ============================================ */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-[#2B2B2B] to-[#2B2B2B] z-0" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-coddy-blue/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-coddy-blue-hover/10 rounded-full blur-3xl -z-10" />

      {/* ============================================
          BOTTOM BLEND — theme-aware
      ============================================ */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] z-[2] pointer-events-none hero-bottom-blend" />

      {/* ============================================
          MAIN CONTENT GRID
      ============================================ */}
      <div className="relative z-[3] container-fluid w-full px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
          
          {/* LEFT COLUMN — Text & Search */}
          <div className="flex flex-col justify-center text-left">
            
            {/* STEP 1 — TYPED TAGLINE (Moved to top) */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 w-fit"
              style={step(0)}
            >
              <span className="w-2 h-2 rounded-full bg-coddy-blue animate-pulse" />
              <p className="text-sm font-medium text-white/90">
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

            {/* STEP 2 — HEADLINE */}
            <h1
              className="heading-display text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-[1.15]"
              style={step(150)}
            >
              {t('hero.title.line1')}
              <br />
              <span className="text-brand-gradient">{t('hero.title.line2')}</span>
            </h1>

            {/* STEP 3 — SUBTEXT */}
            <p
              className="text-lg text-white/70 max-w-lg mb-8 leading-relaxed"
              style={step(300)}
            >
              {t('hero.subtitle')}
            </p>

            {/* STEP 4 — SEARCH BAR */}
            <div className="w-full max-w-lg mb-8" style={step(450)}>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex items-center gap-2 ring-1 ring-white/20">
                <Search className="ml-3 w-5 h-5 text-white/50 shrink-0" />
                <input
                  type="text"
                  placeholder={t('hero.search.placeholder')}
                  className="flex-1 bg-transparent outline-none text-sm py-3 text-white placeholder:text-white/40 min-w-0"
                />
                <button className="hidden sm:flex items-center gap-2 px-3 py-3 text-sm font-medium text-white/60 hover:text-white transition shrink-0">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden lg:inline">
                    {t('hero.search.nearMe')}
                  </span>
                </button>
                <Link href="/events" className="shrink-0">
                  <Button variant="primary" size="sm" className="bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-xl px-6">
                    {t('hero.search.button')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* STEP 5 — CTA BUTTONS */}
            <div
              className="flex flex-col sm:flex-row gap-3 justify-start"
              style={step(600)}
            >
              <Link href="/events">
                <Button variant="primary" size="lg" className="bg-coddy-blue hover:bg-coddy-blue-hover text-white border-none rounded-2xl px-8 py-4">
                  {t('hero.cta.browse')}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline-light" size="lg" className="rounded-2xl px-8 py-4 border-white/20 text-white hover:bg-white/10">
                  {t('hero.cta.organizer')}
                </Button>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN — Cobe Globe */}
          <div className="relative flex justify-center items-center h-[400px] lg:h-full lg:min-h-[600px]" style={step(300)}>
            {/* Glow behind the globe */}
            <div className="absolute inset-0 bg-coddy-blue/20 blur-[100px] rounded-full scale-75" />
            
            <CobeGlobe className="w-full max-w-[600px] z-10" />
          </div>
          
        </div>
      </div>
    </section>
  );
}