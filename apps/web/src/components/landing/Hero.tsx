'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Typewriter } from '../ui';
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function Hero() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Staggered entrance helper — returns inline style for each step
  const step = (delayMs: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-deep">
      {/* ============================================
          BACKGROUND VIDEO — African event crowd
      ============================================ */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1600"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
      >
        <source
          src="https://videos.pexels.com/video-files/3415493/3415493-uhd_2560_1440_25fps.mp4"
          type="video/mp4"
        />
        <source
          src="https://videos.pexels.com/video-files/2022395/2022395-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      {/* ============================================
          BOTTOM BLEND — theme-aware
      ============================================ */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] z-[2] pointer-events-none hero-bottom-blend" />

      {/* ============================================
          CONTENT — vertically centered with flex
      ============================================ */}
      <div className="relative z-[3] container-fluid w-full flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto w-full">
          {/* STEP 1 — HEADLINE */}
          <h1
            className="heading-display heading-xl text-white mb-6 md:mb-8 drop-shadow-2xl"
            style={step(0)}
          >
            {t('hero.title.line1')}
            <br />
            {t('hero.title.line2')}
          </h1>

          {/* STEP 2 — TYPED TAGLINE */}
          <p
            className="text-fluid-lg md:text-fluid-xl text-white/95 max-w-3xl mx-auto mb-4 leading-relaxed drop-shadow-lg min-h-[2.5em]"
            style={step(150)}
          >
            {t('hero.tagline.prefix')}{' '}
            <Typewriter
              words={[
                'festivals.',
                'conferences.',
                'concerts.',
                'workshops.',
                'experiences.',
              ]}
              className="text-gold-light font-semibold"
            />
          </p>

          {/* STEP 3 — SUBTEXT */}
          <p
            className="text-fluid-base text-white/80 max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed"
            style={step(300)}
          >
            {t('hero.subtitle')}
          </p>

          {/* STEP 4 — SEARCH BAR */}
          <div className="max-w-2xl mx-auto mb-10" style={step(450)}>
            <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-2xl p-2 flex items-center gap-1 md:gap-2 ring-1 ring-white/20">
              <Search className="ml-3 md:ml-4 w-4 h-4 md:w-5 md:h-5 text-gray shrink-0" />
              <input
                type="text"
                placeholder={t('hero.search.placeholder')}
                className="flex-1 bg-transparent outline-none text-sm py-3 placeholder:text-gray-light min-w-0"
              />
              <button className="hidden sm:flex items-center gap-2 px-3 py-3 text-sm font-medium text-gray hover:text-gold transition shrink-0">
                <MapPin className="w-4 h-4" />
                <span className="hidden lg:inline">
                  {t('hero.search.nearMe')}
                </span>
              </button>
              <Link href="/events" className="shrink-0">
                <Button variant="primary" size="sm">
                  {t('hero.search.button')}
                </Button>
              </Link>
            </div>
          </div>

          {/* STEP 5 — CTA BUTTONS */}
          <div
            className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center"
            style={step(600)}
          >
            <Link href="/events">
              <Button variant="primary" size="lg" fullWidth>
                {t('hero.cta.browse')}
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline-light" size="lg" fullWidth>
                {t('hero.cta.organizer')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}